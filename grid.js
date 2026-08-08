class Grid {
#grid = null;
#cellContents = "";
#spreadsheet = null;

#keymap = new Map([
["ArrowRight", {command: () =>  this.currentCell = this.#nextCellInRow()}],
["ArrowLeft", {command: () => this.currentCell = this.#previousCellInRow()}],
["ArrowDown", {command: () => this.currentCell = this.#nextCellInColumn()}],
["ArrowUp", {command: () => this.currentCell = this.#previousCellInColumn()}],
["F2", {command: () => this.#startEditing()}],
["=", {command: () => this.#startEditing()}],
["Enter", {command: () => this.#endEditing()}],
["Escape", {command: () => this.#endEditing("cancel")}],
["Delete", () => this.#deleteCellContents(this.currentCell)],
]); // keymap

constructor (document, spreadsheet, nRows = 100, nColumns = 26) {
if (not(document instanceof HTMLDocument)) throw new Error("first argument to Grid() must be a HTMLDocument object");
if (not(spreadsheet instanceof Spreadsheet)) throw new Error("second argument to Grid() must be a Spreadsheet object");

const grid = this.#grid = document.createElement("table");
this.#spreadsheet = spreadsheet;

for (let i=0; i<nRows; i++) {
const row = document.createElement("tr");

for (let j=0; j<nColumns; j++) {
const cell = document.createElement("td");
cell.role = "gridcell";
	//cell.role = i === 0? "columnheader"
//: j === 0? "rowheader"
//: "gridcell";
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

for (const name of spreadsheet.allCells) {
	const data = spreadsheet.cellContents(name);
this.#setCellContents(name, data.value, data.formula);
} // for

this.announceCell(this.currentCell);

setTimeout(() => {
	grid.focus();
}, 50);
} // constructor

get dom() {return this.#grid;}
get currentCell () {return this.#grid.ariaActiveDescendantElement;}
set currentCell (cell) {this.#grid.ariaActiveDescendantElement = cell;}

get spreadsheet () {return this.#spreadsheet;}

#deleteCellContents (cell) {
this.#spreadsheet.deleteCell(cellLabel(cell));
cell.dataset.formula = "";
cell.textContent = "";
cell.innerHTML = "";
} // deleteCellContents

#enableNavigation () {
this.#grid.addEventListener("keyup", e => this.#keyupHandler(e.key));
} // #enableNavigation

#keyupHandler (key) {
const currentCell = this.currentCell;
const navigationKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
const endOfInput = ["Enter", "F2", "Escape"];

//if (key === "Tab") this.#grid.blur();
//console.log("keyup: ", this.currentCell);
if (this.currentCell.hasAttribute("data-editing") && navigationKeys.includes(key)) return true;

if (this.#keymap.has(key) && this.#keymap.get(key).command instanceof Function) {
//console.log("keyup: exec", key);
	this.#executeCommand(this.#keymap.get(key).command);
} // if

if (this.currentCell !== currentCell) this.announceCell(this.currentCell);
} // #keyupHandler


#startEditing () {
const cell = this.currentCell;
cell.dataset.editing = true;
	const text = cell.dataset.formula? cell.dataset.formula : cell.textContent;
	cell.textContent = "";
	cell.insertAdjacentHTML("beforeEnd", `<input type="text" value="${text}">`);
	cell.querySelector("input").focus();
//statusMessage("editing:");
} // #startEditing

#endEditing (cancel = false) {
let modified;

if (not(this.currentCell.hasAttribute("data-editing"))) return;
if (not(cancel)) {
	const text = this.currentCell.querySelector("input").value;
this.currentCell.innerHTML = "";
modified = this.#spreadsheet.setCellContents(this.#cellLabel(this.currentCell), text);
} else {
modified = [this.#cellLabel(this.currentCell)];
} // if

for (const name of modified) {
	const data = this.spreadsheet.cellContents(name);
	this.#setCellContents(data.name, data.value, data.formula);
} // for

this.currentCell.removeAttribute("data-editing");
this.#grid.focus();
statusMessage("end editing.");
} // #endEditing

#setCellContents (label, value, formula = "") {
console.log("grid.setCellContents: ", label, value);
const cell = this.#labelToCell(label);
cell.textContent = value.toString();
cell.dataset.formula = formula;
} // #setCellContents

#executeCommand (command) {
command();
} // executeCommand

announceCell (cell) {
statusMessage(`${this.#cellLabel(cell)}${cell.dataset.formula? ", has formula" : ""}`);
} // announceCell

#cellLabel (cell) {
return `${this.#columnLabel(cell)}${this.#rowLabel(cell)}`;
} // #cellLabel

#labelToCell (label) {
label = label.trim().toLowerCase();
const result = label.match(/^([a-z]+)([0-9]+)$/);
console.log("- result: ", result);

if (not(result)) throw new Error(`bad cell label: ${label}`);
const column = "abcdefghijklmnopqrstuvwxyz".indexOf(result[1]);
const row = Number(result[2]) - 1;

const $row = this.#grid.children[row];
const $cell = $row.children[column];
console.log("labelToCell: ", row, column, $row, $cell);

return $cell;
} // #labelToCell

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

function labelToCoordinates (label) {
	label = label.trim().toLowerCase();
	const c = "abcdefghijklmnopqrstuvwxyz".indexOf(label.charAt(0));
	const r = Number.parseInt(label.slice(1));
return [r,c];
} // labelToCoordinates
