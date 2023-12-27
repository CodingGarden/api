const axios = require('axios');

const emotes = {};
const sources = {};
let regexStr = '';
let emoteRegex;
let lastRequest;
const emoteTimeout = 24 * 60 * 60 * 1000;

const appendEmote = (selector) => (emote) => {
  const {
    code,
    source,
    url
  } = selector(emote);
  const lowerCaseCode = code.toLowerCase();
  emotes[lowerCaseCode] = url;
  sources[lowerCaseCode] = source;
  regexStr += `${lowerCaseCode.replace(/\(/, '\\(').replace(/\)/, '\\)')}|`;
};

async function getBttvEmotes() {
  let {
    data: allEmotes
  } = await axios.get('https://api.betterttv.net/3/cached/emotes/global');
  const {
    data: {
      channelEmotes,
      sharedEmotes
    }
  } = await axios.get(`https://api.betterttv.net/3/cached/users/twitch/${process.env.TWITCH_CHANNEL_ID}`);
  allEmotes = allEmotes.concat(channelEmotes).concat(sharedEmotes);
  const appenderizer3000 = appendEmote(({
    code,
    id
  }) => ({
    code,
    source: 'BTTV',
    url: `https://cdn.betterttv.net/emote/${id}/3x`
  }));
  allEmotes.forEach(appenderizer3000);
}

async function getFfzEmotes() {
  const { data: { sets } } = await axios.get('https://api.frankerfacez.com/v1/set/global');
  const { data: { sets: channelSets } } = await axios.get(`https://api.frankerfacez.com/v1/room/${process.env.TWITCH_CHANNEL_NAME}`);
  const all = sets[3].emoticons.concat(channelSets[609613].emoticons);
  const appenderizer9000 = appendEmote(({
    name: code,
    urls
  }) => {
    const url = Object.values(urls).pop();
    return {
      code,
      source: 'FFZ',
      url: url.startsWith('http') ? url : `https:${url}`
    };
  });
  all.forEach(appenderizer9000);
}

async function get7tvEmotes() {
  const { data: globalEmotes } = await axios.get('https://7tv.io/v3/emote-sets/global');
  const { data: channelEmotes } = await axios.get(`https://7tv.io/v3/users/twitch/${process.env.TWITCH_CHANNEL_ID}`);
  const all = globalEmotes.emotes.concat(channelEmotes.emote_set.emotes);
  const appenderizer9000 = appendEmote(({
    name: code,
    id
  }) => ({
    code,
    source: '7TV',
    url: `https://cdn.7tv.app/emote/${id}/4x.webp`
  }));
  all.forEach(appenderizer9000);
}

async function getEmoteRegex() {
  if (!emoteRegex || (lastRequest && Date.now() - lastRequest > emoteTimeout)) {
    console.log('Refreshing BTTV, 7TV and FFZ cache...');
    await Promise.all([
      getBttvEmotes().catch((error) => {
        console.log('Error loading BTTV emotes:', error);
      }),
      getFfzEmotes().catch((error) => {
        console.log('Error loading FFZ emotes:', error);
      }),
      get7tvEmotes().catch((error) => {
        console.log('Error loading 7TV emotes:', error);
      }),
    ]);
    lastRequest = Date.now();
    regexStr = regexStr.slice(0, -1);
    emoteRegex = new RegExp(`(?<=^|\\s)(${regexStr})(?=$|\\s)`, 'gi');
  }
  return emoteRegex;
}

module.exports = async function parseEmotes(message, messageEmotes = {}) {
  await getEmoteRegex();
  let parsedMessage = '';
  if (messageEmotes) {
    const emoteIds = Object.keys(messageEmotes);
    const emoteStart = emoteIds.reduce((starts, id) => {
      messageEmotes[id].forEach((startEnd) => {
        const [start, end] = startEnd.split('-');
        const name = message.substring(+start, +end + 1);
        starts[start] = {
          url: `![Twitch - ${name}](https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0#emote)`,
          end,
        };
      });
      return starts;
    }, {});
    const parts = Array.from(message);
    for (let i = 0; i < parts.length; i++) {
      const char = parts[i];
      const emoteInfo = emoteStart[i];
      if (emoteInfo) {
        parsedMessage += emoteInfo.url;
        i = emoteInfo.end;
      } else {
        parsedMessage += char;
      }
    }
  }
  const result = (parsedMessage || message)
    .replace(emoteRegex, (code) => `![${sources[code.toLowerCase()]} - ${code}](${emotes[code.toLowerCase()]}#emote)`);
  if (result === message) return undefined;
  return result;
};
