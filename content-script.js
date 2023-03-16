chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.command === "start") {
		let scrollPosition = 0;
		let screenHeight = window.innerHeight;
		let totalHeight = document.documentElement.scrollHeight;
		let screenshotList = [];

		// 最大スクロールピクセル数を設定する
		const maxScrollPixels = 20000;

		async function scrollAndCapture(currentScrollPosition) {
			if (currentScrollPosition >= totalHeight || currentScrollPosition >= maxScrollPixels) {
				// スクロールが完了したら、screenshotListをpopup.jsに送信する前にソートする
				screenshotList.sort((a, b) => a.scrollPosition - b.scrollPosition);
				// dataURLがundefinedの要素を削除する
				screenshotList = screenshotList.filter(item => item.dataURL !== undefined);
				console.log(screenshotList);
				chrome.runtime.sendMessage({ command: "screenshotList", data: screenshotList.map(item => item.dataURL), inputUrl: window.location.href }, function (response) {
					console.log(response);
				});

				return;
			}

			// スクロールする
			window.scrollTo(0, currentScrollPosition);

			// スクリーンショットを取得する
			const response = await new Promise(resolve => {
				chrome.runtime.sendMessage({ command: "capture", currentScrollPosition: currentScrollPosition }, function (response) {
					resolve(response);
				});
			});
			screenshotList.push({ scrollPosition: currentScrollPosition, dataURL: response.dataURL });

			// スクロール位置を更新する
			scrollPosition += screenHeight / 3;

			// 次のスクロールとスクリーンショットを実行する
			setTimeout(() => scrollAndCapture(scrollPosition), 500);
		}

		// スクロールとスクリーンショットの処理を開始する
		scrollAndCapture(scrollPosition);
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
