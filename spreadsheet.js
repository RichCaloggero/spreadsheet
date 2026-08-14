class Spreadsheet {
#cells = new Map();
#precedents = new Map();
	#dependents = new Map();
#replayQueue = [];

constructor () {
} // constructor

get allCells () {
return this.#cells.keys();
} // allCells

cellContents (name) {
const cell = this.#cells.get(name);
	return cell? {name: cell.name, role: cell.role, input: cell.input, value: cell.value? cell.value : "", hasFormula: cell.hasFormula}
	: null;
} // cellContents

load (entries) {
	this.#clear();
	for (const data of entries) this.#setInput(data.name, data.input, data.role);

	this.#recalculate([...this.#cells.keys()]);
} // load

save () {
const data = [];
	for (const cell of this.#cells.values()) data.push({name: cell.name, input: cell.input, value: cell.value, role: cell.role}); 

	return data;
	} // save

#clear () {
	this.#cells.clear();
	this.#precedents.clear();
	this.#dependents.clear();
} // #clear

setRole (name, role = "gridcell") {
	if (this.#cells.has(name)) {
		console.log("spreadsheet.setRole: ", name);
	this.#cells.get(name).role = role;
	} // if
	} // setRole


setCellContents (name, input, role, range, oldInput) {
console.log(`setCellContents: ${name}, ${input}, ${role}:\n`);
if (not(name)) {
	statusMessage ("setCellContents: cell label missing or invalid.");
} // if

const cell = this.#setInput(name, input, role, range, oldInput);
//console.log("setInput: ", cell);

return this.#recalculate([cell.name]);
} // setCellContents

#setInput (name, input, role = "gridcell", range = [], oldInput = "") {
input = input.toString().trim();
oldInput = oldInput.toString().trim();
this.#replayQueue.push ({name, input, oldInput});

const cell = this.#cells.has(name)? this.#cells.get(name)
: {
name, input, role,
	formula: "",
code: null,
get hasFormula () {return not(this.code === null);},
value: input
}; // cell

cell.input = input;
this.#cells.set(name, cell);

this.#cleanupDependencies(cell);

if (isFormula(input)) {
cell.formula = createFormula(input.slice(1));
try {
	cell.code = cell.formula.compile();
} catch (e) {
statusMessage(`cannot parse formula: ${input}`);
return cell;
} // try

	console.log("setInput: formula ", cell.code);

	// ranges are part of the precedents set of this cell, inputs to the formula
for (const symbolName of getSymbols(cell.formula).concat(range)) {
this.#precedentsOf(name).add(symbolName);
this.#dependentsOf(symbolName).add(cell.name);
} // for

} // if

return cell;
} // #setInput

#recalculate (names) {
// find dirty cells
const dirty = names.length > 1? new Set(names)
: this.#computeDirtySet(names[0]);
//console.log("dirty: ", dirty);

const sorted = this.#topologicalSort(dirty);
//console.log("sorted: ", sorted);

for (const name of sorted) {
this.#evaluate(this.#cells.get(name));
} // for

return [...sorted.values()];
} // #recalculate


#computeDirtySet (name) {
const dirty = new Set([name]);

for (const s of dirty) {
for (const d of this.#dependentsOf(s)) dirty.add(d);
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

return order;
} // #topologicalSort

#evaluate (cell) {
if (cell.hasFormula) {
const scope = this.#createScope(this.#precedentsOf(cell.name));
try {
	cell.value = cell.	code.evaluate(scope);
} catch (e) {
	cell.value = 0;
} // try

} // if

//return Number(cell.value) === NaN? cell.value.toString() : Number(cell.value);
return cell.value;
} // #evaluate

#createScope (names) {
const scope = new Map();
for (const name of names) {
const cell = this.#cells.get(name);
scope.set(name, cell? Number(cell.value) : 0);
} // for

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
this.#dependentsOf(name).delete(cellName);
} // for
this.#precedentsOf(cellName).clear();
} // #ccleanupDependencies

deleteCell (name) {
const cell = this.#cells.get(name);
	this.#cleanupDependencies(name);
this.#cells.delete(name);
} // #deleteCell

} // class Spreadsheet

/// Spreadsheet Functions

functions = new Map([
	["sum", (...l) => l.reduce((a,x) => a+x)]
	]);


function createFormula (text) {
return math.parse(text);
} // createFormula

function getFunctions (node) {
return node
.filter((node, p) => node.type === "SymbolNode" && p === "fn")
	.map(node => node.name.trim());
} // getFunctions

// getSymbols excludes function symbol nodes and range nodes
function getSymbols (node) {
return node
	.filter((node, path, parent) => node.type === "SymbolNode" && path !== "fn" && parent.type !== "RangeNode")
	.map(node => node.name.trim());
} // getSymbols

function isFormula (text) {return text.charAt(0) === "=";}

function not (x) {return !x;}

