export function not (x) {return !x;}

export function isFormula (text) {return text.charAt(0) === "=";}

export function isString (x) {
return typeof(x) === "object"? x instanceof String : typeof(x) === "string";
} // isString

export function isFunction (x) {return typeof(x) === "function" || x instanceof Function;}

export function isNumeric (value) {
    return not(value === "") && not(value === null) && not(Number.isNaN(Number(value))) && typeof(Number(value)) === "number";
} // isNumeric

