async function getUrl() {
	let queryOptions = { active: true, currentWindow: true };
	let tabs = await chrome.tabs.query(queryOptions);
	if (tabs[0] === undefined) {
		return "";
	}
	if (tabs[0].url) return tabs[0].url;
	return "";
}

function updateProgress(value) {
	document.getElementById("progressbar").value = value;
}

async function fetchMovieURL(post_url) {
	const url = window.location.href;
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
	let response = await fetch('https://web-screen.net/api/url-to-movie/', options);
	let output_data = await response.json();
	console.log(output_data);
	return output_data['url'];
}

async function main() {
	// let value = 100;
	// updateProgress(value);
	let input_url = await getUrl();
	// let movie_url = await fetchMovieURL(input_url);
	let movie_url = input_url;
	let input_text = document.getElementById('movie_url')
	input_text.value = movie_url;
	// copy input text value to clipboard
	input_text.select();
	input_text.setSelectionRange(0, 99999);
	document.execCommand("copy");
}
main();
