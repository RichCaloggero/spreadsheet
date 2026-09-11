import { not, isFormula } from "./utilities.js";
import { isLabel, toLabel, parseLabel } from "./coordinates.js";
import { requireGridcellRole } from "./grid.js";

class CellError {
static #codes = new Map([
["parse", "cannot parse formula"],
["grid","outside grid "],
["evaluation", "formula evaluation"],
["ref", "bad ref() expression: cell references like a1 not allowed"],
["circular", "circular reference (i.e. a1 refers to a2 refers to a1)"],
["not-a-number", "invalid real value i.e. 0/0 or sqrt(-1)"],
	["divide-by-zero", "division by zero"],
["compile", "math expression compilation error"],

	["unknown", "unknown error"],
]); // new Map

#code = "";
#detail = "";

constructor (code, detail = "") {
this.#code = code;
this.#detail = detail;
} // constructor

get code () {return this.#code;}
get detail () {return this.#detail;}
toString () {return `#${this.#code}`;} // toString

get description () {
const codes = CellError.#codes;
const code = codes.has(this.#code)? this.#code : "unknown";
return `${codes.get(code)}; ${this.detail}`;
} // description
} // class

export class Spreadsheet {
#cells = new Map();
#precedents = new Map();
#dependents = new Map();
#headerRows = new Set();
#headerColumns = new Set();

#rowCount = 0;
#columnCount = 0;

constructor () {
} // constructor

setGridSize (rowCount, columnCount) {
  this.#rowCount = rowCount;
  this.#columnCount = columnCount;
} // setGridSize

has (name) {return this.#cells.has(name);}
get allNames () {return [...this.#cells.keys()];}

get allCells () {
return [...this.#cells.keys()];
} // allCells
hasData () {return this.allCells.length > 0 && this.#headerRows.size > 0 && this.#headerColumns.size > 0;}


addHeaderRow (r) {this.#headerRows.add(r);}
deleteHeaderRow (r) {this.#headerRows.delete(r);}
addHeaderColumn (c) {this.#headerColumns.add(c);}
deleteHeaderColumn (c) {this.#headerColumns.delete(c);}
hasHeaderRow (r) {return this.#headerRows.has(r);}
hasHeaderColumn (c) {return this.#headerColumns.has(c);}


cellContents (name) {
  const cell = name? this.#cells.get(name) : null;
  
  // calculate role here because if cell isn't in map, we still want to render with correct role of columnheader, or rowheader if set; role is not property of cell
  const [r, c] = parseLabel(name);
const role = this.hasHeaderRow(r) && this.hasHeaderColumn(c)? ""
: this.hasHeaderRow(r)? "columnheader"
: this.hasHeaderColumn(c)? "rowheader"
: "";
if (not(role) && requireGridcellRole) role = "gridcell";

  if (not(cell)) return {name, input: null, role};

  const value = cell.value;
  const failed = value instanceof CellError;
  const result = {
    name: cell.name,
    role,
    input: cell.input,
    hasFormula: isFormula(cell.input),
    value: failed? String(value) : value ?? "",
    error: failed? value.code : "",
    description: failed? value.description : ""
  };

return result;
} // cellContents

load (modelData) {
	this.clear();
//console.log("spreadsheet cleared.");
//console.log(modelData);

for (const data of modelData.cells) {
	const cell = this.setInput(data.name, data.input, data.role);
} // for

this.#headerRows = new Set(modelData.headerRows);
this.#headerColumns = new Set(modelData.headerColumns);

this.recalculate([...this.#cells.keys()], false);
} // load

getData () {
const cells = [];
for (const cell of this.#cells.values()) cells.push(this.cellContents(cell.name));

const headerRows = [...this.#headerRows];
const headerColumns = [...this.#headerColumns];

return {
  version: "1.0",
  cells,
  headerRows, headerColumns
};
} // getData

clear () {
this.#cells.clear();
this.#precedents.clear();
this.#dependents.clear();
this.#headerRows.clear();
this.#headerColumns.clear();
} // clear


setCellContents (name, input) {
if (not(name)) {
throw new Error("setCellContents: cell label missing or invalid.");
} // if


const cell = this.setInput(name, input);
//console.log("setInput: ", cell);

return this.recalculate([name]);
} // setCellContents

setInput (name, input) {
if (not(isLabel(name))) throw new Error(`setInput: ${name} is an invalid label`);

input = input?.toString().trim() ?? "";
//console.log("setInput: ", name, input);

const cell = this.#cells.has(name)? this.#cells.get(name)
: {
name, input,
formula: "",
code: null,
get hasFormula () {return isFormula(this.input);},
value: input
}; // cell

cell.input = input;
this.#cells.set(name, cell);

this.#cleanupDependencies(cell.name);

if (isFormula(input)) {
cell.code = null;

cell.formula = createFormula(input.slice(1));
if (cell.formula instanceof CellError) {
cell.value = cell.formula;
return cell;
} // if

cell.formula = evaluateRefs(cell.formula, cell);
if (not(cell.formula)) return cell;

try {
cell.code = cell.formula.compile();
} catch (e) {
cell.code = null;
	cell.value = new CellError("compile", input);
return cell;
} // try

//console.log("setInput: formula ", cell.code);

for (const symbolName of getSymbols(cell.formula)) {
if (not(isLabel(symbolName))) {
cell.value = new CellError("parse", `bad cell label: ${symbolName}`);
cell.code = null;
return cell;
} // if

if (not(isInGrid(symbolName, this.#rowCount, this.#columnCount))) {
cell.value = new CellError("grid", `${symbolName} -> (${this.#rowCount}, ${this.#columnCount}).`);
cell.code = null;
return cell;
} // if

this.#precedentsOf(name).add(symbolName);
this.#dependentsOf(symbolName).add(cell.name);
} // for

} else {
const n = Number(input);
cell.value = (input !== "" && not(Number.isNaN(n))) ? n : input;
	cell.code = null;
} // if

return cell;
} // setInput

recalculate (names, expandDirty = true) {
// find dirty cells
const dirty = expandDirty? 
this.#computeDirtySet(names) : new Set(names);
//console.log("dirty: ", dirty);

const {order: sorted, cycles} = this.#topologicalSort(dirty);
//console.log("sorted, cycles: ", sorted, cycles);


for (const name of sorted) {
this.#evaluate(this.#cells.get(name));
} // for

for (const name of cycles) {
	this.#cells.get(name).value = new CellError("circular");
//console.log("recalculate: cycle ", this.#cells.get(name).value);
} // for


const result = [...sorted, ...cycles]; // array concatenation
//console.log("recalculate: result ", result);
return result;
} // recalculate


#computeDirtySet (names) {
const dirty = new Set(names);
//console.log("computeDirty: ", dirty);

for (const name of dirty) {
for (const d of this.#dependentsOf(name)) dirty.add(d);
} // for

return dirty;
} // #computeDirtySet

#topologicalSort (dirty) {
const order = [];
const inDegree = new Map();
for (const name of dirty) inDegree.set(name, this.#precedentsOf(name).intersection(dirty).size);
//console.log("inDegree: ", inDegree);

const queue = [...dirty.values()].filter(name => inDegree.get(name) === 0);
//console.log("queue: ", queue);

while (queue.length > 0) {
const name = queue.shift();
order.push(name);

for (const dep of this.#dependentsOf(name)) {
if (not(dirty.has(dep))) continue;
inDegree.set(dep, inDegree.get(dep) - 1);
if (inDegree.get(dep) === 0) queue.push(dep);
} // for
} // while queue.length

// cycles
const cycles = order.length < dirty.size? dirty.difference(new Set(order))
: new Set();



return {order, cycles};
} // #topologicalSort

#evaluate (cell) {
if (not(cell)) return;
//console.log("#evaluate: ", cell);

if (cell.hasFormula && cell.code) {
for (const name of this.#precedentsOf(cell.name)) {
//console.log("- examine precedent ", name);
const value = this.#cells.has(name)? this.#cells.get(name).value : "";
	if (value instanceof CellError) {
cell.value = value;
//console.log("precedence has error: ", cell.value);
return;
} // if
} // for

	const scope = this.#createScope(this.#precedentsOf(cell.name), ...parseLabel(cell.name));
//console.log("- scope: ", scope);
try {
cell.value = this.#evaluateCode(cell.code, scope);
//	console.log("- cell.value = ", cell.value);
	} catch (e) {
//console.log("- - catch: ", e);
cell.value = new CellError("evaluation", e);
		} // try
} // if

//console.log("#evaluate: cell.value = ", cell.value);
} // #evaluate

#evaluateCode (code, scope) {
//console.log("#evaluateCode: ", code, scope);
const value = code.evaluate(scope);
//console.log("- value = ", value);
if (typeof value === "number" && not(Number.isFinite(value))) {
  return Number.isNaN(value)
    ? new CellError("not-a-number", "...")
    : new CellError("divide-by-zero");
} // if
return value;
} // #evaluateCode

#createScope (names, row, column) {
const scope = new Map([...createInitialScope(row, column)]);
for (const name of names) {
const cell = this.#cells.get(name);
scope.set(name, cell? cell.value : "");
} // for

//console.log("created scope for ", names, "; ", scope);
return scope;
} // #createScope


#precedentsOf (name) {
if (not(this.#precedents.has(name))) this.#precedents.set(name, new Set());

return this.#precedents.get(name);
} // #precedentsOf

#dependentsOf(name) {
if (not(this.#dependents.has(name))) this.#dependents.set(name, new Set());

return this.#dependents.get(name);
} // #dependentsOf

#cleanupDependencies(cellName) {
// Tear down old edges unconditionally, from stored state.
for (const name of this.#precedentsOf(cellName)) {
//console.log("cleanup: removing ", cellName, " from dependentsOf ", name, "; ", dependentsOf(name));

this.#dependentsOf(name).delete(cellName);
} // for
this.#precedentsOf(cellName).clear();
} // #ccleanupDependencies

deleteCell (name) {
if (not(this.#cells.has(name))) return;

this.#cleanupDependencies(name);
this.#cells.delete(name);

//return this.recalculate([name]);
} // #deleteCell

} // class Spreadsheet

/// Spreadsheet Functions

var functions = new Map([
["sum", (...l) => l.reduce((a,x) => a+x)]
]);


function createFormula (text) {
try {
return math.parse(text);

} catch (e) {
//console.log("createFormula: ", text, "\n", e);
return new CellError("parse", `${e} : "${text}"`);
} // try
} // createFormula

function evaluateRefs (node, cell) {
if (not(isLabel(cell.name))) {
  cell.value = new CellError("parse", cell.name);
  return null;
} // if

  const [row, column] = parseLabel(cell.name);
const argScope = createInitialScope(row, column);

const isRef = n => n.isFunctionNode && n.fn.name === "ref";
const refArgs = n => n.filter(n => isRef(n))
.map(n => n.args);

const refSymbols = n => refArgs(n).flat()
.map(a => getSymbols(a)).flat();

const transformer = n =>
isRef(n)?
new math.SymbolNode(toLabel(...n.args.map(a => a.evaluate(argScope))))
: n;

const symbols = new Set(refSymbols(node));
const allowedSymbols = new Set([...argScope.keys()]);
const badSymbols = symbols.difference(allowedSymbols);

if (badSymbols.size > 0) {
cell.value = new CellError("badRef", `the following symbols are not allowed in ref() expressions: ${[...badSymbols].join(", ")}`);
return null;
} // if

return node.transform(transformer);
} // evaluateRefs

function createInitialScope (row, column) {
return new Map([
["_r", row],
["_c", column],
["_row", row],
["_col", column]
]);
} // initialScope

// getSymbols excludes function symbol nodes and math.js range nodes, and all symbols defined by initialScope()
function getSymbols (node) {
const scope = new Map([...createInitialScope(0,0)]);
return node
.filter((node, path, parent) => node.type === "SymbolNode" && not(scope.has(node.name)) && path !== "fn" && parent?.type !== "RangeNode")
.map(node => node.name.trim());
} // getSymbols

function isInGrid (text, rowCount, columnCount) {
const [r, c] = parseLabel(text);
return r > 0 && r <= rowCount && c > 0 && c <= columnCount;
} // isInGrid
