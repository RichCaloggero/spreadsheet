export function not (x) {return !x;}

export function isFormula (text) {return text.charAt(0) === "=";}

export function isString (x) {
return typeof(x) === "object"? x instanceof String : typeof(x) === "string";
} // isString

export function isFunction (x) {return typeof(x) === "function" || x instanceof Function;}

export function isNumeric (value) {
    return not(value === "") && not(value === null) && not(Number.isNaN(Number(value))) && typeof(Number(value)) === "number";
} // isNumeric

// getSymbols excludes function symbol nodes and range nodes
export function getSymbols (node) {
return node
.filter((node, path, parent) => node.type === "SymbolNode" && path !== "fn" && parent.type !== "RangeNode")
.map(node => node.name.trim());
} // getSymbols

export function getFunctions (node) {
return node
.filter((node, p) => node.type === "SymbolNode" && p === "fn")
.map(node => node.name.trim());
} // getFunctions

export function replaceSymbols (node, newSymbols) {
return node.transform(function (node, path, parent) {
if (node.isSymbolNode ) {
return new math.SymbolNode(newSymbols.has(node.name)? newSymbols.get(node.name) : node.name);
} else {
return node
} // if
}); // transform
} // replaceSymbols

