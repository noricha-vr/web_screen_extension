const progressBar = document.getElementById("progress-bar");
const progressArea = document.getElementById("progress-area");
const successArea = document.getElementById("success-area");
const inputText = document.getElementById('movie_url')
const copyButton = document.getElementById('copy-button');
let progressValue = 0;
import { insertHistory, getHistories } from './historyHandler.js';


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

function clickCopy(text_element) {
	text_element.select();
	text_element.setSelectionRange(0, 99999);
	document.execCommand("copy");
}
copyButton.addEventListener('click', () => { clickCopy(inputText) });

async function main() {
	console.log(getHistories());
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
	clickCopy(inputText);
	insertHistory(input_url, movie_url, 7);
}
main();

