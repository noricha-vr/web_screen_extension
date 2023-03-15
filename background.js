chrome.action.onClicked.addListener((tab) => {
	chrome.scripting.executeScript({
		target: { tabId: tab.id },
		files: ['content.js']
	});
});

// background.js

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.movieUrl && request.domain) {
		chrome.downloads.download({
			url: request.movieUrl,
			filename: request.domain + ".mp4",
			saveAs: true
		}, function (downloadId) {
			sendResponse("Download started");
		});
	}
	return true;
});
