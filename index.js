require('dotenv').config();
const fetch = require("node-fetch");
const eaw = require('eastasianwidth');
const fs = require("fs");

const API_BASE = 'http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&format=json&period=7day&';
const MAX_ARTISTS = 10;
const MAX_ARTIST_LEN = 30;

const GITHUB_TOKEN = process.env.GH_TOKEN;
const LASTFM_TOKEN = process.env.LASTFM_KEY;
const LASTFM_USRN = process.env.LFMUSERNAME;

(async () => {
	if (!LASTFM_USRN || !LASTFM_TOKEN || !GITHUB_TOKEN)
		throw new Error('Please check your environment variables, as you are missing one.');
	const API = `${API_BASE}user=${LASTFM_USRN}&api_key=${LASTFM_TOKEN}`;

	const data = await fetch(API);
	const json = await data.json();

	const num_artists = Math.min(MAX_ARTISTS, json.topartists.artist.length);
	let total_plays = 0;
	for(let i = 0; i < num_artists; ++i)
		total_plays += parseInt(json.topartists.artist[i].playcount);

	const lines = [];
	for(let i = 0; i < num_artists; ++i) {
		const plays = json.topartists.artist[i].playcount;
		let name =  json.topartists.artist[i].name.substring(0, MAX_ARTIST_LEN);

		// trim off long widechars
		for(let i = MAX_ARTIST_LEN - 1; i >= 0; i--) {
			if(eaw.length(name) <= MAX_ARTIST_LEN + 1) break;
			name = name.substring(0, i);
		}

		// pad short strings
		name = name.padEnd(MAX_ARTIST_LEN + 1 + name.length - eaw.length(name));

		lines.push([
			name,
			generateBarChart(plays * 100 / total_plays, 17),
			`${plays}`.padStart(5),
			'plays'
		].join(' '));
	}

	text = lines.join("\n");
	if(text.length == 0) text = "♥ Looks like I haven't listened to anything recently :P";
	const result = "<h3>scrobbles this week ❄</h3><pre>" + text + "</pre>";

	fs.writeFile("README.md", result, function (err) {
		if (err) return console.log(err);
	});
})();

function generateBarChart(percent, size) {
	const syms = "░▏▎▍▌▋▊▉█";

	const frac = Math.floor((size * 8 * percent) / 100);
	const barsFull = Math.floor(frac / 8);
	if (barsFull >= size)
		return syms.substring(8, 9).repeat(size);

	const semi = frac % 8;

	return [
		syms.substring(8, 9).repeat(barsFull),
		syms.substring(semi, semi + 1),
	].join("").padEnd(size, syms.substring(0, 1));
}
