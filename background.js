

async function getUrl() {
	let queryOptions = { active: true, currentWindow: true };
	let tabs = await chrome.tabs.query(queryOptions);
	if (tabs[0] === undefined) {
		return "";
	}
	if (tabs[0].url) return tabs[0].url;
	return "";
}

// アイコンをクリックした時に実行される関数
function clickHandler() {
	console.log("Button was clicked!");
	// Your code here
}
chrome.action.setPopup(
	{
		popup: "popup.html"
	},
	() => {
		console.log("Button was clicked!");
	},
)
