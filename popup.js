const progressBar = document.getElementById("progress-bar");
const progressArea = document.getElementById("progress-area");
const successArea = document.getElementById("success-area");
const screenshotMessage = document.getElementById("screenshot-message");
const inputText = document.getElementById('movie-url');
const copyButton = document.getElementById('copy-button');
const historyArea = document.getElementById("history-area");
const convertButton = document.getElementById("convert-button");
const autoCopyCheckbox = document.getElementById("auto-copy");

let historyList = [];
let progressValue = 0;
let interval = null;
let autoCopy = false;

autoCopyCheckbox.addEventListener("change", handleAutoCopyCheckboxChange);

chrome.storage.local.get(["historyList", "autoCopy"], loadSettings);

convertButton.addEventListener("click", handleConvertButtonClick);

copyButton.addEventListener('click', handleCopyButtonClick);

chrome.runtime.onMessage.addListener(handleRuntimeMessage);

function handleAutoCopyCheckboxChange() {
	autoCopy = autoCopyCheckbox.checked;
	chrome.storage.local.set({ autoCopy: autoCopy });
	console.log('Save autoCopy', autoCopy);
}

function loadSettings(result) {
	if (result.historyList) {
		historyList = result.historyList;
		historyList.forEach((item) => {
			addHistoryItem(item.inputUrl, item.movieUrl);
		});
	} else {
		historyList = [];
	}
	if (result.autoCopy) {
		autoCopy = result.autoCopy;
		autoCopyCheckbox.checked = result.autoCopy;
	}
}

function handleConvertButtonClick() {
	screenshotMessage.style.display = '';
	successArea.style.display = 'none';
	convertButton.style.display = 'none';
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, { command: "start" });
	});
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
		addHistoryItem(request.inputUrl, movieUrl);
		handleAutoCopy();
		saveHistoryItem(request.inputUrl, movieUrl);
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

function saveHistoryItem(inputUrl, movieUrl) {
	let historyItem = {
		inputUrl: inputUrl,
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

function addHistoryItem(inputUrl, movieUrl) {
	const itemDiv = createHistoryItemDiv(inputUrl, movieUrl);
	historyArea.insertBefore(itemDiv, historyArea.firstChild); // 最初の子要素の前に新しい要素を挿入する
}

function createHistoryItemDiv(inputUrl, movieUrl) {
	const itemDiv = document.createElement("div");
	itemDiv.classList.add("mb-1");

	itemDiv.appendChild(createCopyButton(movieUrl));
	itemDiv.appendChild(createDownloadButton(inputUrl, movieUrl));
	itemDiv.appendChild(createLink(inputUrl, movieUrl));
	itemDiv.appendChild(createDeleteButton());

	return itemDiv;
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

function createDownloadButton(inputUrl, movieUrl) {
	const downloadButton = document.createElement("a");
	downloadButton.textContent = "DL";
	downloadButton.classList = "btn btn-outline-secondary btn-sm me-2";
	downloadButton.addEventListener("click", () => {
		event.preventDefault();
		chrome.runtime.sendMessage(
			{ movieUrl: movieUrl, domain: inputUrl.split('/')[2] },
			function (response) {
				console.log(response);
			}
		);
	});
	return downloadButton;
}

function createLink(inputUrl, movieUrl) {
	const link = document.createElement("a");
	link.textContent = inputUrl.split('/')[2];
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
