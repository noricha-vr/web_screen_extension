chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.command === "start") {
		let scrollPosition = 0;
		let screenHeight = window.innerHeight;
		let totalHeight = document.documentElement.scrollHeight;
		let screenshotList = [];

		// 最大スクロールピクセル数を設定する
		const maxScrollPixels = request.maxHeight;
		console.log('maxScrollPixels', maxScrollPixels);

		async function scrollAndCapture(currentScrollPosition) {
			if (currentScrollPosition >= totalHeight || currentScrollPosition >= maxScrollPixels) {
				// スクロールが完了したら、screenshotListをpopup.jsに送信する前にソートする
				screenshotList.sort((a, b) => a.scrollPosition - b.scrollPosition);
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

			if (response.dataURL === undefined) {
				// dataURLがundefinedの場合、スクロール位置をmaxScrollPixelsに設定し、撮影を停止する
				scrollPosition = maxScrollPixels;
			} else {
				const resizedDataURL = await convertToHD(response.dataURL);
				screenshotList.push({ scrollPosition: currentScrollPosition, dataURL: resizedDataURL });
				// スクロール位置を更新する
				scrollPosition += screenHeight / 3;
			}

			// 次のスクロールとスクリーンショットを実行する
			setTimeout(() => scrollAndCapture(scrollPosition), 200);
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


async function convertToHD(dataURL) {
	return new Promise(function (resolve, reject) {
		let img = new Image();
		img.onload = function () {
			let canvas = document.createElement("canvas");
			let width = img.width;
			let height = img.height;
			let aspectRatio = width / height;
			if (width > 1280 || height > 720) {
				if (aspectRatio > 1) {
					width = 1280;
					height = width / aspectRatio;
				} else {
					height = 720;
					width = height * aspectRatio;
				}
			}
			canvas.width = width;
			canvas.height = height;
			let ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0, width, height);
			resolve(canvas.toDataURL("image/png"));
		};
		img.src = dataURL;
	});
}
