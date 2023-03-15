const progressBar = document.getElementById("progress-bar");
const progressArea = document.getElementById("progress-area");
const successArea = document.getElementById("success-area");
const inputText = document.getElementById('movie-url')
const copyButton = document.getElementById('copy-button');
const historyArea = document.getElementById("history-area");
const convertButton = document.getElementById("convert-button");
const autoCopyCheckbox = document.getElementById("auto-copy");
let historyList = [];
let progressValue = 0;
let interval = null;

autoCopyCheckbox.addEventListener("change", function () {
	if (autoCopyCheckbox.checked) {
		chrome.storage.local.set({ autoCopy: true });
	} else {
		chrome.storage.local.set({ autoCopy: false });
	}
});

// Load history list and set auto copy checkbox.
chrome.storage.local.get(["historyList", "autoCopy"], function (result) {
	if (result.historyList) {
		historyList = result.historyList;
		historyList.forEach((item) => {
			addHistoryItem(item.inputUrl, item.movieUrl);
		});
	} else {
		historyList = [];
	}
	if (result.autoCopy) {
		autoCopyCheckbox.checked = result.autoCopy;
	}
});


function updateProgress() {
	if (progressValue >= 100) {
		progressValue = 0;
	}
	progressValue += 1;
	progressBar.value = progressValue;
}

convertButton.addEventListener("click", function () {
	progressArea.style.display = '';
	successArea.style.display = 'none';
	convertButton.style.display = 'none';
	setInterval(updateProgress, 150);
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, { command: "start" });
	});
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

export function dataURItoBlob(dataURI) {
	let byteString = atob(dataURI.split(",")[1]);
	let mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
	let ab = new ArrayBuffer(byteString.length);
	let ia = new Uint8Array(ab);
	for (let i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}
	return new Blob([ab], { type: mimeString });
}


copyButton.addEventListener('click', () => {

	navigator.clipboard.writeText(inputText.value).then(() => {
		copyButton.textContent = "Copied!";
		setTimeout(() => {
			copyButton.textContent = "Copy";
		}, 10000);
	});
});

function addHistoryItem(inputUrl, movieUrl) {
	const itemDiv = document.createElement("div");
	itemDiv.classList.add("mb-1");

	const copyButton = document.createElement("button");
	copyButton.textContent = "Copy";
	copyButton.classList = "btn btn-outline-primary btn-sm me-1";
	copyButton.addEventListener("click", () => {
		navigator.clipboard.writeText(movieUrl).then(() => {
			copyButton.textContent = "Copied!";
			setTimeout(() => {
				copyButton.textContent = "Copy";
			}, 10000);
		});
	});
	itemDiv.appendChild(copyButton);

	const downloadButton = document.createElement("a");
	downloadButton.textContent = "DL";
	downloadButton.href = movieUrl;
	downloadButton.download = inputUrl.split('/')[2] + ".mp4";
	downloadButton.classList = "btn btn-outline-secondary btn-sm me-2";
	downloadButton.addEventListener("click", () => {
		chrome.runtime.sendMessage(
			{ movieUrl: movieUrl, domain: inputUrl.split('/')[2] },
			function (response) {
				console.log(response);
			}
		);
	})

	itemDiv.appendChild(downloadButton);


	const link = document.createElement("a");
	link.textContent = inputUrl.split('/')[2];
	link.href = movieUrl;
	link.target = "_blank";
	link.classList = "me-2";
	itemDiv.appendChild(link);

	const deleteButton = document.createElement("button");
	deleteButton.textContent = "x";
	deleteButton.id = "delete-button";
	deleteButton.addEventListener("click", () => {
		itemDiv.remove();
	});
	itemDiv.appendChild(deleteButton);
	historyArea.insertBefore(itemDiv, historyArea.firstChild); // 最初の子要素の前に新しい要素を挿入する
}

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
	if (request.command === "screenshotList") {
		let screenshotList = request.data;
		console.log(screenshotList);

		let hdScreenshotList = [];

		for (let i = 0; i < screenshotList.length; i++) {
			let hdDataURL = await convertToHD(screenshotList[i]);
			hdScreenshotList.push(hdDataURL);
		}

		let movieUrl = await postScreenshotsToServer(hdScreenshotList);
		console.log('movieURL', movieUrl);
		clearInterval(interval);
		progressBar.value = 0;
		progressArea.style.display = 'none';
		successArea.style.display = '';
		inputText.value = movieUrl;
		addHistoryItem(request.inputUrl, movieUrl);
		if (autoCopyCheckbox.checked) {
			chrome.runtime.sendMessage({ type: "copyToClipboard", text: movieUrl });
		}
		let historyItem = {
			inputUrl: request.inputUrl,
			movieUrl: movieUrl,
			createdDate: new Date()
		};
		historyList.push(historyItem);
		chrome.storage.local.set({ "historyList": historyList }, function () {
			if (chrome.runtime.lastError) {
				console.error("Error while saving historyList:", chrome.runtime.lastError);
			}
		});
		sendResponse({ message: "screenshotList received" });
	}
});

async function postScreenshotsToServer(screenshotList) {
	const API_URL = 'https://web-screen.net/api/image-to-movie/';
	let formData = new FormData();
	for (let i = 0; i < screenshotList.length; i++) {
		let blobData = dataURItoBlob(screenshotList[i]);
		formData.append('images', blobData, `screenshot_${i}.png`);
	}
	try {
		let response = await fetch(API_URL, {
			method: "POST",
			body: formData,
		});

		let result = await response.json();
		return result.url;
	} catch (error) {
		console.log(error);
		alert('Error: Please try again.', error);
	}
	return 'Convert failed.';
}


