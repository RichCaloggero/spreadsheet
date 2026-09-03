import { not, isFunction } from "./utilities.js";
import { toLabel, parseLabel, formatLabel } from "./coordinates.js";

const requireGridcellRole = false;
const useAriaNotify = false;

export class Grid {
#grid = null;
#helpDialog = null;
#maxRowCount = 0;
#maxColumnCount = 0;


constructor (document, helpDialog, nRows = 100, nColumns = 26) {
this.#helpDialog = helpDialog;
this.#maxRowCount = nRows;
this.#maxColumnCount = nColumns;

if (not(document instanceof HTMLDocument)) throw new Error("first argument to Grid() must be a HTMLDocument object");

const grid = this.#grid = document.createElement("table");

for (let i=0; i<nRows; i++) {
const row = document.createElement("tr");

for (let j=0; j<nColumns; j++) {
const cell = document.createElement("td");
cell.dataset.label = toLabel(i, j);
if (requireGridcellRole) cell.role = "gridcell";
//cell.innerHTML = "&nbsp;";
//cell.tabIndex = -1;
row.appendChild(cell);
} // for column

grid.appendChild(row);
} // for row


grid.role = "grid";
grid.ariaActiveDescendantElement = grid.querySelector("td");
grid.tabIndex = 0;

setTimeout(() => {
this.focus();
this.#announceCell(this.currentCell);
}, 50);
} // constructor

focus () {this.#grid.focus();}

get dom () {return this.#grid;}
get currentCell () {return this.#grid.ariaActiveDescendantElement;}
get cursor () {  return this.#grid.ariaActiveDescendantElement?.dataset.label ?? null;}
set cursor (label) {this.#grid.activeDescendantElement = this.labelToCell(label);}

get maxRowCount () {return this.#maxRowCount;}
get maxColumnCount () {return this.#maxColumnCount;}
get helpDialog() {return this.#helpDialog;}
get value () {return this.getValue(this.cursor);}
get formula () {return this.getFormula(this.cursor);}
get isEditing () {return this.getIsEditing(this.cursor);}

getValue (label) {return this.labelToCell(label).textContent;}
getFormula (label) {return this.labelToCell(label).dataset.formula;}
getIsEditing (label) {return this.labelToCell(label).hasAttribute("data-editing");}

moveTo(label) {
    const oldCell = this.currentCell;
    const cell = this.labelToCell(label);

    if (cell && cell !== oldCell) {
        this.#setCurrentCell(cell);
                this.#announceCell(cell);
                    return true;
} // if

return false;
} // moveTo

firstLabelInRow (label) {return this.cellToLabel(this.#firstCellInRow(this.labelToCell(label)));}
lastLabelInRow (label) {return this.cellToLabel(this.#lastCellInRow(this.labelToCell(label)));}
firstLabelInColumn (label) {return this.cellToLabel(this.#firstCellInColumn(this.labelToCell(label)));}
lastLabelInColumn (label) {return this.cellToLabel(this.#lastCellInColumn(this.labelToCell(label)));}
firstLabelInGrid (label) {return this.cellToLabel(this.#firstCellInGrid(this.labelToCell(label)));}
lastLabelInGrid (label) {return this.cellToLabel(this.#lastCellInGrid(this.labelToCell(label)));}

#firstCellInRow (cell) {return cell.parentElement.firstElementChild;}
#lastCellInRow (cell) {return cell.parentElement.lastElementChild;}
#firstCellInColumn (cell) {return cell.parentElement.parentElement.firstElementChild.children[cell.cellIndex];}
#lastCellInColumn (cell) {return cell.parentElement.parentElement.lastElementChild.children[cell.cellIndex];}
#firstCellInGrid (cell) {return cell.parentElement.parentElement.firstElementChild.firstElementChild;}
#lastCellInGrid (cell) {return cell.parentElement.parentElement.lastElementChild.lastElementChild;}

    bind(type, handler) {
    this.#grid.addEventListener(type, handler);
} // bind



clear () {
for (const cell of this.#grid.querySelectorAll("td")) {
cell.removeAttribute("data-cursor");
cell.removeAttribute("data-editing");
cell.removeAttribute("data-formula");
cell.removeAttribute("data-in-range");
cell.removeAttribute("data-mark");
cell.removeAttribute("aria-invalid");
if (requireGridcellRole) cell.role = "gridcell";
cell.ariaDescription = "";

//cell.innerHTML = "&nbsp;";
} // forEach cell
} // clear

setMark () {
    this.clearMark();
this.currentCell.setAttribute("data-mark", true);
} // setMark

clearMark () {
this.#grid.querySelector("[data-mark]")?.removeAttribute("data-mark");
} // #clearMark


#setCurrentCell (cell) {
  if (not(cell)) return;

  const previous = this.#grid.querySelector("td[data-cursor]");
  if (previous === cell) return;
  if (previous) previous.removeAttribute("data-cursor");

  cell.setAttribute("data-cursor", true);
  this.#grid.ariaActiveDescendantElement = cell;

  cell.scrollIntoView({block: "nearest", inline: "nearest"});
  this.#generateDescription(cell);
} // setCurrentCell


#allCells () {return [...this.#grid.querySelectorAll("td")];}

findCells (expression) {
return isFunction(expression)?
[...this.#grid.querySelectorAll("td")].filter(expression)
: [...this.#grid.querySelectorAll(expression)];
} // findCells


#generateDescription (cell) {
} // #generateDescription



startEditing (overrideText) {
const cell = this.currentCell;
if (cell.hasAttribute("data-editing")) return;

cell.setAttribute("data-editing", true);

const text = overrideText? overrideText
: cell.dataset.formula? cell.dataset.formula
: cell.textContent;
cell.textContent = "";

cell.insertAdjacentHTML("beforeEnd", `<input type="text">`);
cell.querySelector("input").value = text;
cell.querySelector("input").focus();
} // #startEditing

#getValueFromInput (cell) {
const input = cell.querySelector("input");
const text = input.value.trim();
cell.innerHTML = "";
return text;
} // #getValueFromInput

cancelEditing () {
    const cell = this.currentCell;
    this.#getValueFromInput(cell);
cell.removeAttribute("data-editing");
this.#announceCell();
this.focus();
} // cancelEditing

endEditing (cancel = false) {
const cell = this.currentCell;
const label = this.cellToLabel(cell);
if (not(cell.hasAttribute("data-editing"))) return false;

cell.textContent = this.#getValueFromInput(cell);
cell.removeAttribute("data-editing");
cell.removeAttribute("data-old");
this.focus();
this.statusMessage("end editing.");

return {label: this.cellToLabel(cell), input: cell.textContent, role: cell.role};
} // endEditing


displayCellContents (data) {
//console.log("displayCellContents: ", data);
const {name, value, role, input, hasFormula, error} = data;
const cell = this.labelToCell(name);
//console.log("displayCellContents: ", name, input, role, value, hasFormula, error, cell);

cell.textContent = value;
cell.role = role;

if (data.error) {
cell.ariaDescription = data.description;
cell.setAttribute("aria-invalid", "true");
} else {
cell.removeAttribute("aria-description");
cell.removeAttribute("aria-invalid");
} // if

if (hasFormula && input.length > 0) cell.setAttribute("data-formula", input);
else cell.removeAttribute("data-formula");

typeof(value) === "number"? cell.setAttribute("data-type", "number")
 : cell.removeAttribute("data-type");

return data.error;
} // #displayCellContents

cleanupDeletedCell (label) {
    const cell = this.labelToCell(label);
    cell.removeAttribute("data-formula");
cell.ariaDescription = "";
cell.removeAttribute("aria-invalid");
cell.textContent = "";
cell.innerHTML = "";
this.clearRange();
} // cleanupDeletedCell



#announceCell (cell = this.currentCell) {
const label = this.cellToLabel(cell);
const message =
`${label}${cell.dataset.formula? ", has formula" : ""}${cell.hasAttribute("data-mark")? ", mark set" : ""}`;
this.statusMessage(message);
} // announceCell

cellToLabel (cell) {
return cell.closest("[data-label]")?.dataset.label ?? null;
} // cellToLabel

labelToCell (label) {
return this.#grid.querySelector(`td[data-label="${label}"]`);
} // labelToCell

#isFirstCell (cell) {   return cell === this.#grid.querySelector("td");}


markColumnAsRowHeaders (cell = this.currentCell) {
if (this.#isFirstCell(cell))    cell = cell.parentElement.parentElement.children[1].firstElementChild;
let role = cell.role;
if (requireGridcellRole) {
    role = role === "gridcell"? "rowheader" : "gridcell";
} else {
    role = role === "rowheader"? "" : "rowheader";
} // if

getColumn(cell).forEach(cell => cell.role = role);
this.setGridCell("a1"); // always neither row or column header
} // #markColumnAsRowHeaders

markRowAsColumnHeaders (cell = this.currentCell) {
if (this.#isFirstCell(cell)) cell = cell.nextElementSibling;
let role = cell.role;
if (requireGridcellRole) {
    role = role === "gridcell"? "columnheader" : "gridcell";
} else {
role = role === "columnheader"? "" : "columnheader";
} // if

getRow(cell).forEach(cell => cell.role = role);
this.setGridCell("a1"); // always neither row or column header
} // #markRowAsColumnHeaders

setRowHeader (label) {this.labelToCell(label).role = "rowheader";}
setColumnHeader (label) {this.labelToCell(label).role = "columnheader";}
setGridCell (label) {this.labelToCell(label).role = requireGridcellRole? "gridcell" : ""}

markRange (labels) {
for (const label of labels) {
    this.labelToCell(label).setAttribute("data-in-range", true);
} // for

this.statusMessage(`${labels.size} items in range.`);
} // mmarkRange

clearRange () {
    this.#grid.querySelectorAll("td[data-in-range], td[data-mark]").forEach(x => {
        x.removeAttribute("data-in-range");
    x.removeAttribute("data-mark");
});
} // clearRange

get row () {
    return new Set(
        getRow(this.currentCell)
        .map(cell => cellToLabel(cell))
    ); // new Set
} // get row

get column () {
    return new Set(
        getColumn(this.currentCell)
        .map(cell => cellToLabel(cell))
    ); // new Set
} // get column

statusMessage (text, remove = false) {
setTimeout(() => {
if (document.ariaNotify && useAriaNotify) {
document.ariaNotify(text);
return;
} // if

const status = document.querySelector("[role=status]");
status.textContent = text;
if (remove) setTimeout(() => status.textContent = "", 7000);
}, 70);
} // statusMessage

displayHelpDialog () {this.#helpDialog.showModal();}

} // class Grid

/// Grid helpers

function getRowIndex (cell) {return cell.parentElement.cellIndex;}
function getColumnIndex (cell) {return cell.cellIndex;}

function getRow (cell) {return [...cell.parentElement.children];}

function getColumn (cell) {
const index = cell.cellIndex;
return [...cell.parentElement.parentElement.children].map($row => $row.children[index]);
} // getColumn


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
return [...range.range].join(", ");
} // expandRange

function emptyRange () {
return {type: "empty", range: new Set([])};
} // #emptyRange

function rowIndex (cell) {return cell.parentElement.rowIndex;}
function columnIndex (cell) {return cell.cellIndex;}

