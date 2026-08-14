class Grid {
#grid = null;
#spreadsheet = null;
#ui = null;
	#range = emptyRange();
#mark = null;

#keymap = new Map([
["f1", {help: "display keyboard help", command: () => this.displayKeyboardHelp().showModal()}],

// navigation
["arrowRight", {help: "move right one cell", command: () =>  this.#setCurrentCell(this.#nextCellInRow())}],
["arrowLeft", {help: "move one cell left", command: () => this.#setCurrentCell(this.#previousCellInRow())}],
["arrowDown", {help: "move one cell down", command: () => this.#setCurrentCell(this.#nextCellInColumn())}],
["arrowUp", {help: "move one cell up", command: () => this.#setCurrentCell(this.#previousCellInColumn())}],

// editing
["f2", {help: "edit current cell", command: () => this.#startEditing()}],
//["=", {help: "insert formula command: () => this.#startEditing("=")}],
["alt+=", {help: "autosum over defined range, if any", command: () => {
if (this.#range.range.length > 0) this.#startEditing(`=sum(${expandRange(this.#range)})`);
else this.#ui.statusMessage("Autosum has no selection.");
} // if
}],

["enter", {help: "end editing", editMode: true, command: () => this.#endEditing()}],
["escape", {help: "cancel range definition or remove already defined range", command: () => {
if (this.#mark) {
this.#mark = null;
this.#ui.statusMessage("Selection canceled.");
} else if (this.#range.range.length > 0) {
	this.#range = emptyRange();
	this.#ui.statusMessage("range removed.");
} // if
}}],

	["delete", {help: "delete cell", command: () => this.#deleteCell(this.currentCell)}],

// row and column tagging
["control+alt+shift+c", {help: "all cells in row become column header cells", command: () => this.#markRowAsColumnHeaders(this.currentCell)}],
["control+alt+shift+r", {help: "all cells in column become row header cells", command: () => this.#markColumnAsRowHeaders(this.currentCell)}],

// ranges
["control+space", {help: "begin / end marking range", command: () => this.#defineRange(this.currentCell)}],

// load / save
["control+s", {help: "save", command: () => this.#ui.save(this.spreadsheet.ssave())}],
["control+o", {help: "load", command: () => {
	this.#ui.load();
	this.#loadCellsFromModel();
}}],

["control+l", {help: "load", command: () => {
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
console.log("new grid cell contents: ", cell);
	
	if (not(cell.hasAttribute("data-formula") && this.#range.range.length > 1)) {
const cells = new Set(this.#range.range);
		const label = this.#cellToLabel(cell);
		console.log("created set: ", cells);

		if (cells.has(label)) {
			cells.delete(label);
	console.log("- removed ", label, "; ", cells);
			for (const name of cells) {
	console.log("autofilling ", name);
	this.#loadCellsFromModel(this.spreadsheet.setCellContents(name, cell.textContent, cell.role));
	} // for
} else {
this.#ui.statusMessage("current cell must be within range to autofill.");
} // if
} // if
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

displayKeyboardHelp () {
if (not(this.#ui.document.body.querySelector("#help-dialog")))
	this.#ui.document.body.insertAdjacentHTML("beforeEnd",
	`<dialog popover id="help-dialog" closedBy="any">
<div class="head">
	<h2>Keyboard Help</h2>
	<button autofocus onclick="this.parentElement.parentElement.close();" class="close" aria-label="Close">X</button>
</div><!-- .head -->
<div class="body">
<table>
${[...this.#keymap.entries()].map(entry => {
	const [key, data] = entry;
	return `<tr>
	<th>${data.help}</th>
	<td>${key}</td>
	</tr>`;
}).join("\n")}
</table></div>
</div></dialog>
`); // insertAdjacentHTML

return this.#ui.document.body.querySelector("#help-dialog");
} // help



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
else if (key === "escape" && cell.hasAttribute("data-editing")) this.#endEditing("cancel");
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
