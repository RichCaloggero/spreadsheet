import { not } from "./utilities.js";

const modeTitles = {
  "nav": "Navigation Commands",
  "edit": "Editing Commands",
  "any": "Commands available in either mode"
};

export class Key {
#separator = "+";
#keyNameMap = new Map([
["ctrlKey", "control"],
["altKey", "alt"],
["shiftKey", "shift"],
["metaKey", "meta"]
]); // map

#modifierNames = [];

	constructor (e) {
	this.#modifierNames = [...invertMap(this.#keyNameMap).keys()];
this.event = e;
this.key = this.eventToKey(e);
} // constructor

toString () {return this.key.join(this.#separator);}

eventToKey (e, ignoreUnadornedModifier = true) {
if (ignoreUnadornedModifier && this.#modifierNames.includes(e.key.toLowerCase())) return [];

const map = invertMap(this.#keyNameMap);
const key = this.#modifierNames.map(modifier => e[map.get(modifier)]? modifier : null)
.filter(modifier => modifier);

if (e.key === " ") key.push("space");
else if (e.key.length > 1) key.push(e.key.slice(0,1).toLowerCase() + e.key.slice(1));
else key.push(e.key.toLowerCase());

return key;
} // eventToKey
} // class Key


function invertMap (map) {
return new Map(
[...map.entries()].map(x => [x[1],x[0]])
); // new Map
} // invertMap

/// tests

console.assert(new Key({ctrlKey:true, shiftKey:true, key: " "}).toString() === new Key({ctrlKey:true,  key: " ", shiftKey:true}).toString());
console.assert(new Key({altKey: true, shiftKey:true, key: " "}).toString() !== new Key({ctrlKey:true,  key: " ", shiftKey:true}).toString());


  export const keymap = new Map([
["nav", new Map([
    ["arrowRight", {help: "move right one cell", command:  c => c.moveBy(0,1)}],
["arrowLeft", {help: "move one cell left", command: c => c.moveBy(0,-1)}],
["arrowDown", {help: "move one cell down", command: c => c.moveBy(1,0)}],
["arrowUp", {help: "move one cell up", command: c => c.moveBy(-1,0)}],

["home", {help: "first cell in row", command: c => c.moveToStartOfRow()}],
["end", {help: "last cell in row", command: c => c.moveToEndOfRow()}],
["shift+home", {help: "first cell in column", command: c => c.moveToStartOfColumn()}],
["shift+end", {help: "last cell in column", command: c => c.moveToEndOfColumn()}],

["control+home", {help: "first cell in grid", command: c => c.moveToStartOfGrid()}],
["control+end", {help: "last cell in grid", command: c => c.moveToEndOfGrid()}],

["f2", {help: "edit current cell", command: c => c.startEditing()}],
["delete", {help: "delete cell", command: c => c.deleteCells()}],

["control+z", {help: "undo", command: c => c.undo()}],
["control+shift+z", {help: "redo", command: c => c.redo()}],

["control+space", {help: "begin / end marking range", command: c => c.setMark()}],
["escape", {help: "cancel range definition or remove already defined range", command: c => c.cancelRange()}],

["control+alt+shift+c", {help: "all cells in row become column header cells", command: c => c.setColumnHeaders()}],
["control+alt+shift+r", {help: "all cells in column become row header cells", command: c => c.setRowHeaders()}],

["control+o", {help: "open", command: c => c.load()}],
["control+s", {help: "save", command: c => c.save()}],

["alt+=", {help: "autosum over defined range, if any", command: c => c.autoSum()}],
])],
["edit", new Map([
  ["enter", {help: "end editing", command: c => c.endEditing()}],
["escape", {help: "cancel editing", command: c => c.cancelEditing()}],
])],
["any", new Map([
["control+o", {command: c => false}],
["control+s", {command: c => false}],
["f1", {help: "display keyboard help", command: c => c.displayHelpDialog()}]
  
])]
]); // keymap

export function lookup (mode, key) {
const any = keymap.get("any");
const map = keymap.has(mode)? keymap.get(mode) : any;

const entry = map.has(key)? map.get(key)
: any.has(key)? any.get(key)
: null;

return entry;
} // lookup

export function generateKeyboardHelp () {
  return [...keymap.keys()].map(mode => {
    return `<h4>${modeTitles[mode]}</h4>
    ${generateTable(keymap.get(mode))}
`;
}).join("\n");
  
function generateTable (keymap) {
    return `<table>
${[...keymap.entries()]
.filter(entry => entry[1].help)
.map(entry => {
const [key, data] = entry;
return `<tr>
<th>${data.help}</th>
<td>${key}</td>
</tr>`;
}).join("\n")}
</table>
`;
} // generateTable
} // generateKeyboardHelp

