const modeTitles = {
  "nav": "Navigation Commands",
  "edit": "Editing Commands",
  "any": "Commands available in either mode"
};

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
["delete", {help: "delete cell", command: c => c.delete()}],

["control+z", {help: "undo", command: c => c.undo()}],
["control+shift+z", {help: "redo", command: c => c.redo()}],

["control+space", {help: "begin / end marking range", command: c => c.setMark()}],
["escape", {help: "cancel range definition or remove already defined range", command: c => c.cancelRange()}],

["control+alt+shift+r", {help: "all cells in row become column header cells", command: c => c.setColumnHeaders()}],
["control+alt+shift+c", {help: "all cells in column become row header cells", command: c => c.setRowHeaders()}],

["control+s", {help: "save", command: c => c.save()}],
["control+o", {help: "open", command: c => c.load()}],

["alt+=", {help: "autosum over defined range, if any", command: c => c.autoSum()}],
])],
["edit", new Map([
  ["enter", {help: "end editing", command: c => c.endEditing()}],
["escape", {help: "cancel editing", command: c => c.cancelEditing()}],
])],
["any", new Map([
["f1", {help: "display keyboard help", command: c => c.displayHelpDialog()}]
  ])]
]); // keymap

export function lookup (mode, key) {
return keymap.get(mode)?.get      (key) ?? keymap.get("any")?.get(key);
} // lookup

export function generateKeyboardHelp () {
  return [...keymap.keys()].map(mode => {
    return `<h4>${modeTitles[mode]}</h4>
    ${generateTable(keymap.get(mode))}
`;
}).join("\n");
  
function generateTable (keymap) {
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
} // generateTable
} // generateKeyboardHelp

