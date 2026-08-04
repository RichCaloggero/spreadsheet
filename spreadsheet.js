class Spreadsheet {
#cells = null;
#dependants = null;
#grid = null;
#parser = null;
#container = null;

constructor (grid) {
this.#cells = new Map();
this.#dependants = new Map();
this.#grid = new Grid(this);
this.#parser = math.parser();

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
const input = text.charAt(0) === "="? this.#createFormula(name, text.slice(1))
: text;
this.#cells.set(name, {name: name, input});
} // setCellContents

#createFormula (name, text) {
const formula = math.parse(text);
const symbols = getSymbols(formula);

console.log(`name: ${name}, text: ${text}\nvariables: `, symbols);
return formula;
} // createFormula


} // class Spreadsheet

function getSymbols (node) {
return node.filter(node => node.type === "SymbolNode").map(node => node.name.trim());
} // getSymbols

function not (x) {return !x;}

