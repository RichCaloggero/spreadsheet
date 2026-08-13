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

