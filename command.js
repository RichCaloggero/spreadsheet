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
errors |= this.#view.displayCellContents(this.#model.cellContents(name));
} // for

return errors;
} // #renderCells

startEditing () {this.#view.startEditing();}

endEditing () {
    const result = this.#view.endEditing();
    if (not(result)) return;
    const {label, input, role} = result;

if (not(label)) return;

if (this.#autoFillPossible(label)) this.#autofill(label, input, role);
else this.#renderCells(this.#model.setCellContents(label, input, role));
  } // endEditing

  #autoFillPossible (label) {
return this.#view.labelToCell(label) && this.#mark;
  } // #autoFillPossible

  #autofill (label, input, role) {
  const range = this.#getRange();
if (isNumeric(input)) return this.#fillConstant(range, input, role);
else this.#fillFormula(label, range, input, role);
  
  } // #autofill
  
#fillConstant (range, value, role) {
for (const label of range) {
  this.#renderCells(this.#model.setCellContents(label, value, role));
} // for
} // #fillConstant

#fillFormula (label, range, formula, role) {
//console.log("fillFormula: ", label, range, formula, role);

const e = math.parse(formula.slice(1));
const symbols = getSymbols(e);
//console.log("- symbols: ", symbols);

const targetType = rangeType(this.#mark, this.#view.cursor);
const targetTypeString = ["row", "column"][targetType];
//console.log("- targetType: ", `${targetTypeString} (${targetType})`);

const target = new Set();
symbols.map(label => parseLabel(label))
.forEach(c => target.add(c[targetType]));
//console.log("- target: ", target);

if (target.size > 1) {
this.#view.statusMessage(`all references must have same ${targetTypeString}`);
return;
} // if
 
if (target.has(parseLabel(label)[targetType])) {
this.#view.statusMessage(`all symbols must reference a different ${targetTypeString} than current`);
return;
} // if

const targetIndex  = [...target.values()][0];
//console.log("- targetIndex: ", targetIndex);

for (const label of range) {
const c = parseLabel(label);

const newSymbols = new Map(
symbols.map(s => {
const c0 = targetType === 0?
[targetIndex, c[1]]
: [c[0], targetIndex];
return [s, formatLabel(c0[0], c0[1], this.maxRowCount, this.maxColumnCount)];
}) // map
) // newSymbols
//console.log("- cell coordinates: ", c, " newSymbols: ", newSymbols);

const formula = replaceSymbols(e, newSymbols).toString();
//console.log("- formula: ", formula);

this.#renderCells(this.#model.setCellContents(label, `=${formula}`, role));
} // for
} // #fillFormula


  
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
} else if (Boolean(data?.editMode) === Boolean(this.#view.isEditing)) {
  data.command(this);
} else {
  return true;
  } // if


/*e.preventDefault();
e.stopPropagation();
e.stopImmediatePropagation();
*/

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





    


function autosum (c) {c.autoSum();}
    /*if this.#getRange().size > 0) controller.startEditing(`=sum(${expandRange(#range)})`);
else statusMessage("Autosum has no selection.");
} // autosum
*/


/// helpers



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


function rangeType (l1, l2) {
  const [r1, c1] = parseLabel(l1), [r2, c2] = parseLabel(l2);
  return r1 === r2? 0 : 
  c1 === c2? 1
  : -1;
} // rangeType

