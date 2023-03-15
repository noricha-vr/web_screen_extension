chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.command === "start") {
		let scrollPosition = 0;
		let screenHeight = window.innerHeight;
		let totalHeight = document.documentElement.scrollHeight;
		let screenshotList = [];

		function scrollAndCapture() {
			if (scrollPosition >= totalHeight) {
				// スクロールが完了したら、screenshotListをpopup.jsに送信する ここの実装をお願いします。
				console.log(screenshotList);
				chrome.runtime.sendMessage({ command: "screenshotList", data: screenshotList }, function (response) {
					console.log(response);
				});

				return;
			}

			// スクロールする
			window.scrollTo(0, scrollPosition);

			// スクリーンショットを取得する
			chrome.runtime.sendMessage({ command: "capture" }, function (response) {
				screenshotList.push(response.dataURL);

				// スクロール位置を更新する
				scrollPosition += screenHeight / 3;

				// 1秒間待機してから、次のスクロールとスクリーンショットを実行する
				setTimeout(scrollAndCapture, 500);
			});
		}

		// スクロールとスクリーンショットの処理を開始する
		scrollAndCapture();
	}
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
