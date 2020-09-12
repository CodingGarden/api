const tmi = require('tmi.js');
const { sub } = require('date-fns');
const {
  TWITCH_SUB_OAUTH_TOKEN,
} = process.env

const parseEmotes = require('../../lib/parseEmotes');

let Oauth_

if (process.env.Oauth_Included_In_Token === true) {
  Oauth_ = `${TWITCH_SUB_OAUTH_TOKEN}`
} else {
  Oauth_ = `oauth:${TWITCH_SUB_OAUTH_TOKEN}`
}



const client = new tmi.Client({
  connection: {
    secure: true,
    reconnect: true
  },
  identity: {
    username: process.env.TWITCH_CHANNEL_NAME,
    password: Oauth_,
  },
  channels: [process.env.TWITCH_CHANNEL_NAME]
});
client.connect();

function listenChats(app) {
  client.on('message', async (channel, tags, message) => {
    if (tags['message-type'] === 'whisper') return;
    tags.badges = tags.badges || {};
    const item = Object.entries(tags).reduce((all, [key, value]) => {
      all[key.replace(/-/g, '_')] = value;
      return all;
    }, {});
    item.name = item.display_name || item.username;
    item.created_at = new Date(+item.tmi_sent_ts);
    item.deleted_at = null;
    item.message = message;
    try {
      item.parsedMessage = await parseEmotes(message, item.emotes);
    } catch (error) {
      console.error('error parsing emotes...', error.message, item);
    }
    if (message.match(/^!\w/)) {
      item.args = message.split(' ');
      item.command = item.args.shift().slice(1);
      app.service('twitch/commands').create(item);
    } else {
      app.service('twitch/chat').create(item);
    }
  });
  client.on('timeout', async (channel, username, reason, duration, tags) => {
    const user_id = tags['target-user-id'];
    const recentChats = await app.service('twitch/chat').find({
      query: {
        user_id,
      },
      created_at: {
        $gte: sub(new Date(), {
          minutes: 10,
        }),
      }
    });
    await Promise.all(
      recentChats.map(async (chat) => {
        await app.service('twitch/chat').remove(chat.id);
        await app.service('twitch/commands').remove(chat.id);
      })
    );
  });
  client.on('messagedeleted', (channel, username, deletedMessage, userstate) => {
    const id = userstate['target-msg-id'];
    app.service('twitch/chat').remove(id);
    app.service('twitch/commands').remove(id);
  });
}

async function getModerators() {
  try {
    const mods = await client.mods(process.env.TWITCH_CHANNEL_NAME);
    return mods;
  } catch (error) {
    console.error(error);
    return [];
  }
}

module.exports = {
  listenChats,
  getModerators,
};
