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

