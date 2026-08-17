main(document);

function main (document) {
const s = new Spreadsheet();
//s.test2();

const g = new Grid({document, statusMessage, save, load}, s);
document.querySelector(".spreadsheet").appendChild(g.dom);
} // main

function save (data) {
try {
const jsonText = JSON.stringify(data);
//console.log("ui.save: ", jsonText);
saveFile("spreadsheet.dat", jsonText);
} catch (e) {
//console.log(e);
statusMessage(e);
} // try
} // save

function load (grid) {
const spreadsheet = grid.spreadsheet;
//console.log("load: ", grid, spreadsheet);
const input = document.createElement("input");
input.type = "file";

input.addEventListener("change", async function () {
const files = [...input.files];
const text = await files[0].text();

let data;
try {
data = JSON.parse(text);
//console.log("JSON parsed correctly");
} catch (e) {
//console.log(e);
statusMessage(`failed to load data from ${files[0].name}; not valid JSON format`);
return;
} // try

grid.clear();
spreadsheet.load(data);
grid.loadCellsFromModel();
grid.dom.focus();
}, {once: true}); // change event

input.click();

/*const label = document.createElement("label");
label.textContent = "load file";
label.appendChild(input);
document.body.prepend(label);
label.focus();
*/
} // load

function saveFile (name, text) {
const contents = new Blob([text], {type: "application/octet-stream", endings: "native"});
const url = URL.createObjectURL(contents);
const link = document.createElement("a");
link.setAttribute("href", url);
link.setAttribute("download", name);
/*const confirmation = document.createElement("p");
confirmation.appendChild(link);
document.body.prepend(confirmation);
link.focus();
*/
link.click();
setTimeout(() => URL.revokeObjectURL(url), 1000);
} // saveFile



function statusMessage (text, remove = false) {
if (document.ariaNotify) {
document.ariaNotify(text);
return;
} // if

const status = document.querySelector(".status");
status.textContent = text;
if (remove) setTimeout(() => status.textContent = "", 7000);
} // statusMessage
