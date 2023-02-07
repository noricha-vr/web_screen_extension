import { clickCopy } from "./utils.js";

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

export function showHistory(historyList) {
	const historyArea = document.getElementById("history-area");
	console.log("history length:" + historyList.length);
	historyList.forEach(history => {
		let historyItem = document.createElement("div");
		historyItem.classList.add("history-item");
		// input_urlのはじめの20文字を表示したリンクを作成
		let linkText = document.createElement("a");
		linkText.href = history.output_url;
		linkText.innerText = history.input_url.substring(0, 35) + "...";
		linkText.classList.add("history-link");
		linkText.target = "_blank";
		// Copy button を作成
		let copyButton = document.createElement("button");
		copyButton.classList.add("history-copy-button");
		copyButton.innerText = "Copy";
		copyButton.addEventListener("click", () => {
			clickCopy(linkText)
		});
		// 要素を追加
		historyItem.appendChild(copyButton);
		historyItem.appendChild(linkText);
		historyArea.appendChild(historyItem);
	});
}
