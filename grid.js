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
["=", {command: () => this.#startEditing()}],
["alt+=", {command: () => {
if (this.#range.range.length > 0) this.#startEditing(`=sum(${expandRange(this.#range)})`);
else statusMessage("Autosum has no selection.");
} // if
}],

["enter", {editMode: true, command: () => this.#endEditing()}],
["escape", {editMode: true, command: () => {
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

grid.role = "grid";
grid.ariaActiveDescendantElement = grid.querySelector("td");
grid.tabIndex = 0;
this.#enableNavigation();

for (const name of spreadsheet.allCells) {
const data = spreadsheet.cellContents(name);
this.#displayCellContents(name, data.value, data.formula);
} // for

this.announceCell(this.currentCell);

setTimeout(() => {
grid.focus();
}, 50);
} // constructor

get dom () {return this.#grid;}
get currentCell () {return this.#grid.ariaActiveDescendantElement;}
set currentCell (cell) {this.#grid.ariaActiveDescendantElement = cell;}
get spreadsheet () {return this.#spreadsheet;}

#deleteCell (cell) {
this.#spreadsheet.deleteCell(this.#cellToLabel(cell));
cell.removeAttribute("data-formula");
cell.textContent = "";
cell.innerHTML = "";
} // deleteCell


#startEditing (overrideText) {
if (this.#mark) {
statusMessage("cannot modify during selection...");
return;
} // if

const cell = this.currentCell;
if (cell.hasAttribute("data-editing")) return;
cell.setAttribute("data-editing", true);
cell.setAttribute("data-old", cell.textContent);

const text = overrideText? overrideText
: cell.dataset.formula? cell.dataset.formula
: cell.textContent;
cell.textContent = "";
cell.insertAdjacentHTML("beforeEnd", `<input type="text">`);
cell.querySelector("input").value = text;
cell.querySelector("input").focus();
//statusMessage("editing:");
} // #startEditing

#endEditing (cancel = false) {
const cell = this.currentCell;
if (not(cell.hasAttribute("data-editing"))) return;

const input = cell.querySelector("input");
const text = input.value;
cell.innerHTML = "";

if (Boolean(cancel)) {
	cell.textContent = cell.getAttribute("data-old");

} else {
const modified = this.#spreadsheet.setCellContents(this.#cellToLabel(cell), text, this.#range.range);
for (const name of modified) {
const data = this.spreadsheet.cellContents(name);
if (data) this.#displayCellContents(data.name, data.value, data.formula);
} // for
} // if

cell.removeAttribute("data-editing");
cell.removeAttribute("data-old");
this.#grid.focus();
statusMessage("end editing.");
} // #endEditing

#displayCellContents (label, value, formula = "") {
//console.log("grid.displayCellContents: ", label, value);
const cell = this.#labelToCell(label);
cell.textContent = value.toString();
if (formula && formula.length > 0) cell.setAttribute("data-formula", formula);
else cell.removeAttribute("formula");
} // #displayCellContents


announceCell (cell) {
statusMessage(`${this.#cellToLabel(cell)}${cell.dataset.formula? ", has formula" : ""}`);
} // announceCell

#cellToLabel (cell) {
return formatLabel(this.#row(cell), this.#column(cell));
} // #cellToLabel

#labelToCell (label) {
const rows = this.dom.querySelector("tr").parentElement.children;
const [r, c] = parseLabel(label);
return rows[r].children[c];
} // #labelToCell

#row (cell) {
return cell.parentElement.rowIndex;
} // row

#column (cell) {
return cell.cellIndex;
} // colun


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
return next? next.children[this.currentCell.cellIndex] : this.currentCell;
} // #nextCellInColumn

#previousCellInColumn () {
const previous = this.currentCell.parentElement.previousElementSibling;
return previous? previous.children[this.currentCell.cellIndex] : this.currentCell;
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
{type: range.type, range: range.range.map(cell => this.#cellToLabel(cell))}
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

#enableNavigation () {
this.#grid.addEventListener("keydown", e => this.#keydownHandler(e));
} // #enableNavigation

#keydownHandler (e) {
const key = new Key(e).toString();
if (key.length === 0) return false;
//console.log("keydown: ", key);
const cell = this.currentCell;

//console.log("keydown: ", key, this.currentCell);
if (this.#keymap.has(key) ) {
const data = this.#keymap.get(key);
console.log(`key: ${key}: ${data.editMode}, ${cell.hasAttribute("data-editing")}`);
if (Boolean(data.editMode) === Boolean(cell.hasAttribute("data-editing"))) this.#execute(data.command, key);
else return true;
	} // if

if (cell !== this.currentCell) this.announceCell(this.currentCell);
} // #keydownHandler

#execute (command, key) {
command(key);
} // executeCommand

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


function not(x) {return !x;}
