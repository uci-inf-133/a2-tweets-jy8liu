function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	//TODO: Filter to just the written tweets
	// Keep original index for a stable "tweet number"
	window.__writtenRunningTweets__ = runkeeper_tweets
		.map((tw, idx) => ({ t: new Tweet(tw.text, tw.created_at), idx }))
		.filter(({ t }) => t.activityType === 'run' && t.written === true);
}

function addEventHandlerForSearch() {
	//TODO: Search the written tweets as text is entered into the search box, and add them to the table
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
		const base = window.__writtenRunningTweets__ || [];
		const q = (input.value || '').trim();
		setTxt('searchText', q);
		tbody.innerHTML = '';

		if (q === '') {
			setTxt('searchCount', '0');
			return; // clear table on empty query
		}

		const qLower = q.toLowerCase();
		const matches = base.filter(({ t }) => (t.writtenText || '').toLowerCase().includes(qLower));

		setTxt('searchCount', String(matches.length));
		tbody.innerHTML = matches.map(({ t, idx }) => buildRow(idx + 1, t)).join('');
	};

	// Update after every character
	input.addEventListener('input', render);

	// Initial clear
	render();
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	addEventHandlerForSearch();
	loadSavedRunkeeperTweets().then(parseTweets);
});
