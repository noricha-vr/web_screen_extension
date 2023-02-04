// async function getUrl() {
// 	let queryOptions = { active: true, currentWindow: true };
// 	let tabs = await chrome.tabs.query(queryOptions);
// 	if (tabs[0] === undefined) {
// 		return "";
// 	}
// 	if (tabs[0].url) return tabs[0].url;
// 	return "";
// }

// // アイコンをクリックした時に実行される関数
// async function clickHandler() {
// 	console.log("Button was clicked!");
// 	const url = await getUrl();
// 	console.log(url);
// 	// Your code here
// }
chrome.action.onClicked.addListener((tab) => {
	chrome.scripting.executeScript({
		target: { tabId: tab.id },
		files: ['content.js']
	});
});
