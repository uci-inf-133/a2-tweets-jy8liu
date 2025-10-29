function parseTweets(runkeeper_tweets) {
  // guard
  if (!runkeeper_tweets) {
    window.alert('No tweets returned');
    return;
  }

  // Build Tweet objects
  tweet_array = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at));

  // Completed tweets only (per spec)
  const completed = tweet_array.filter(t => t.source === 'completed_event');

  // Prep rows
  const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const rows = completed.map(t => ({
    type: t.activityType,                 // "run" | "walk" | "bike" | "other"
    distance: Number(t.distance || 0),    // miles (we already convert in Tweet.distance)
    date: t.time,
    dow: DOW[t.time.getDay()]
  }));

  // Distance-based rows (ignore time-only activities like yoga → distance=0)
  const distanceRows = rows.filter(r => r.distance > 0);

  //stats for the page
  //unique activity types among distance-based; exclude other
  const uniqueTypes = Array.from(new Set(distanceRows.map(r => r.type).filter(t => t !== 'other')));

  const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setTxt('numberActivities', String(uniqueTypes.length));

  //frequency by type (distance-based)
  const counts = distanceRows.reduce((m, r) => (m[r.type] = (m[r.type] || 0) + 1, m), {});
  const countData = Object.keys(counts).map(type => ({ type, count: counts[type] }));

  //top 3 types by frequency (skip 'other' if present)
  const top3 = Object.keys(counts)
    .filter(t => t !== 'other')
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, 3);

  setTxt('firstMost',  top3[0] || '—');
  setTxt('secondMost', top3[1] || '—');
  setTxt('thirdMost',  top3[2] || '—');

  //mean distance per activity among top3 (to answer longest/shortest)
  const topRows = distanceRows.filter(r => top3.includes(r.type));
  const means = top3.map(t => {
    const arr = topRows.filter(r => r.type === t);
    const sum = arr.reduce((a, b) => a + b.distance, 0);
    return { type: t, mean: arr.length ? sum / arr.length : 0 };
  }).sort((a, b) => b.mean - a.mean);

  const longestType  = means[0]?.type || '—';
  const shortestType = means[means.length - 1]?.type || '—';
  setTxt('longestActivityType', longestType);
  setTxt('shortestActivityType', shortestType);

  //weekday vs weekend for the longest activity type (average distance)
  const isWeekend = d => (d.getDay() === 0 || d.getDay() === 6);
  const lt = topRows.filter(r => r.type === longestType);
  const wk = lt.filter(r => !isWeekend(r.date));
  const we = lt.filter(r =>  isWeekend(r.date));
  const avg = arr => arr.length ? arr.reduce((a,b)=>a+b.distance,0)/arr.length : 0;
  setTxt('weekdayOrWeekendLonger', (avg(we) > avg(wk)) ? 'weekends' : 'weekdays');

  //chart 1 activity type counts
  const activity_vis_spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Number of completed, distance-based tweets per activity type',
    data: { values: countData },
    mark: 'bar',
    encoding: {
      x: { field: 'type', type: 'nominal', title: 'Activity Type', sort: '-y' },
      y: { field: 'count', type: 'quantitative', title: 'Tweets per Activity' },
      tooltip: [{ field: 'type', type: 'nominal' }, { field: 'count', type: 'quantitative' }]
    }
  };
  vegaEmbed('#activityVis', activity_vis_spec, { actions: false });

  // Build shared data for distance-by-day plots (top3 only)
  const distanceDataTop3 = topRows;

  //chart 2 distance by day
  const rawSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: distanceDataTop3 },
    mark: { type: 'point', opacity: 0.5 },
    encoding: {
      x: { field: 'dow', type: 'ordinal', sort: DOW, title: 'Day of Week' },
      y: { field: 'distance', type: 'quantitative', title: 'Distance (mi)' },
      color: { field: 'type', type: 'nominal', title: 'Activity' },
      tooltip: [
        { field: 'type', type: 'nominal' },
        { field: 'dow', type: 'ordinal' },
        { field: 'distance', type: 'quantitative', format: '.2f' }
      ]
    }
  };

  //chart 3 mean
  const aggSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: distanceDataTop3 },
    mark: { type: 'point' },
    encoding: {
      x: { field: 'dow', type: 'ordinal', sort: DOW, title: 'Day of Week' },
      y: { aggregate: 'mean', field: 'distance', type: 'quantitative', title: 'Mean Distance (mi)' },
      color: { field: 'type', type: 'nominal', title: 'Activity' },
      tooltip: [
        { field: 'type', type: 'nominal' },
        { field: 'dow', type: 'ordinal' },
        { aggregate: 'mean', field: 'distance', type: 'quantitative', format: '.2f', title: 'Mean Distance' }
      ]
    }
  };

  // Render both containers but show only one at a time (per HTML)
  const rawEl = document.getElementById('distanceVis');
  const aggEl = document.getElementById('distanceVisAggregated');

  if (rawEl) vegaEmbed('#distanceVis', rawSpec, { actions: false });
  if (aggEl) vegaEmbed('#distanceVisAggregated', aggSpec, { actions: false });

  // Initial visibility: show RAW, hide AGG
  if (rawEl) rawEl.style.display = '';
  if (aggEl) aggEl.style.display = 'none';

  // Toggle button
  const btn = document.getElementById('aggregate');
  if (btn && rawEl && aggEl) {
    const SHOW_MEANS = 'Show means';
    const SHOW_POINTS = 'Show points';
    btn.textContent = SHOW_MEANS; // initial label
    btn.addEventListener('click', () => {
      const showingRaw = rawEl.style.display !== 'none';
      if (showingRaw) {
        rawEl.style.display = 'none';
        aggEl.style.display = '';
        btn.textContent = SHOW_POINTS;
      } else {
        rawEl.style.display = '';
        aggEl.style.display = 'none';
        btn.textContent = SHOW_MEANS;
      }
    });
  }
}

// Wait for DOM
document.addEventListener('DOMContentLoaded', function () {
  loadSavedRunkeeperTweets().then(parseTweets);
});