const key = ''; // FILL ME IN
const externalChannelId = ''; // FILL ME IN

const cookie = ''; // FILL ME IN

const referrer = ''; // FILL ME IN

const headers = {
  accept: '*/*',
  'accept-language': 'en-US,en;q=0.5',
  authorization:
    '', // FILL ME IN
  'cache-control': 'no-cache',
  'content-type': 'application/json',
  pragma: 'no-cache',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-GPC': '1',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/110.0',
  'X-Goog-AuthUser': '0',
  'X-Goog-PageId': '109069981838370619794',
  'X-Goog-Visitor-Id': '', // FILL ME IN
  'X-Origin': 'https://studio.youtube.com',
  'X-YouTube-Ad-Signals': '', // FILL ME IN
  'X-YouTube-Client-Name': '62',
  'X-YouTube-Client-Version': '1.20230206.03.00',
  'X-YouTube-Delegation-Context': '', // FILL ME IN
  'X-YouTube-Page-CL': '507507627',
  'X-YouTube-Page-Label': 'youtube.studio.web_20230206_03_RC00',
  'X-YouTube-Time-Zone': 'America/Denver',
  'X-YouTube-Utc-Offset': '-420',
  cookie,
  origin: 'https://studio.youtube.com',
  DNT: '1',
  referrer,
};

const client = {
  clientName: 62,
  clientVersion: '1.20230206.03.00',
  hl: 'en',
  gl: 'US',
  experimentsToken: '',
  utcOffsetMinutes: -420,
  userInterfaceTheme: 'USER_INTERFACE_THEME_DARK',
  screenWidthPoints: 991,
  screenHeightPoints: 859,
  screenPixelDensity: 2,
  screenDensityFloat: 2
};

const user = {
  onBehalfOfUser: '', // FILL ME IN
  delegationContext: {
    externalChannelId: '', // FILL ME IN
    roleType: { channelRoleType: 'CREATOR_CHANNEL_ROLE_TYPE_OWNER' }
  },
  serializedDelegationContext: '' // FILL ME IN
};

const request = {
  returnLogEntry: true,
  internalExperimentFlags: []
};

const clientScreenNonce = ''; // FILL ME IN

const continuationToken = ''; // FILL ME IN

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
  continuationToken,
};
