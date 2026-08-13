/* coordinate.js
Labels are cell coordinates in excel notation (a1 is column 0, row 0).
*/

const columnLabels = "abcdefghijklmnopqrstuvwxyz";

function parseLabel (label) {
	label = label.trim().toLowerCase();
const result = label.match(/^([a-z]+)([0-9]+)$/);
//console.log("- result: ", result);

if (not(result)) throw new Error(`bad cell label: ${label}; must be of the form "a1", "b3", etc.`);
const c = result[1];
const r = result[2];
if (c.length > 1) throw new Error(`Number of columns limited to 26 (i.e. "a" through "z").`);
const column = columnLabels.indexOf(c);
const row = Number(r) - 1;
return [row, column];
} // parseLabel

function formatLabel (row, column) {
	if (isValidRowNumber(row) &&isValidColumnNumber(column)) {
if (column > 26) throw new Error("column labels are limited to single alphabetic characters, i.e. max number of columns is 26.");
		return `${columnLabels.charAt(column)}${row+1}`;
	} else {
		throw new Error(`bad coordinates: ${row},${column}; both must be parsable as positive integers.`);
	} // if
} // formatLabel

function isValidRowNumber (n) {return Number.isInteger(n) && n >= 0;}
function isValidColumnNumber (n) {return Number.isInteger(n) && n >= 0 && n <= 25;}
