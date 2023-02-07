export function insertHistory(input_url, output_url, expire_days) {
	let date = new Date();
	date.setTime(date.getTime() + expire_days * 24 * 60 * 60 * 1000);
	let expires = date.toUTCString();
	let data = input_url + "," + output_url + "," + expires;
	document.cookie = "history=" + data + ";expires=" + expires + ";path=/";
}


export function getHistories() {
	let historyList = [];
	let decodedCookie = decodeURIComponent(document.cookie);
	let cookies = decodedCookie.split(";");
	for (let i = 0; i < cookies.length; i++) {
		let cookie = cookies[i];
		while (cookie.charAt(0) == " ") {
			cookie = cookie.substring(1);
		}
		if (cookie.indexOf("history=") == 0) {
			let data = cookie.substring("history=".length, cookie.length);
			let elements = data.split(",");
			historyList.push({
				input_url: elements[0],
				output_url: elements[1],
				expires: elements[2],
			});
		}
	}
	historyList.sort(function (a, b) {
		return new Date(b.expires) - new Date(a.expires);
	});
	return historyList;
}
