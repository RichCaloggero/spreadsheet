class Grid {
#grid = null;
#spreadsheet = null;
#range = this.#emptyRange();
#mark = null;

#keymap = new Map([
// navigation
["arrowRight", {command: () =>  this.#setCurrentCell(this.#nextCellInRow())}],
["arrowLeft", {command: () => this.#setCurrentCell(this.#previousCellInRow())}],
["arrowDown", {command: () => this.#setCurrentCell(this.#nextCellInColumn())}],
["arrowUp", {command: () => this.#setCurrentCell(this.#previousCellInColumn())}],

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
["control+alt+shift+c", {command: () => this.#markRowAsColumnHeaders(this.currentCell)}],
["control+alt+shift+r", {command: () => this.#markColumnAsRowHeaders(this.currentCell)}],

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
cell.innerHTML = "&nbsp";
cell.tabIndex = -1;
row.appendChild(cell);
} // for column

grid.appendChild(row);
} // for row

/*// add header cells
const headerRow = document.createElement("tr");
for (let i=0; i<26; i++) headerRow.insertAdjacentHTML("beforeEnd", `<th aria-label="${columnLabels.charAt(i)}"></th>`);
for (const row of grid.children) row.insertAdjacentHTML("afterBegin", `<th aria-label="${row.rowIndex+1}"></th>`);
grid.prepend(headerRow);
*/

grid.role = "grid";
grid.ariaActiveDescendantElement = grid.querySelector("td");
grid.tabIndex = 0;
this.#enableNavigation();

for (const name of spreadsheet.allCells) {
const data = spreadsheet.cellContents(name);
this.#displayCellContents(name, data.value, data.formula);
} // for

this.#unselectAllCells();

setTimeout(() => {
grid.focus();
this.announceCell(this.currentCell);
}, 50);
} // constructor

get dom () {return this.#grid;}
get currentCell () {return this.#grid.ariaActiveDescendantElement;}

#setCurrentCell (cell) {
this.#grid.ariaActiveDescendantElement = cell;
cell.setAttribute("aria-selected", "true");
this.#generateDescription(cell);
} // #setCurrentCell

#unselectAllCells () {this.#allCells().forEach(cell => cell.setAttribute("aria-selected", "false"));}

#allCells (expression) {
return [...this.#grid.querySelectorAll(`td${expression? expression : ""}`)];
} // #allCells

get spreadsheet () {return this.#spreadsheet;}

#generateDescription (cell) {
} // #generateDescription

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
const modified = this.#spreadsheet.setCellContents(this.#cellToLabel(cell), text, cell.role, this.#range.range);
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

#markColumnAsRowHeaders (cell) {
const role = cell.role === "gridcell"? "rowheader" : "gridcell";

getColumn(cell).forEach(cell => this.#setRole(cell, role));
} // #markColumnAsRowHeaders

#markRowAsColumnHeaders (cell) {
const role = cell.role === "gridcell"? "columnheader" : "gridcell";

getRow(cell).forEach(cell => this.#setRole(cell, role));
} // #markRowAsColumnHeaders

#setRole (cell, role) {
cell.role = role;
console.log("grid.setRole: ", cell, role);
this.#spreadsheet.setRole(this.#cellToLabel(cell), role);
} // #setRole

#defineRange (cell) {
if (not(this.#mark)) {
this.#mark = cell;
this.#range = this.#emptyRange();
statusMessage("mark set");
return;
} // if

const range = getRange(this.#mark, cell);
this.#range = range?
{type: range.type, range: range.range.map(cell => this.#cellToLabel(cell))}
: this.#emptyRange();
console.log("grid.range: ", this.#range);
this.#mark = null;

if (this.#range.type) statusMessage(`${this.#range.range.length} cells in ${this.#range.type} range.`);
else statusMessage("invalid range");
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
//console.log(`key: ${key}: ${data.editMode}, ${cell.hasAttribute("data-editing")}`);
if (Boolean(data.editMode) === Boolean(cell.hasAttribute("data-editing"))) this.#execute(data.command, key);
else return true;
} // if

if (cell === this.currentCell) return;

	cell.setAttribute("aria-selected", "false");
this.announceCell(this.currentCell);
} // #keydownHandler

#execute (command, key) {
command(key);
} // executeCommand

} // # Grid


function $grid (cell) {return $row(cell).parentElement;}
function getRow (cell) {return [...cell.parentElement.children];}

function getColumn (cell) {
const index = cell.cellIndex;
return [...cell.parentElement.parentElement.children].map($row => $row.children[index]);
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
return 	cell1.parentElement.rowIndex === cell2.parentElement.rowIndex;
} // isSameRow

function isSameColumn (cell1, cell2) {
return cell1.cellIndex === cell2.cellIndex;
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
