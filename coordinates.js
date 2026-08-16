/* coordinate.js
Labels are cell coordinates in excel notation (a1 is column 0, row 0).
*/

const columnLabels = "abcdefghijklmnopqrstuvwxyz";

function parseLabel (label, maxRowCount, maxColumnCount) {
if (not(label) || not(label instanceof String || typeof(label) === "string") || label.length < 2)
	throw new Error(`label must be a string containing at least two characters: ${label}`);

label = label.trim().toLowerCase();
const result = label.match(/^([a-z]+)([0-9]+)$/);
//console.log("- result: ", result);

if (not(result))
throw new Error("labels must be of the form a single letter, followed by any number of decimal digits (i.e. a1, z99");

const c = result[1];
const r = result[2];
if (c.length > 1) 
throw new Error("only single alphabetics can occur before the digits (i.e. a1, c99, but not ab22)");


const column = columnLabels.indexOf(c);
const row = Number(r) - 1;

if (row >= maxRowCount)
throw new Error(`row index cannot be greater than ${maxRowCount}`);

return [row, column];
} // parseLabel

function formatLabel (row, column, maxRowCount, maxColumnCount) {
if (isValidRowNumber(row) &&isValidColumnNumber(column)) {
if (column >= maxColumnCount) throw new Error("column labels are limited to single alphabetic characters, i.e. max number of columns is 26.");
if (row >= maxRowCount) throw new Error(`row count limited to ${maxRowCount}`);
	return `${columnLabels.charAt(column)}${row+1}`;
} else {
throw new Error(`bad coordinates: ${row},${column}; both must be parsable as positive integers.`);
} // if
} // formatLabel

function isValidRowNumber (n) {return Number.isInteger(n) && n >= 0;}
function isValidColumnNumber (n) {return Number.isInteger(n) && n >= 0;}
