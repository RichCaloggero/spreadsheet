import { not, isFormula } from "./utilities.js";
import { parseLabel, formatLabel, toLabel } from "./coordinates.js";

class CellError {
static #codes = new Map([
["parse", "cannot parse formula"],
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

constructor () {
} // constructor

has (name) {return this.#cells.has(name);}
get allNames () {return [...this.#cells.keys()];}

get allCells () {
return [...this.#cells.keys()];
} // allCells

cellContents (name) {
  const cell = name? this.#cells.get(name) : null;
  if (not(cell)) return {name, input: null, role: ""};

  const value = cell.value;
  const failed = value instanceof CellError;

  const result = {
    name: cell.name,
    role: cell.role,
    input: cell.input,
    hasFormula: isFormula(cell.input),
    value: failed? String(value) : value ?? "",
    error: failed? value.code : "",
    description: failed? value.description : ""
  };

return result;
} // cellContents

load (entries) {
	this.clear();
//console.log("spreadsheet cleared.");
//console.log(entries);

for (const data of entries) {
	const cell = this.setInput(data.name, data.input, data.role);
} // for

this.recalculate([...this.#cells.keys()], false);
} // load

getData () {
const data = [];
for (const cell of this.#cells.values()) data.push(this.cellContents(cell.name));

return data;
} // getData

clear () {
this.#cells.clear();
this.#precedents.clear();
this.#dependents.clear();
} // clear

setRole (name, role = "gridcell") {
if (this.#cells.has(name)) {
//console.log("spreadsheet.setRole: ", name);
this.#cells.get(name).role = role;
} // if
} // setRole


setCellContents (name, input, role) {
if (not(name)) {
throw new Error("setCellContents: cell label missing or invalid.");
} // if

const old = this.#cells.get(name);
const oldInput = old? old.input : null;
const oldRole = old? old.role : null;


const cell = this.setInput(name, input, role);
//console.log("setInput: ", cell);

return this.recalculate([name]);
} // setCellContents

setInput (name, input, role = "") {
input = input.toString().trim();
//console.log("setInput: ", name, input, role);

const cell = this.#cells.has(name)? this.#cells.get(name)
: {
name, input, role,
formula: "",
code: null,
get hasFormula () {return isFormula(this.input);},
value: input
}; // cell

cell.input = input;
this.#cells.set(name, cell);
//console.log("setInput: initial cell ", cell);

this.#cleanupDependencies(cell.name);

if (isFormula(input)) {
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
const result = parseLabel(symbolName);
if (result.error) {
cell.value = new CellError("parse", `bad cell label: ${symbolName}`);
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

if (cell.hasFormula) {
for (const name of this.#precedentsOf(cell.name)) {
//console.log("- examine precedent ", name);
const value = this.#cells.has(name)? this.#cells.get(name).value : "";
	if (value instanceof CellError) {
cell.value = value;
console.log("precedence has error: ", cell.value);
return;
} // if
} // for

	const scope = this.#createScope(this.#precedentsOf(cell.name), ...parseLabel(cell.name));
//console.log("- scope: ", scope);
try {
cell.value = this.#evaluateCode(cell.code, scope);
	console.log("- cell.value = ", cell.value);
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

console.log("created scope for ", names, "; ", scope);
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

has (name) {return this.#cells.has(name);}

/// test

test1 () {
	const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

for (const key in monthNames) {
const label = `${"abcdefghijklmnopqrstuvwxyz".charAt(Number(key)+1)}1`;
this.setInput(label, monthNames[key], "columnheader");
} // for
this.recalculate(this.allNames);
} // test1

test2 () {
const jsonData = `
	[{"name":"b1","role":"columnheader","input":"january","hasFormula":false,"value":"january","error":null,"description":null},{"name":"c1","role":"columnheader","input":"february","hasFormula":false,"value":"february","error":null,"description":null},{"name":"d1","role":"columnheader","input":"march","hasFormula":false,"value":"march","error":null,"description":null},{"name":"e1","role":"columnheader","input":"april","hasFormula":false,"value":"april","error":null,"description":null},{"name":"f1","role":"columnheader","input":"may","hasFormula":false,"value":"may","error":null,"description":null},{"name":"g1","role":"columnheader","input":"june","hasFormula":false,"value":"june","error":null,"description":null},{"name":"h1","role":"columnheader","input":"july","hasFormula":false,"value":"july","error":null,"description":null},{"name":"i1","role":"columnheader","input":"august","hasFormula":false,"value":"august","error":null,"description":null},{"name":"j1","role":"columnheader","input":"september","hasFormula":false,"value":"september","error":null,"description":null},{"name":"k1","role":"columnheader","input":"october","hasFormula":false,"value":"october","error":null,"description":null},{"name":"l1","role":"columnheader","input":"november","hasFormula":false,"value":"november","error":null,"description":null},{"name":"m1","role":"columnheader","input":"december","hasFormula":false,"value":"december","error":null,"description":null},{"name":"a1","role":"rowheader","input":"type F1 for help","hasFormula":false,"value":"type F1 for help","error":null,"description":null},{"name":"a2","role":"rowheader","input":"rent/mortgage","hasFormula":false,"value":"rent/mortgage","error":null,"description":null},{"name":"a3","role":"rowheader","input":"food","hasFormula":false,"value":"food","error":null,"description":null}]
`;

const data = JSON.parse(jsonData);
	this.load(data);
	
} // test2

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

function getFunctions (node) {
return node.filter(node => node.isfunctionNode);
} // getFunctions


function replaceSymbols (node, newSymbols) {
return node.transform(function (node, path, parent) {
if (node.isSymbolNode ) {
return new math.SymbolNode(newSymbols.has(node.name)? newSymbols.get(node.name) : node.name);
} else {
return node
} // if
}); // transform
} // replaceSymbols

