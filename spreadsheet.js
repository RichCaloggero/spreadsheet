class Spreadsheet {
#cells = new Map();
#dependents = new Map();
#values = new Map();
#grid = null;
#container = null;
#replayQueue = [];

constructor () {
} // constructor

setCellContents (name, input, oldInput = "") {
	input = input.toString();
	oldInput = oldInput.toString();
	this.#replayQueue.push ({name, input, oldInput});

	const cell = this.#cells.has(name)? this.#cells.get(name)
: {
name, input,
precedents: new Set(),
code: null,
get hasFormula () {return not(this.code === null);},
value: ""
}; // cell

this.#cleanupDependencies(cell);

if (isFormula(input)) {
cell.input = createFormula(input.slice(1));
cell.code = cell.input.compile();
for (const s of getSymbols(cell.input)) {
cell.precedents.add(s);
this.#dependentsOf(s).add(name);
} // for

} else{
cell.input = input;
cell.code = null;
cell.value = isNaN(Number(input))? input.toString() : Number(input);
	} // if
this.#cells.set(name, cell);

console.log("cell: ", cell);
// find dirty cells
const dirty = this.#computeDirtySet(name);
//console.log("dirty: ", dirty);

const sorted = this.#topologicalSort(dirty);
console.log("sorted: ", dirty);

for (const name of sorted) {
	this.#evaluate(this.#cells.get(name));
} // for


return [...sorted].map(name => [name, this.#cells.get(name).value]);
} // setCellContents

#computeDirtySet (name) {
const dirty = new Set([name]);

for (const s of dirty) {
  for (const d of this.#dependentsOf(s)) dirty.add(d);
} // for

return dirty;
} // #computeDirtySet

#evaluate (cell) {
if (cell.hasFormula) {
	const scope = this.#createScope(cell.precedents);
cell.value = cell.	code.evaluate(scope);
return cell.value;
} else {
return cell.value;
	} // if
} // #evaluate

#createScope (names) {
const scope = new Map();
for (const name of names) {
const cell = this.#cells.get(name);
	scope.set(name, cell? Number(cell.value) : 0);
} // for

return scope;
} // #createScope

	#topologicalSort (cells) {
return cells; // dummy for now
} // #topologicalSort

cellValue (name) {
return this.#cells.get(name).input;
} // #cellValue

#dependentsOf(name) {
if (not(this.#dependents.has(name))) this.#dependents.set(name, new Set());

return this.#dependents.get(name);
} // #dependentsOf

#cleanupDependencies(cell) {
// Tear down old edges unconditionally, from stored state.
for (const s of cell.precedents) {
this.#dependentsOf(s).delete(cell.name);
} // for
cell.precedents.clear();
} // #ccleanupDependencies


} // class Spreadsheet

function createFormula (text) {
return math.parse(text);
} // createFormula

function getSymbols (node) {
return node.filter(node => node.type === "SymbolNode").map(node => node.name.trim());
} // getSymbols

function isFormula (text) {return text.charAt(0) === "=";}

function not (x) {return !x;}

