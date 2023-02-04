async function fetchMovieURL() {
	const url = window.location.href;
	alert(url);
	const input_data = {
		url: url,
		lang: 'ja-JP',
		page_height: '5000',
		wait_time: 1
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
	let url = await fetchMovieURL();
	console.log('url: ' + url);
}

main();
