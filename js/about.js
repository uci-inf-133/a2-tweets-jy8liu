function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}
	// Build an array of Tweet objects from the tweet data
	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});
	
	// helper functions
	const $id = (id) => document.getElementById(id);
	const $setAll = (cls, text) =>
    document.querySelectorAll(`.${cls}`).forEach(el => el.textContent = text);

	const fmtDate = (d) =>
    d.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });

	// total number of tweets
	$id('numberTweets').textContent = String(tweet_array.length);

	// earliest and latest tweet dates
	const times = tweet_array.map(t => t.time.getTime());
	const firstDate = new Date(Math.min(...times));
	const lastDate  = new Date(Math.max(...times));
	$id('firstDate').textContent = fmtDate(firstDate);
	$id('lastDate').textContent  = fmtDate(lastDate);

	// --- counts by category ---
	const counts = { completed_event: 0, live_event: 0, achievement: 0, misc: 0 };
	tweet_array.forEach(t => counts[t.source] = (counts[t.source] || 0) + 1);

	// write raw counts (classes may appear multiple times in HTML)
	$setAll('completedEvents', counts.completed_event);
	$setAll('liveEvents', counts.live_event);
	$setAll('achievements', counts.achievement);
	$setAll('miscellaneous', counts.misc);

	// --- percentages by category (of ALL tweets) ---
	const total = tweet_array.length || 1; // guard
	const pct = (num, den = total) =>
		math.format((num / (den || 1)) * 100, { notation: 'fixed', precision: 2 }) + '%';

	$setAll('completedEventsPct',  pct(counts.completed_event));
	$setAll('liveEventsPct',       pct(counts.live_event));
	$setAll('achievementsPct',     pct(counts.achievement));
	$setAll('miscellaneousPct',    pct(counts.misc));

	// --- user-written among completed events ---
	const completed = tweet_array.filter(t => t.source === 'completed_event');
	const writtenCompleted = completed.filter(t => t.written);
	$setAll('written', String(writtenCompleted.length));
	$setAll('writtenPct', pct(writtenCompleted.length, completed.length));	
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});