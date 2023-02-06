async function copyToClipboard(text) {
	try {
		await navigator.clipboard.writeText(text);
		alert('Copied to clipboard!');
	} catch (err) {
		console.error('Failed to copy text: ', err);
	}
}

async function fetchMovieURL() {
	const url = window.location.href;
	const input_data = {
		url: url,
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

async () => {
	let url = await fetchMovieURL();
	console.log('url: ' + url);
	await copyToClipboard(url);
}
