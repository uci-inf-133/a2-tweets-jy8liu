function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	// Filter to all user-written tweets (any activity)
	window.__writtenTweets__ = runkeeper_tweets
		.map((tw, idx) => ({ t: new Tweet(tw.text, tw.created_at), idx }))
		.filter(({ t }) => t.written === true);
}

function addEventHandlerForSearch() {
	const input = document.getElementById('textFilter');
	const tbody = document.getElementById('tweetTable');
	const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

	if (!input || !tbody) return;

	const buildRow = (index1, tweet) => {
		const match = (tweet.text || '').match(/https?:\/\/\S+/i);
		const url = match ? match[0] : '#';
		const activity = tweet.activityType || 'other';
		const note = (tweet.writtenText || '').trim();
		const preview = note || (tweet.text || '').replace(/\s*#RunKeeper\b/i, '');
		return `
			<tr>
				<td>${index1}</td>
				<td>${activity}</td>
				<td><a href="${url}" target="_blank" rel="noopener">Open</a>${preview ? ` — ${preview}` : ''}</td>
			</tr>
		`.trim();
	};

	const render = () => {
		const base = window.__writtenTweets__ || [];
		const q = (input.value || '').trim();
		setTxt('searchText', q);
		tbody.innerHTML = '';

		if (q === '') {
			setTxt('searchCount', '0');
			return; // clear table on empty query
		}

		const qLower = q.toLowerCase();
		const matches = base.filter(({ t }) =>
			(t.writtenText || '').toLowerCase().includes(qLower)
		);

		setTxt('searchCount', String(matches.length));
		tbody.innerHTML = matches.map(({ t, idx }) => buildRow(idx + 1, t)).join('');
	};

	// Update after every character typed
	input.addEventListener('input', render);

	// Initial clear
	render();
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	addEventHandlerForSearch();
	loadSavedRunkeeperTweets().then(parseTweets);
});
