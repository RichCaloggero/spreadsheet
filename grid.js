class Grid {
#grid = null;
#cellContents = "";
#spreadsheet = null;

#keymap = new Map([
["ArrowRight", {command: () =>  this.currentCell = this.#nextCellInRow()}],
["ArrowLeft", {command: () => this.currentCell = this.#previousCellInRow()}],
["ArrowDown", {command: () => this.currentCell = this.#nextCellInColumn()}],
["ArrowUp", {command: () => this.currentCell = this.#previousCellInColumn()}],
["F2", {command: () => {
//this.currentCell.setAttribute("contentEditable", "plaintext-only");
this.currentCell.dataset.editing = true;
	const text = this.currentCell.textContent;
	this.currentCell.textContent = "";
	this.currentCell.insertAdjacentHTML("beforeEnd", `<input type="text" value="${text}">`);
	this.currentCell.querySelector("input").focus();
statusMessage("editing:");
}}],
["Enter", {command: () => this.#endEditing()}],
["Escape", {command: () => this.currentCell.removeAttribute("contentEditable")}],
]); // keymap

constructor (spreadsheet, nRows = 100, nColumns = 26) {
if (not(spreadsheet instanceof Spreadsheet)) throw new Error("first argument to Grid() must be a Spreadsheet object");

const grid = this.#grid = document.createElement("table");
this.#spreadsheet = spreadsheet;

for (let i=0; i<nRows; i++) {
const row = document.createElement("tr");

for (let j=0; j<nColumns; j++) {
const cell = document.createElement("td");
cell.role = i === 0? "columnheader"
: j === 0? "rowheader"
: "gridcell";
cell.innerHTML = "&nbsp";
cell.tabIndex = -1;
row.appendChild(cell);
} // for column

grid.appendChild(row);
} // for row

grid.role = grid;
grid.ariaActiveDescendantElement = grid.querySelector("td");
grid.tabIndex = 0;
this.#enableNavigation();
} // constructor

get dom() {return this.#grid;}
get currentCell () {return this.#grid.ariaActiveDescendantElement;}
set currentCell (cell) {this.#grid.ariaActiveDescendantElement = cell;}

get spreadsheet () {return this.#spreadsheet;}

#enableNavigation () {
this.#grid.addEventListener("keyup", e => this.#keyupHandler(e.key));
} // #enableNavigation

#keyupHandler (key) {
const currentCell = this.currentCell;
const navigationKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
//if (key === "Tab") this.#grid.blur();
console.log("keyup: ", this.currentCell);
if (this.currentCell.hasAttribute("data-editing") && navigationKeys.includes(key)) return true;

if (this.#keymap.has(key) && this.#keymap.get(key).command instanceof Function) {
console.log("keyup: exec", key);
	this.#executeCommand(this.#keymap.get(key).command);
} // if

if (this.currentCell !== currentCell) this.announceCell();
} // #keyupHandler

#inputHandler (e) {
const endOfInput = ["Enter", "Escape", "F2"];
//console.log("event: ", e);
if (e.inputType === "insertLineBreak") {
const text = this.currentCell.textContent.trim();
this.currentCell.innerHTML = "";
this.currentCell.textContent = text;
console.log(`html: ${this.currentCell.innerHTML}\ntext: ${text}\n`);
this.currentCell.removeAttribute("contentEditable");
this.#spreadsheet.setCellContents(this.#cellLabel(this.currentCell), text);
this.#grid.focus();
statusMessage("end editing.");
} // if
} // #inputHandler

#endEditing () {
const text = this.currentCell.querySelector("input").value;
this.currentCell.innerHTML = "";
this.currentCell.textContent = text;
console.log(`html: ${this.currentCell.innerHTML}\ntext: ${text}\n`);
this.currentCell.removeAttribute("data-editing");
this.#spreadsheet.setCellContents(this.#cellLabel(this.currentCell), text);
this.#grid.focus();
statusMessage("end editing.");
} // #endEditing

#executeCommand (command) {
command();
} // executeCommand

announceCell () {
const cell = this.currentCell;
statusMessage(this.#cellLabel(cell));
} // announceCell

#cellLabel (cell) {
return `${this.#columnLabel(cell)}${this.#rowLabel(cell)}`;
} // #cellLabel

#rowLabel (cell) {
return this.#rowIndex(cell)+1;
} // rowLabel

#columnLabel (cell) {
return "abcdefghijklmnopqrstuvwxyz".charAt(this.#columnIndex(cell));
} // colunLabel

#rowIndex (cell) {
const row = cell.parentElement;
const rowList = [...row.parentElement.children];
return rowList.indexOf(row);
} // #rowIndex

#columnIndex (cell) {
const cellList = [...cell.parentElement.children];
return cellList.indexOf(cell);
} // #columnIndex


#nextCellInRow () {
const next = this.currentCell.nextElementSibling;
return next? next : this.currentCell;
} // #nextCellInRow

#previousCellInRow () {
const previous = this.currentCell.previousElementSibling;
return previous? previous : this.currentCell;
} // #previousCellInRow

#nextCellInColumn () {
const next = this.currentCell.parentElement.nextElementSibling;
const index = this.#columnIndex(this.currentCell);
return next? next.children[index] : this.currentCell;
} // #nextCellInColumn

#previousCellInColumn () {
const previous = this.currentCell.parentElement.previousElementSibling;
const index = this.#columnIndex(this.currentCell);
return previous? previous.children[index] : this.currentCell;
} // #previousCellInColumn


} // class Grid

