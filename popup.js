const progressBar = document.getElementById("progress-bar");
const progressArea = document.getElementById("progress-area");
const successArea = document.getElementById("success-area");
const inputText = document.getElementById('movie_url')
const copyButton = document.getElementById('copy-button');
const historyArea = document.getElementById("history-area");
const convertButton = document.getElementById("convert-button");
const autoCopyCheckbox = document.getElementById("autoCopy");
let historyList = [];
let progressValue = 0;

async function getUrl() {
	let queryOptions = { active: true, currentWindow: true };
	let tabs = await chrome.tabs.query(queryOptions);
	if (tabs[0] === undefined) {
		return "";
	}
	if (tabs[0].url) return tabs[0].url;
	return "";
}

function updateProgress() {
	if (progressValue >= 100) {
		progressValue = 0;
	}
	progressValue += 1;
	progressBar.value = progressValue;
}

async function fetchMovieURL(post_url) {
	const API_URL = 'https://web-screen.net/api/url-to-movie/';
	const input_data = {
		url: post_url,
		lang: window.navigator.language,
		page_height: '20000',
		wait_time: 5
	};
	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(input_data)
	};
	try {
		let response = await fetch(API_URL, options);
		let output_data = await response.json();
		console.log(output_data);
		return output_data['url'];
	} catch (err) {
		return 'Convert failed.'
	}
}


convertButton.addEventListener("click", convertToMovie);

async function convertToMovie() {
	progressArea.style.display = '';
	successArea.style.display = 'none';
	convertButton.style.display = 'none';
	let interval = setInterval(updateProgress, 150);

	let inputUrl = await getUrl();
	let movieUrl = await fetchMovieURL(inputUrl);
	inputText.value = movieUrl;
	// copy input text value to clipboard
	clearInterval(interval);
	progressBar.value = 0;
	progressArea.style.display = 'none';
	successArea.style.display = '';
	convertButton.style.display = '';
	inputText.value = movieUrl;
	addHistoryItem(inputUrl, movieUrl);
	if (autoCopyCheckbox.checked) {
		navigator.clipboard.writeText(movieUrl);
	}
	let historyItem = {
		inputUrl: inputUrl,
		movieUrl: movieUrl,
		createdDate: new Date()
	};
	historyList.push(historyItem);
	chrome.storage.local.set({ "historyList": historyList });
}

copyButton.addEventListener('click', () => {
	navigator.clipboard.writeText(inputText.value);
});

function addHistoryItem(inputUrl, movieUrl) {
	const itemDiv = document.createElement("div");
	itemDiv.classList.add("history-item");

	const copyButton = document.createElement("button");
	copyButton.textContent = "Copy";
	copyButton.addEventListener("click", () => {
		navigator.clipboard.writeText(movieUrl);
	});
	itemDiv.appendChild(copyButton);

	const downloadButton = document.createElement("a");
	downloadButton.textContent = "DL";
	downloadButton.href = movieUrl;
	downloadButton.download = inputUrl.split('/')[2] + ".mp4";
	downloadButton.classList = "btn btn-primary";
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
	itemDiv.appendChild(link);

	const deleteButton = document.createElement("button");
	deleteButton.textContent = "Delete";
	deleteButton.addEventListener("click", () => {
		itemDiv.remove();
	});
	itemDiv.appendChild(deleteButton);

	historyArea.appendChild(itemDiv);
}


window.onload = async () => {
	chrome.storage.local.get("historyList", function (result) {
		if (result.historyList) {
			historyList = result.historyList;
			historyList.forEach((item) => {
				addHistoryItem(item.inputUrl, item.movieUrl);
			});
		} else {
			historyList = [];
		}
	});
}

