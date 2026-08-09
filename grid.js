class Grid {
#grid = null;
#spreadsheet = null;
#range = this.#emptyRange();
#mark = null;
	
#keymap = new Map([
// navigation
["arrowRight", {command: () =>  this.currentCell = this.#nextCellInRow()}],
["arrowLeft", {command: () => this.currentCell = this.#previousCellInRow()}],
["arrowDown", {command: () => this.currentCell = this.#nextCellInColumn()}],
["arrowUp", {command: () => this.currentCell = this.#previousCellInColumn()}],

// editing
["f2", {command: () => this.#startEditing()}],
["=", {command: () => this.#startEditing("=")}],
["alt+=", {command: () => {
	if (this.#range.range.length > 0) this.#startEditing(`=sum(${expandRange(this.#range)})`);
else statusMessage("Autosum has no selection.");
} // if
}],

["enter", {command: () => this.#endEditing()}],
["escape", {command: () => {
	if (this.#mark) {
		this.#mark = null;
		statusMessage("Selection canceled.");
	} else {
		this.#endEditing("cancel");
	} // if
	}}],
["delete", {command: () => this.#deleteCell(this.currentCell)}],

// row and column tagging
["control+alt+shift+c", {command: () => this.#setRowHeaders(this.currentCell)}],
["control+alt+shift+r", {command: () => this.#setColumnHeaders(this.currentCell)}],

// ranges
["control+space", {command: () => this.#defineRange(this.currentCell)}],
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

#deleteCell (cell) {
this.#spreadsheet.deleteCell(this.#cellLabel(cell));
cell.removeAttribute("data-formula");
cell.textContent = "";
cell.innerHTML = "";
} // deleteCell

#enableNavigation () {
this.#grid.addEventListener("keydown", e => this.#keydownHandler(e));
} // #enableNavigation

#keydownHandler (e) {
const key = new Key(e).toString();
if (key.length === 0) return false;
//console.log("keydown: ", key);
const currentCell = this.currentCell;
const navigationKeys = ["arrowLeft", "arrowRight", "arrowUp", "arrowDown"];
const endOfInput = ["enter", "f2", "escape"];

//if (key === "tab") this.#grid.blur();
//console.log("keydown: ", key, this.currentCell);
if (this.currentCell.hasAttribute("data-editing") && navigationKeys.includes(key)) return true;

if (this.#keymap.has(key) && this.#keymap.get(key).command instanceof Function) {
//console.log("keydown: exec", key);
this.#executeCommand(this.#keymap.get(key).command, e);
} // if

if (this.currentCell !== currentCell) this.announceCell(this.currentCell);
} // #keydownHandler

#executeCommand (command, e) {
command(e);
} // executeCommand

#startEditing (overrideText) {
if (this.#mark) {
	statusMessage("cannot modify during selection...");
return;
} // if

const cell = this.currentCell;
cell.dataset.editing = true;
const text = overrideText? overrideText
: cell.dataset.formula? cell.dataset.formula : cell.textContent;
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
modified = this.#spreadsheet.setCellContents(this.#cellLabel(this.currentCell), text, this.#range.range);
} else {
modified = [this.#cellLabel(this.currentCell)];
console.log("endEditing (canceled): ", modified);
	} // if

for (const name of modified) {
const data = this.spreadsheet.cellContents(name);
if (data) this.#setCellContents(data.name, data.value, data.formula);
} // for

this.currentCell.removeAttribute("data-editing");
this.#grid.focus();
statusMessage("end editing.");
} // #endEditing

#setCellContents (label, value, formula = "") {
//console.log("grid.setCellContents: ", label, value);
const cell = this.#labelToCell(label);
cell.textContent = value.toString();
cell.dataset.formula = formula;
} // #setCellContents


announceCell (cell) {
statusMessage(`${this.#cellLabel(cell)}${cell.dataset.formula? ", has formula" : ""}`);
} // announceCell

#cellLabel (cell) {
return `${this.#columnLabel(cell)}${this.#rowLabel(cell)}`;
} // #cellLabel

#labelToCell (label) {
label = label.trim().toLowerCase();
const result = label.match(/^([a-z]+)([0-9]+)$/);
//console.log("- result: ", result);

if (not(result)) throw new Error(`bad cell label: ${label}`);
const column = "abcdefghijklmnopqrstuvwxyz".indexOf(result[1]);
const row = Number(result[2]) - 1;

const $row = this.#grid.children[row];
const $cell = $row.children[column];
//console.log("labelToCell: ", row, column, $row, $cell);

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

#setColumnHeaders (cell) {
//console.log("markColumns");
getColumn(cell).forEach(cell => cell.role = cell.role === "gridcell"? "rowheader" : "gridcell");
} // #setColumnHeaders

#setRowHeaders (cell) {
console.log("markRows");
getRow(cell).forEach(cell => cell.role = cell.role === "gridcell"?"columnheader" : "gridcell");
} // #setRowHeaders

#defineRange (cell) {
if (this.#mark) {
const range = getRange(this.#mark, cell);
this.#range = range?
{type: range.type, range: range.range.map(cell => this.#cellLabel(cell))}
	: this.#emptyRange();
console.log("grid.range: ", this.#range);
	this.#mark = null;
	
	if (this.#range.type) statusMessage(`${this.#range.range.length} cells in ${this.#range.type} range.`);
	else statusMessage("invalid range");
	
	} else {
	this.#mark = cell;
this.#range = this.#emptyRange();
		statusMessage("mark set");
} // if
} // #defineRange

#emptyRange () {
return {type: "empty", range: []};
} // #emptyRange

} // class Grid

function labelToCoordinates (label) {
label = label.trim().toLowerCase();
const c = "abcdefghijklmnopqrstuvwxyz".indexOf(label.charAt(0));
const r = Number.parseInt(label.slice(1));
return [r,c];
} // labelToCoordinates

function $row (cell) {return cell.parentElement;}
function $grid (cell) {return $row(cell).parentElement;}
function getRow (cell) {return [...$row(cell).children];}

function getColumn (cell) {
const index = getRow(cell).indexOf(cell);
return [...$grid(cell).children].map($row => $row.children[index]);
} // getColumn

function getRange (cell1, cell2) {
const cells = isSameRow(cell1, cell2)? getRow(cell1)
: isSameColumn(cell1, cell2)? getColumn(cell1)
	: [];

const type = isSameRow(cell1, cell2)? "row" : "column";

	return cells.length > 0?
	{type, range: cellsBetween(cells, cells.indexOf(cell1), cells.indexOf(cell2))} : null;
} // getRange

function isSameRow (cell1, cell2) {
return 	$row(cell1) === $row(cell2);
} // isSameRow

function isSameColumn (cell1, cell2) {
	return getRow(cell1).indexOf(cell1) === getRow(cell2).indexOf(cell2);
} // isSameColumn

function cellsBetween (a, index1, index2) {
if (index1 > index2) {
	const t = index1;
	index1 = index2;
	index2 = t;
} // if

return a.filter((cell, i) => i >= index1 && i <= index2);
} // cellsBetween

function expandRange (range) {
// just stick in contents for now
	return range.range.join(", ");
} // expandRange

	
function not(x) {return !!x;}
