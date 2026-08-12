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
	return cell? {name: cell.name, value: cell.value, formula: cell.hasFormula? cell.input.toString() : ""}
	: null;
} // cellContents

load (cells) {
const names = [];

	for (cell of cells) {
names.push(cell.name);
		setInput(cell.name, cell.input);
	} // for

	recalculate(names);
} // load

setCellContents (name, input, range, oldInput) {
if (not(name)) {
	statusMessage ("setCellContents: cell label missing or invalid.");
} // if

const cell = this.#setInput(name, input, range, oldInput);
console.log("setInput: ", cell);

return this.#recalculate([cell.name]);
} // setCellContents


#setInput (name, input, range = [], oldInput = "") {
input = input.toString().trim();
oldInput = oldInput.toString().trim();
this.#replayQueue.push ({name, input, oldInput});

const cell = this.#cells.has(name)? this.#cells.get(name)
: {
name, input,
code: null,
get hasFormula () {return not(this.code === null);},
value: ""
}; // cell
this.#cells.set(name, cell);

this.#cleanupDependencies(cell);

if (isFormula(input)) {
cell.input = createFormula(input.slice(1));
cell.code = cell.input.compile();
console.log("setInput: formula ", cell.code.toString());

	for (const symbolName of getSymbols(cell.input).concat(range)) {
this.#precedentsOf(name).add(symbolName);
this.#dependentsOf(symbolName).add(cell.name);
} // for

} else{
cell.input = input;
cell.code = null;
cell.value = input;
} // if

return cell;
} // #setInput

#recalculate (names) {
// find dirty cells
const dirty = names.length > 1? names
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

