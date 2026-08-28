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

const readFile = initializeLoader(document);
const controller = new Controller (model, view, readFile, writeFile, helpDialog);
} // main


/*function save (data, view) {
try {
const jsonText = JSON.stringify(data);
//console.log("ui.save: ", jsonText);
saveFile("spreadsheet.dat", jsonText, document);
} catch (e) {
//console.log(e);
view.statusMessage(e);
} // try
} // save
*/



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


function initializeLoader (document, view) {
  const input = document.createElement("input");
  input.type = "file";
  let pending = null;

  input.addEventListener("change", async () => {
    try {
        const text = await input.files[0].text();
    input.value = "";          // see below
    pending?.(text);
  
} catch (e) {
view.statusMessage(e);
} // try
});

  return callback => { pending = callback; input.click(); };
} // initializeLoader

function writeFile (name, text) {
const contents = new Blob([text], {type: "application/octet-stream", endings: "native"});
const url = URL.createObjectURL(contents);
const link = document.createElement("a");
link.setAttribute("href", url);
link.setAttribute("download", name);

link.click();
setTimeout(() => URL.revokeObjectURL(url), 1000);
} // writeFile


