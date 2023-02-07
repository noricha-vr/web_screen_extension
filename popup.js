const progressBar = document.getElementById("progress-bar");
const progressArea = document.getElementById("progress-area");
const successArea = document.getElementById("success-area");
const inputText = document.getElementById('movie_url')
const copyButton = document.getElementById('copy-button');
let progressValue = 0;

const dbName = "WebScreen";
const storeName = "historyStore";

function insertToHistory(input_url, movie_url) {
	let currentTime = new Date().toString();
	let history = {
		input_url: input_url,
		timestamp: currentTime,
		movie_url: movie_url
	};

	let request = window.indexedDB.open(dbName, 1);
	request.onsuccess = function (event) {
		let db = event.target.result;
		let tx = db.transaction(storeName, "readwrite");
		let store = tx.objectStore(storeName);
		store.put(history);
		store.onsuccess = function (event) {
			console.log("History saved successfully!");
		};
		store.onerror = function (event) {
			// Handle constraint error
			if (event.target.error.name === "ConstraintError") {
				console.log("Deleting existing history for input_url: ", input_url);
				store.delete(input_url);
				store.put(history);
			} else {
				console.error("Error saving history: ", event.target.error);
			}
		};
		tx.oncomplete = function () {
			console.log("Transaction complete.");
		};
		tx.onerror = function (event) {
			console.error("Transaction error: ", event.target.error);
		};
	};
	request.onupgradeneeded = function (event) {
		let db = event.target.result;
		db.createObjectStore(storeName, { keyPath: "input_url", autoIncrement: true });
	};
	request.onerror = function (event) {
		console.error("Error opening database: ", event.target.error);
	};
}


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

function clickCopy() {
	inputText.select();
	inputText.setSelectionRange(0, 99999);
	document.execCommand("copy");
}
copyButton.addEventListener('click', clickCopy);

async function main() {
	successArea.style.display = 'none';
	progressArea.style.display = '';
	let interval = setInterval(updateProgress, 150);
	let input_url = await getUrl();
	let movie_url = await fetchMovieURL(input_url);
	inputText.value = movie_url;
	// copy input text value to clipboard
	clearInterval(interval);
	progressBar.value = 0;
	progressArea.style.display = 'none';
	successArea.style.display = '';
	clickCopy();
	insertToHistory(input_url, movie_url);
}
main();

