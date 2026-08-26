export const keymap = new Map([
["f1", {help: "display keyboard help", command: c => c.displayHelpDialog}],
    
  // navigation
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

// editing
["f2", {help: "edit current cell", command: c => c.startEditing()}],
["enter", {help: "end editing", editMode: true, command: c => c.endEditing()}],
["escape", {help: "cancel range definition or remove already defined range", command: c => c.cancel()}],
["delete", {help: "delete cell", command: c => c.delete()}],

// row and column tagging
["control+alt+shift+c", {help: "all cells in row become column header cells", command: c => c.markRowAsColumnHeaders()}],
["control+alt+shift+r", {help: "all cells in column become row header cells", command: c => c.markColumnAsRowHeaders()}],

// ranges
["control+space", {help: "begin / end marking range", command: c => c.setMark()}],

// load / save
["control+s", {help: "save", command: c => c.save()}],
["control+o", {help: "open", command: c => c.load()}],
["control+l", {help: "load", command: c => c.load()}],

["alt+=", {help: "autosum over defined range, if any", command: c => c.autosum()}],
]); // keymap
