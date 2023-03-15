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


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.command === "capture") {
		// スクリーンショットを取得する
		chrome.tabs.captureVisibleTab(null, { format: "png" }, function (dataURL) {
			sendResponse({ dataURL: dataURL });
		});

		// 非同期処理であるため、trueを返してレスポンスが返るまで待機する
		return true;
	}
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === "copyToClipboard") {
		navigator.clipboard.writeText(message.text)
			.then(() => {
				console.log("Text copied to clipboard");
			})
			.catch(err => {
				console.error("Error copying text to clipboard", err);
			});
	}
});
