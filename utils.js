export function clickCopy(text_element) {
	text_element.select();
	text_element.setSelectionRange(0, 99999);
	document.execCommand("copy");
}
