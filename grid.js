class Grid {
#grid = null;
#spreadsheet = null;
#ui = null;
	#range = emptyRange();
#mark = null;

#keymap = new Map([
// navigation
["arrowRight", {command: () =>  this.#setCurrentCell(this.#nextCellInRow())}],
["arrowLeft", {command: () => this.#setCurrentCell(this.#previousCellInRow())}],
["arrowDown", {command: () => this.#setCurrentCell(this.#nextCellInColumn())}],
["arrowUp", {command: () => this.#setCurrentCell(this.#previousCellInColumn())}],

// editing
["f2", {command: () => this.#startEditing()}],
["=", {command: () => this.#startEditing("=")}],
["alt+=", {command: () => {
if (this.#range.range.length > 0) this.#startEditing(`=sum(${expandRange(this.#range)})`);
else this.#ui.statusMessage("Autosum has no selection.");
} // if
}],

["enter", {editMode: true, command: () => this.#endEditing()}],
["escape", {editMode: true, command: () => {
if (this.#mark) {
this.#mark = null;
this.#ui.statusMessage("Selection canceled.");
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

// load / save
["control+s", {command: () => this.#ui.save(this.spreadsheet.save())}],
["control+o", {command: () => {
	this.#ui.load();
	this.#loadCellsFromModel();
}}],

]); // keymap

constructor (ui, spreadsheet, nRows = 100, nColumns = 26) {
this.#ui = ui;
	const document = ui.document;

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


grid.role = "grid";
grid.ariaActiveDescendantElement = grid.querySelector("td");
grid.tabIndex = 0;
this.#enableNavigation();


this.#unselectAllCells();

this.#loadCellsFromModel();

setTimeout(() => {
grid.focus();
this.announceCell(this.currentCell);
}, 50);
} // constructor

#loadCellsFromModel (names = this.#spreadsheet.allCells) {
for (const name of names) {
this.#displayCellContents(this.#spreadsheet.cellContents(name));
} // for
} // loadCellsFromModel


clear () {
for (cell of this.dom.querySelectorAll("gd")) {
	cell.removeAttribute("data-editing");
			cell.removeAttribute("data-formula");
cell.role = "gridcell";

		cell.innerHTML = "&nbsp;";
		} // forEach cell
	
		this.#mark = null;
		this.#range = emptyRange();
console.log("grid cleared.");
} // clear

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
this.#ui.statusMessage("cannot modify during selection...");
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
this.#loadCellsFromModel(this.#spreadsheet.setCellContents(this.#cellToLabel(cell), text, cell.role, this.#range.range));
} // if

cell.removeAttribute("data-editing");
cell.removeAttribute("data-old");
this.#grid.focus();
this.#ui.statusMessage("end editing.");
} // #endEditing

#displayCellContents (data) {
const {name, value, role, input, hasFormula} = data;
const cell = this.#labelToCell(name);

cell.role = role;
cell.textContent = hasFormula?value.toString() : input;
if (hasFormula && input.length > 0) cell.setAttribute("data-formula", input);
else cell.removeAttribute("formula");
} // #displayCellContents



announceCell (cell) {
	this.#ui.statusMessage(`${this.#cellToLabel(cell)}${cell.dataset.formula? ", has formula" : ""}`);
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
this.#spreadsheet.setRole(this.#cellToLabel(cell), role);
} // #setRole

#defineRange (cell) {
if (not(this.#mark)) {
this.#mark = cell;
this.#range = emptyRange();
this.#ui.statusMessage("mark set");
return;
} // if

const range = getRange(this.#mark, cell);
this.#range = range?
{type: range.type, range: range.range.map(cell => this.#cellToLabel(cell))}
: emptyRange();
//console.log("grid.range: ", this.#range);
this.#mark = null;

if (this.#range.type) this.#ui.statusMessage(`${this.#range.range.length} cells in ${this.#range.type} range.`);
else this.#ui.statusMessage("invalid range");
} // #defineRange


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
if (Boolean(data.editMode) === Boolean(cell.hasAttribute("data-editing"))) this.#execute(data.command, e);
else return true;
} // if

if (cell === this.currentCell) return;

	cell.setAttribute("aria-selected", "false");
this.announceCell(this.currentCell);
} // #keydownHandler

#execute (command, e) {
e.preventDefault();
e.stopPropagation();
e.stopImmediatePropagation();
command();
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

function emptyRange () {
return {type: "empty", range: []};
} // #emptyRange

function not(x) {return !x;}
