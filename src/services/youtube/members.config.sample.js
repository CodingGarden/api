const key = ''; // FILL ME IN
const externalChannelId = ''; // FILL ME IN

const cookie = ''; // FILL ME IN

const referrer = ''; // FILL ME IN

const headers = {
  accept: '*/*',
  'accept-language': 'en-US,en;q=0.9,es;q=0.8',
  authorization: '', // FILL ME IN
  'cache-control': 'no-cache',
  'content-type': 'application/json',
  pragma: 'no-cache',
  'sec-ch-ua': '"Google Chrome 79"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'x-client-data': '', // FILL ME IN
  'x-goog-authuser': '0',
  'x-goog-visitor-id': '', // FILL ME IN
  'x-origin': 'https://studio.youtube.com',
  'x-youtube-ad-signals': '', // FILL ME IN
  'x-youtube-client-name': '62',
  'x-youtube-client-version': '1.20191218.0.0',
  'x-youtube-time-zone': '', // FILL ME IN
  'x-youtube-utc-offset': '', // FILL ME IN
  cookie,
};

const client = {
  clientName: 62,
  clientVersion: '1.20191218.0.0',
  hl: 'en',
  gl: 'US',
  experimentsToken: '', // FILL ME IN
};

const user = {
  onBehalfOfUser: '', // FILL ME IN
};

const request = {
  returnLogEntry: true,
  internalExperimentFlags: [{
    key: 'force_route_innertube_shopping_settings_to_outertube',
    value: 'true',
  }, {
    key: 'force_route_delete_playlist_to_outertube',
    value: 'false',
  }, {
    key: 'force_live_chat_merchandise_upsell',
    value: 'false',
  }],
};

const clientScreenNonce = ''; // FILL ME IN

const context = {
  client,
  request,
  user,
  clientScreenNonce,
};

module.exports = {
  key,
  externalChannelId,
  context,
  headers,
  referrer,
};
