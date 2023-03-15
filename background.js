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

function convertToMovie(screenshotList) {
	// screenshotListを連結して、動画を生成する
	console.log(screenshotList);
}

// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
// 	if (request.command === "start") {
// 		let tabId = sender.tab.id;
// 		let screenshotList = [];

// 		chrome.tabs.executeScript(tabId, { file: "content-script.js" }, function () {
// 			// コンテンツスクリプトを実行する
// 			chrome.tabs.sendMessage(tabId, { command: "start" }, function () {
// 				// スクリーンショットが取得されるたびに、screenshotListに追加する
// 				chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
// 					if (request.command === "capture") {
// 						screenshotList.push(request.dataURL);
// 					}
// 				});

// 				// スクロールとスクリーンショットの処理が完了したら、動画に変換する
// 				setTimeout(function () {
// 					convertToMovie(screenshotList);
// 				}, 3000);
// 			});
// 		});
// 	}
// });
