const axios = require('axios');

const emotes = {};
let regexStr = '';
let emoteRegex;
let lastRequest;
const emoteTimeout = 24 * 60 * 60 * 1000;

const appendEmote = (selector) => (emote) => {
  const {
    code,
    url
  } = selector(emote);
  emotes[code.toLowerCase()] = url;
  regexStr += `${code.toLowerCase().replace(/\(/, '\\(').replace(/\)/, '\\)')}|`;
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
  } = await axios.get(`tps://api.betterttv.net/3/cached/users/twitch/${process.env.TWITCH_CHANNEL_ID}`);
  allEmotes = allEmotes.concat(channelEmotes).concat(sharedEmotes);
  const appenderizer3000 = appendEmote(({
    code,
    id
  }) => ({
    code,
    url: `https://cdn.betterttv.net/emote/${id}/3x`
  }));
  allEmotes.forEach(appenderizer3000);
}

async function getFfzEmotes() {
  const { data: { sets } } = await axios.get('https://api.frankerfacez.com/v1/set/global');
  const { data: { sets: channelSets } } = await axios.get(`ttps://api.frankerfacez.com/v1/room/${process.env.TWITCH_CHANNEL_NAME}`);
  const all = sets[3].emoticons.concat(channelSets[609613].emoticons);
  const appenderizer9000 = appendEmote(({
    name: code,
    urls
  }) => ({
    code,
    url: `https:${Object.values(urls).pop()}`
  }));
  all.forEach(appenderizer9000);
}

async function getEmoteRegex() {
  if (!emoteRegex || (lastRequest && lastRequest > Date.now - emoteTimeout)) {
    console.log('Refreshing BTTV and FFZ cache...');
    await Promise.all([
      getBttvEmotes(),
      getFfzEmotes(),
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
        starts[start] = {
          url: `![](https://static-cdn.jtvnw.net/emoticons/v1/${id}/4.0#emote)`,
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
    .replace(emoteRegex, (code) => `![${code}](${emotes[code.toLowerCase()]}#emote)`);
  if (result === message) return undefined;
  return result;
};
