class Tweet {
	private text:string;
	time:Date;

	constructor(tweet_text:string, tweet_time:string) {
        this.text = tweet_text;
		this.time = new Date(tweet_time);//, "ddd MMM D HH:mm:ss Z YYYY"
	}

	//returns either 'live_event', 'achievement', 'completed_event', or 'miscellaneous'
    get source():string {
        const t = this.text || "";

        // Completed: common RK phrasing + obvious past-tense activity verbs
        if (
            /^Just completed\b/i.test(t) ||
            /\bcompleted a\b/i.test(t) ||
            /\b(walked|ran|jogged|biked|rode)\b/i.test(t)
        ) {
            return 'completed_event';
        }

        // Live
        if (
            /^Just posted\b/i.test(t) ||
            (/\blive\b/i.test(t) && /\b(run|walk|bike|ride|cycling)\b/i.test(t))
        ) {
            return 'live_event';
        }

        // Achievements
        if (
            /\bpersonal record\b/i.test(t) ||
            /\bPR\b/i.test(t) ||
            /\bset a goal\b/i.test(t) ||
            /\bgoal\b/i.test(t) ||
            /\bmarathon\b/i.test(t) ||
            /\btriathlon\b/i.test(t) ||
            /\brace\b/i.test(t) ||
            /\btrain\b/i.test(t)
        ) {
            return 'achievement';
        }

        return 'miscellaneous';
    }

    //returns a boolean, whether the text includes any content written by the person tweeting.
    get written():boolean {
        // strip trailing URL and the #RunKeeper tag
        const text = (this.text || "")
            .replace(/\s*https?:\/\/\S+\s*$/i, '')
            .replace(/\s*#RunKeeper\b/i, '')
            .trim();

        if (!text) return false;

        // user note after an em-dash/hyphen?
        const parts = text.split(/\s[—-]\s/);
        if (parts.length > 1 && parts[1].trim().length > 0) return true;

        // stock app phrases → not written
        if (
            /^Just completed\b/i.test(text) ||
            /^Just posted\b/i.test(text) ||
            /\bpersonal record\b/i.test(text) ||
            /\bset a goal\b/i.test(text)
        ) {
            return false;
        }

        return true;
    }

    get writtenText():string {
        if(!this.written) {
            return "";
        }
        // clean and then take text after em-dash/hyphen if present
        const cleaned = (this.text || "")
            .replace(/\s*https?:\/\/\S+\s*$/i, "")
            .replace(/\s*#RunKeeper\b/i, "")
            .trim();

        const parts = cleaned.split(/\s[—-]\s/);
        if (parts.length > 1) {
            return parts[parts.length - 1].trim();
        }
        return cleaned;
    }

    get activityType():string {
        if (this.source !== 'completed_event') {
            return "other";
        }
        const t = (this.text || "").toLowerCase();

        if (/\bwalk(ing)?\b/.test(t)) return "walking";
        if (/\b(run|running|jog|jogging)\b/.test(t)) return "running";
        if (/\b(bike|biking|cycling|ride|rode)\b/.test(t)) return "biking";
        return "other";
    }

    get distance():number {
        if(this.source != 'completed_event') {
            return 0;
        }
        // first "<number> km/mi/mile/kilometer"
        const t = this.text || "";
        const match = t.match(/(\d+(?:\.\d+)?)\s*(km|kilometers?|mi|miles?)/i);
        if (!match) return 0;

        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();

        // normalize to miles
        return (unit.startsWith('km') || unit.startsWith('kilometer'))
            ? value * 0.621371
            : value;
    }

    getHTMLTableRow(rowNumber:number):string {
        // table summary with clickable link to the RunKeeper activity
        const urlMatch = (this.text || "").match(/https?:\/\/\S+/i);
        const url = urlMatch ? urlMatch[0] : '#';

        const when = this.time.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });

        const dist = this.distance ? `${this.distance.toFixed(2)} mi` : '';
        const src = this.source;

        return `
<tr data-row="${rowNumber}">
  <td>${when}</td>
  <td>${src}</td>
  <td>${this.activityType}</td>
  <td>${dist}</td>
  <td><a href="${url}" target="_blank" rel="noopener">View</a></td>
</tr>`.trim();
    }
}
