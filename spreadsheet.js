class Spreadsheet {
#cells = null;
#dependants = null;
#values = null;
	#grid = null;
#container = null;

constructor (grid) {
this.#cells = new Map();
this.#dependants = new Map();
this.#values = new Map();
	this.#grid = new Grid(this);

const container = document.createElement("div");
container.role = "region";
container.roledescription = "spreadsheet";
container.insertAdjacentHTML("beforeEnd",
	`<div class="formula" style="visibility:hidden">
	<label>Expression: <input type="text" class="expression"></label>
</div>
	`);

	container.appendChild(this.#grid.dom);
document.body.appendChild(container);
container.insertAdjacentHTML("beforeEnd", `<label>Expression: <input hidden type="text" class="expression"></label>\n`);
this.#container = container;
this.#grid.dom.focus()

// wait for dom to settle
setTimeout(() => {
this.#grid.announceCell();
}, 100);
} // constructor

get grid () {return this.#grid;}

setCellContents (name, text) {
const cell = this.#cells.has(name)? this.#cells.get(name) : {valueOf: () => this.#cellValue(name)};
const input = text.charAt(0) === "="? createFormula(name, text.slice(1))
: text;
cell.name = name;
cell.input = input;

if (input instanceof Object) {
const code = cell.code = input.compile();
} // if
} // setCellContents

#cellValue (name) {
this.#cells.get(name).input;
} // #cellValue



} // class Spreadsheet

function createFormula (name, text) {
return math.parse(text);
} // createFormula

function getSymbols (node) {
return node.filter(node => node.type === "SymbolNode").map(node => node.name.trim());
} // getSymbols

function not (x) {return !x;}

