main(document);

function main (document) {

const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

const s = new Spreadsheet();

for (const key in monthNames) {
const cellLabel = `${"abcdefghijklmnopqrstuvwxyz".charAt(Number(key)+1)}1`;
s.setCellContents(cellLabel, monthNames[key]);
} // for

const g = new Grid({document, statusMessage, save, load}, s);
document.querySelector(".spreadsheet").appendChild(g.dom);
} // main

function save (data) {
try {
const jsonText = JSON.stringify(data);
//console.log("ui.save: ", jsonText);
saveFile("spreadsheet.dat", jsonText);
} catch (e) {
console.log(e);
statusMessage(e);
} // try
} // save

function load () {
const input = document.createElement("input");
input.type = "file";

input.addEventListener("change", async function () {
const files = [...input.files];
const text = await files[0].text();
let data;
try {
data = JSON.parse(text);
//console.log(data);
} catch (e) {
console.log(e);
statusMessage(`failed to load data from ${files[0].name}`);
return;
} // try

g.clear();
s.load(data);
g.dom.focus();
}, {once: true}); // change event

input.click();

/*const label = document.createElement("label");
label.textContent = "load file";
label.appendChild(input);
document.body.prepend(label);
label.focus();
*/
} // load


function statusMessage (text, remove = false) {
if (document.ariaNotify) {
document.ariaNotify(text);
return;
} // if

const status = document.querySelector(".status");
status.textContent = text;
if (remove) setTimeout(() => status.textContent = "", 7000);
} // statusMessage
