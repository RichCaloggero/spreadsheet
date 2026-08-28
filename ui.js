import { Spreadsheet } from "./spreadsheet.js";
import { Grid } from "./grid.js";
import { Controller } from "./command.js";
import { generateHelpText } from "./help.js";
import { generateKeyboardHelp } from "./keymap.js";

main(document);

function main (document) {
const model = new Spreadsheet();
const helpDialog = createHelpDialog (document);
const view = new Grid(document, helpDialog);
document.querySelector(".spreadsheet").appendChild(view.dom);
document.body.appendChild(helpDialog);

const input = initializeLoader(document, model, view);

const controller = new Controller (model, view,
    () => load(input),
    () => save(model.save()),
    helpDialog);
} // main

function initializeLoader (document, model, view, controller) {
//console.log("load: ", model, view);
const input = document.createElement("input");
input.type = "file";
input.hidden = true;

input.addEventListener("change", async function () {
const files = [...input.files];
const text = await files[0].text();

let data;
try {
data = JSON.parse(text);
//console.log("JSON parsed correctly");
} catch (e) {
//console.log(e);
view.statusMessage(`failed to load data from ${files[0].name}; not valid JSON format`);
return;
} // try

    view.clear();
model.load(data);
renderCells(model.allCells, model, view);
grid.dom.focus();
}); // change event

return input;
} // initializeLoader

function load (input) {
input.click();

} // load

function save (data, view) {
try {
const jsonText = JSON.stringify(data);
//console.log("ui.save: ", jsonText);
saveFile("spreadsheet.dat", jsonText, document);
} catch (e) {
//console.log(e);
view.statusMessage(e);
} // try
} // save


function saveFile (name, text, document) {
const contents = new Blob([text], {type: "application/octet-stream", endings: "native"});
const url = URL.createObjectURL(contents);
const link = document.createElement("a");
link.setAttribute("href", url);
link.setAttribute("download", name);

link.click();
setTimeout(() => URL.revokeObjectURL(url), 1000);
} // saveFile



function createHelpDialog (document) {
const dialog = document.createElement("dialog");
    dialog.setAttribute("popover", true);
        dialog.setAttribute("closedBy", "any");
dialog.insertAdjacentHTML("beforeEnd", helpDialog(generateHelpText(generateKeyboardHelp())));
dialog.ariaLabelledByElements = [dialog.querySelector(".title")];
return dialog;
} // createHelpDialog       
    
function helpDialog (helpText) {
    return `<div class="head">
<h2 class="title">Help</h2>
<button autofocus onclick="parentElement.parentElement.close();" class="close" aria-label="Close">X</button>
</div><!-- .head -->

<div class="body">
${helpText}
</div><!-- .body -->        
`;
} // helpDialog


function renderCells (names , model, view) {
//console.log("loadCellsFromModel: ", names);
let errors = false;

for (const name of names) {
errors |= view.displayCellContents(model.cellContents(name));
} // for

return errors;
} // renderCells

