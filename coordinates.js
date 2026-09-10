import { not } from "./utilities.js";

/* coordinate.js
Labels are cell coordinates in excel notation (a1 is column 1, row 1).
*/

const columnLabels = "abcdefghijklmnopqrstuvwxyz";

export function parseLabel (label) {
label = label.trim().toLowerCase();
const result = isLabel(label);
if (not(result)) throw new Error(`parseLabel: ${label} is an invalid label`);

const c = result[1];
const r = result[2];

// labels like "zz1" will be remapped to column 0 rather than the correct column (fix later)
const column = columnLabels.indexOf(c)+1;
const row = Number(r);

return [row, column];
} // parseLabel

export function toLabel (row, column) {
if (                row < 1 || column < 1) return null;
return `${columnLabels.charAt(column-1)}${row}`;
} // toLabel

export function isLabel (text) {
    const result = text.match(/^([a-z]+)([0-9]+)$/);
//console.log("- result: ", result);
return result;
} // isLabel
