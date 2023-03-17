const progressBar = document.getElementById("progress-bar");
const progressArea = document.getElementById("progress-area");
const successArea = document.getElementById("success-area");
const screenshotMessage = document.getElementById("screenshot-message");
const inputText = document.getElementById('movie-url');
const copyButton = document.getElementById('copy-button');
const historyArea = document.getElementById("history-area");
const convertButton = document.getElementById("convert-button");
const autoCopyCheckbox = document.getElementById("auto-copy");
const maxHeight = document.getElementById("max-height");
const maxHeightLabel = document.getElementById("max-height-label");

let historyList = [];
let progressValue = 0;
let interval = null;
let autoCopy = false;

autoCopyCheckbox.addEventListener("input", handleAutoCopyCheckboxChange);

maxHeight.addEventListener("input", handleMaxHeightChange);

chrome.storage.local.get(["historyList", "autoCopy"], loadSettings);

convertButton.addEventListener("click", handleConvertButtonClick);

copyButton.addEventListener('click', handleCopyButtonClick);

chrome.runtime.onMessage.addListener(handleRuntimeMessage);



function handleAutoCopyCheckboxChange() {
	autoCopy = autoCopyCheckbox.checked;
	chrome.storage.local.set({ autoCopy: autoCopy });
	console.log('Save autoCopy', autoCopy);
}

function handleMaxHeightChange() {
	maxHeightLabel.textContent = maxHeight.value;
	chrome.storage.local.set({ maxHeight: maxHeight.value });
	console.log('Save maxHeight', maxHeight.value);
}

function loadSettings(result) {
	if (result.historyList) {
		historyList = result.historyList;
		historyList.forEach((item) => {
			addHistoryItem(item.title, item.movieUrl);
		});
	} else {
		historyList = [];
	}
	if (result.autoCopy) {
		autoCopy = result.autoCopy;
		autoCopyCheckbox.checked = result.autoCopy;
	}
}


function sendMessageWithRetry(retryCount) {
	if (retryCount >= 5) {
		alert("メッセージの送信に失敗しました。ページをリロードしてもう一度お試しください。\n問題が解決しない場合は、拡張機能を再インストールしてください。");
		return;
	}

	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, { command: "start", maxHeight: Number(maxHeight.value) }, function (response) {
			if (chrome.runtime.lastError) {
				// エラーが発生した場合、1秒後にリトライする
				setTimeout(() => {
					sendMessageWithRetry(retryCount + 1);
				}, 1000);
			} else {
				// メッセージ送信成功時の処理
				console.log("Message sent successfully!");
			}
		});
	});
}

function handleConvertButtonClick() {
	screenshotMessage.style.display = '';
	successArea.style.display = 'none';
	convertButton.style.display = 'none';
	sendMessageWithRetry(0);
}


function updateProgress() {
	if (progressValue >= 100) {
		progressValue = 0;
	}
	progressValue += 1;
	progressBar.value = progressValue;
}

async function handleRuntimeMessage(request, sender, sendResponse) {
	if (request.command === "screenshotList") {
		// Show and start progress bar
		progressArea.style.display = '';
		setInterval(updateProgress, 150);
		screenshotMessage.style.display = 'none';

		let screenshotList = request.data;
		console.log(screenshotList);

		let movieUrl = await postScreenshotsToServer(screenshotList);
		console.log('movieURL', movieUrl);
		clearInterval(interval);
		progressBar.value = 0;
		progressArea.style.display = 'none';
		successArea.style.display = '';
		inputText.value = movieUrl;
		addHistoryItem(request.title, movieUrl);
		handleAutoCopy();
		saveHistoryItem(request.title, movieUrl);
		sendResponse({ message: "screenshotList received" });
	}
}

async function convertScreenshotListToHD(screenshotList) {
	let hdScreenshotList = [];

	for (let i = 0; i < screenshotList.length; i++) {
		let hdDataURL = await convertToHD(screenshotList[i]);
		hdScreenshotList.push(hdDataURL);
	}

	return hdScreenshotList;
}

function handleAutoCopy() {
	if (autoCopy) {
		inputText.select();
		document.execCommand("copy");
		copyButton.textContent = "Copied!";
		setTimeout(() => {
			copyButton.textContent = "Copy";
		}, 10000);
	}
}

function saveHistoryItem(title, movieUrl) {
	let historyItem = {
		title: title,
		movieUrl: movieUrl,
		createdDate: new Date()
	};
	historyList.push(historyItem);
	chrome.storage.local.set({ "historyList": historyList }, function () {
		if (chrome.runtime.lastError) {
			console.error("Error while saving historyList:", chrome.runtime.lastError);
		}
	});
}

function handleCopyButtonClick() {
	navigator.clipboard.writeText(inputText.value).then(() => {
		copyButton.textContent = "Copied!";
		setTimeout(() => {
			copyButton.textContent = "Copy";
		}, 10000);
	});
}

function addHistoryItem(title, movieUrl) {
	const itemDiv = createHistoryItemDiv(title, movieUrl);
	historyArea.insertBefore(itemDiv, historyArea.firstChild); // 最初の子要素の前に新しい要素を挿入する
}

function createHistoryItemDiv(title, movieUrl) {
	const itemDiv = document.createElement("div");
	itemDiv.classList.add("mb-1");

	itemDiv.appendChild(createCopyButton(movieUrl));
	itemDiv.appendChild(createDownloadButton(title, movieUrl));
	itemDiv.appendChild(createLink(truncateByLength(title, 20), movieUrl));
	itemDiv.appendChild(createDeleteButton());

	return itemDiv;
}

function countLength(str) {
	let count = 0;
	for (let i = 0; i < str.length; i++) {
		const code = str.charCodeAt(i);
		count += (code >= 0x0020 && code <= 0x007e) || (code >= 0xff61 && code <= 0xff9f) ? 1 : 2;
	}
	return count;
}

function truncateByLength(str, maxLength) {
	let result = '';
	let count = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str[i];
		const charLength = countLength(char);
		if (count + charLength > maxLength) {
			break;
		}
		result += char;
		count += charLength;
	}
	return result;
}

function createCopyButton(movieUrl) {
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
	return copyButton;
}

function createDownloadButton(title, movieUrl) {
	const downloadButton = document.createElement("a");
	downloadButton.textContent = "DL";
	downloadButton.classList = "btn btn-outline-secondary btn-sm me-2";
	downloadButton.addEventListener("click", () => {
		event.preventDefault();
		chrome.runtime.sendMessage(
			{ movieUrl: movieUrl, title: title },
			function (response) {
				console.log(response);
			}
		);
	});
	return downloadButton;
}

function createLink(title, movieUrl) {
	const link = document.createElement("a");
	link.textContent = title + "...";
	link.href = movieUrl;
	link.target = "_blank";
	link.classList = "me-2";
	return link;
}

function createDeleteButton() {
	const deleteButton = document.createElement("button");
	deleteButton.textContent = "x";
	deleteButton.id = "delete-button";
	deleteButton.addEventListener("click", (event) => {
		event.target.parentNode.remove();
	});
	return deleteButton;
}

async function postScreenshotsToServer(screenshotList) {
	const API_URL = 'https://web-screen.net/api/image-to-movie/';
	let formData = new FormData();
	for (let i = 0; i < screenshotList.length; i++) {
		let blobData = dataURItoBlob(screenshotList[i]);
		let zeroFilledIndex = String(i).padStart(3, '0');
		formData.append('images', blobData, `screenshot_${zeroFilledIndex}.png`);
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
