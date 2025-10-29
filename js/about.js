function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}
	
	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});

	// --- helper to set all spans of a class name ---
	function setAll(className, val) {
		document.querySelectorAll('.' + className).forEach(e => e.textContent = val);
	}

	// total tweets
	document.getElementById('numberTweets').textContent = tweet_array.length.toString();

	// find earliest and latest tweets
	let first = tweet_array[0].time, last = tweet_array[0].time;
	for (let t of tweet_array) {
		if (t.time < first) first = t.time;
		if (t.time > last) last = t.time;
	}
	document.getElementById('firstDate').textContent = first.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
	document.getElementById('lastDate').textContent = last.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

	// --- categorize ---
	const counts = { completed_event: 0, live_event: 0, achievement: 0, miscellaneous: 0 };
	for (let t of tweet_array) {
		if (t.source && counts.hasOwnProperty(t.source)) {
			counts[t.source]++;
		}
	}

	function pct(n) {
		return ((n / tweet_array.length) * 100).toFixed(2) + '%';
	}

	// update counts + percents
	setAll('completedEvents', counts.completed_event);
	setAll('completedEventsPct', pct(counts.completed_event));
	setAll('liveEvents', counts.live_event);
	setAll('liveEventsPct', pct(counts.live_event));
	setAll('achievements', counts.achievement);
	setAll('achievementsPct', pct(counts.achievement));
	setAll('miscellaneous', counts.miscellaneous);
	setAll('miscellaneousPct', pct(counts.miscellaneous));

	// --- user-written completed tweets ---
	const completed = tweet_array.filter(t => t.source === 'completed_event');
	const written = completed.filter(t => t.written);
	setAll('written', written.length);
	setAll('writtenPct', ((written.length / completed.length) * 100).toFixed(2) + '%');
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});
