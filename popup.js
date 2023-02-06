async function getUrl() {
	let queryOptions = { active: true, currentWindow: true };
	let tabs = await chrome.tabs.query(queryOptions);
	if (tabs[0] === undefined) {
		return "";
	}
	if (tabs[0].url) return tabs[0].url;
	return "";
}

function updateProgress(value) {
	document.getElementById("progressbar").value = value;
}

async function main() {
	let url = await getUrl();
	let value = 50;
	updateProgress(value);
	alert('current utl: ' + url);
}
main();
