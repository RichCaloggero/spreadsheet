class Spreadsheet {
#cells = new Map();
#dependents = new Map();
#values = new Map();
#grid = null;
#container = null;
#replayQueue = [];

constructor () {
} // constructor

get allCells () {
return this.#cells.keys();
} // allCells

cellContents (name) {
const cell = this.#cells.get(name);
	return {name: cell.name, value: cell.value, formula: cell.hasFormula? cell.input.toString() : ""};
} // cellContents

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
for (const symbolName of getSymbols(cell.input)) {
cell.precedents.add(symbolName);
this.#dependentsOf(symbolName).add(name);
} // for

} else{
cell.input = input;
cell.code = null;
cell.value = isNaN(Number(input))? input.toString() : Number(input);
} // if
this.#cells.set(name, cell);

console.log(
`precedentsOf(${name}): `, this.#precedentsOf(name),
`dependentsOf(${name})}: `, this.#dependentsOf(name)
);

// find dirty cells
const dirty = this.#computeDirtySet(name);
//console.log("dirty: ", dirty);

const sorted = this.#topologicalSort(dirty);
console.log("sorted: ", sorted);

for (const name of sorted) {
this.#evaluate(this.#cells.get(name));
} // for

return [...sorted.values()];
} // setCellContents

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
console.log("inDegree: ", inDegree);

const queue = [...dirty.values()].filter(name => inDegree.get(name) === 0);
console.log("queue: ", queue);

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



#precedentsOf (name) {
return this.#cells.get(name).precedents;
} // #precedentsOf

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

