import { not } from "./utilities.js";

/* coordinate.js
Labels are cell coordinates in excel notation (a1 is column 0, row 0).
*/

const columnLabels = "abcdefghijklmnopqrstuvwxyz";

export function parseLabel (label) {
label = label.trim().toLowerCase();
const result = label.match(/^([a-z]+)([0-9]+)$/);
//console.log("- result: ", result);

const c = result[1];
const r = result[2];


const column = columnLabels.indexOf(c)+1;
const row = Number(r);
return [row, column];
} // parseLabel

export function toLabel (row, column) {
const r = row < 1? 1 : row;
const c = column < 1? 1 : column;
return `${columnLabels.charAt(c-1)}${r}`;
} // toLabel
