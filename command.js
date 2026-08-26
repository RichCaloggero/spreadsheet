import { keymap } from "./keymap.js";

export class Controller {
#mark = null;
#view = null;
#model = null;

constructor (model, view) {
    this.#model = model;
    this.#view = view;
    view.bind("keydown", e => keydownHandler(e, this));
this.#renderCells();
} // constructor

get cursor () {return this.#view.cursor;}

setMark () {
this.#mark = (this.#mark && this.#mark === this.cursor)?
null : this.cursor;

if (this.#mark) {
  this.#view.setMark();
  this.#view.statusMessage("mark set.");
} else {
this.#view.clearMark();
this.#view.statusMessage("mark cleared.");
} // if
} // setMark

moveBy (dRow, dCol) {
  const [row, col] = parseLabel(this.#view.cursor);
  return this.#moveTo(toLabel(row + dRow, col + dCol));
} // moveBy

  #moveTo (label) {
  if (!this.#view.labelToCell(label)) return false;   // off-grid, stay put
  this.#view.moveTo(label);
  if (this.#mark) {
  const range =       this.#getRange();
if (range)     {
  this.#view.markRange(range);
} else {
  this.#clearMark();;
} // if
} // if
  
  return true;
} // moveTo

moveToStartOfRow () { this.#moveTo(this.#view.firstLabelInRow(this.cursor)); }
moveToEndOfRow () { this.#moveTo(this.#view.lastLabelInRow(this.cursor)); }

moveToStartOfColumn () { this.#moveTo(this.#view.firstLabelInColumn(this.cursor)); }
moveToEndOfColumn () { this.#moveTo(this.#view.lastLabelInColumn(this.cursor)); }

moveToStartOfGrid () { this.#moveTo(this.#view.firstLabelInGrid(this.cursor)); }
moveToEndOfGrid () { this.#moveTo(this.#view.lastLabelInGrid(this.cursor)); }

#renderCells (names = this.#model.allCells) {
//console.log("loadCellsFromModel: ", names);
let errors = false;

for (const name of names) {
errors = this.#view.displayCellContents(this.#model.cellContents(name));
} // for

return errors;
} // #renderCells

startEditing () {this.#view.startEditing();}

endEditing (cancel) {
    const {label, input, role} = this.#view.endEditing(cancel);
if (not(label)) return;

if (this.#autoFillPossible(label)) this.#autofill(label);
else this.#renderCells(this.#model.setCellContents(label));
  } // endEditing

  #autoFillPossible () {

  } // #autoFillPossible

  #autofill () {
  } // #autofill
  

delete () {
const label = this.#view.cursor;
const range = this.#getRange();
//console.log("delete: ", range);
const labels =  (range && range.has(label))?
range : new Set([label]);

for (const label of labels) {
//console.log("deleting: ", label);
this.#renderCells(this.#model.deleteCell(label));
this.#view.cleanupDeletedCell(label);
} // for

if (this.#mark) this.#clearMark();
this.#view.statusMessage(`${labels.size} cell${labels.size > 1? "s" : ""} deleted.`);
} // delete

execute (key, data, e) {
if (key === "escape" && this.#view.isEditing) {
  console.log("escape: will cancel editing...");
this.#view.cancelEditing();
  return;
} // if


e.preventDefault();
e.stopPropagation();
e.stopImmediatePropagation();

if (Boolean(data?.editMode) === Boolean(this.#view.isEditing)) data.command(this);
} // executeCommand

#getRange (l1 = this.#mark, l2 = this.#view.cursor) {
  if (not(l1)) return null;
  const [mr, mc] = parseLabel(l1), [cr, cc] = parseLabel(l2);
  if (mr === cr) return new Set(rowSegment(mr, mc, cc));
if (mc === cc) return new Set (columnSegment(mr, mc, cr));
  return null;              // off-axis
} // #getRange

markRowAsColumnHeaders () {this.#view.setColumnHeaders();}
markColumnAsRowHeaders () {this.#view.setRowHeaders();}

#clearMark () {
  this.#mark = null;
  this.#view.clearRange();
    this.#view.statusMessage("range cleared.");
} // #clearMark

cancel () {
  if (this.#view.isEditing) {
    this.#view.endEditing("cancel");
  } else if (this.#mark) {
    this.#clearMark();
  } // if
} // cancel

displayHelpDialog () {this.#view.displayHelpDialog();}

} // class


/// commands

function displayHelpDialog (controller) {
controller.displayHelpDialog();
} // displayHelpDialog

function cancel (c) {return c.cancel();}

function nextCellInRow (c) {return moveBy(c, 0,1);} // nextCellInRow
function previousCellInRow (c) {return moveBy(c, 0,-1);} // nextCellInRow

function nextCellInColumn (c) {return moveBy(c, 1,0);} // nextCellInRow
function previousCellInColumn (c) {return moveBy(c, -1,0);} // nextCellInRow

function firstCellInRow (c) {return c.moveToStartOfRow();}
function lastCellInRow (c) {return c.moveToEndOfRow();}

function firstCellInColumn (c) {return c.moveToStartOfColumn();}
function lastCellInColumn (c) {return c.moveToEndOfColumn();}

function firstCellInGrid (c) {return c.moveToStartOfGrid();}
function lastCellInGrid (c) {return c.moveToEndOfGrid();}



function startEditing (c) {c.startEditing();}
function endEditing (c) {c.endEditing();}
function cancelEditing (c) {c.endEditing("cancel");}

function setMark (c) {c.setMark();} 
    
function deleteCells (c) {c.delete();}

function load (c) {c.load();}
function save (c) {c.save();}

function autosum (c) {c.autoSum();}
    /*if this.#getRange().size > 0) controller.startEditing(`=sum(${expandRange(#range)})`);
else statusMessage("Autosum has no selection.");
} // autosum
*/

function markRowAsColumnHeaders (c) {c.markRowAsColumnHeaders();}
function markColumnAsRowHeaders (c) {c.markColumnAsRowHeaders ();}

/// helpers


function moveBy (c, dRow, dCol) {
  const [row, col] = parseLabel(c.cursor);
  return c.moveTo(toLabel(row + dRow, col + dCol));
} // moveBy

function rowSegment (r, c1, c2) {
  return sequence(c1,c2)
  .map (x => toLabel(r, x));
} // rowSegment

function columnSegment (r1, r2, c) {
  return sequence(r1,r2)
  .map (x => toLabel(x, c));
} // columnSegment


    function sequence (a, b) {
      return Array.from({length: Math.abs(a-b) + 1}, (_,i) => i + Math.min(a,b));
    } // sequence

/// keyboard handler




function keydownHandler (e, controller) {
const key = new Key(e).toString();
if (key.length === 0) return false;
//console.log("keydown: ", key);
const label =  controller.cursor;

//console.log("keydown: ", key, label);
if (keymap.has(key) ) {
const data = keymap.get(key);

return controller.execute(key, data, e);
} // if
} // #keydownHandler



        export function generateKeyboardHelp () {
    return `<table>
${[...keymap.entries()].map(entry => {
const [key, data] = entry;
return `<tr>
<th>${data.help}</th>
<td>${key}</td>
</tr>`;
}).join("\n")}
</table>
`;
} // generateKeyboardHelp


