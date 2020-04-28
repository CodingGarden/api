const tmi = require('tmi.js');

function listenChats(app) {
  const client = new tmi.Client({
    connection: {
      secure: true,
      reconnect: true
    },
    channels: [process.env.TWITCH_CHANNEL_NAME]
  });
  client.connect();
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
    app.service('twitch/chat').create(item);
  });
  client.on('messagedeleted', (channel, username, deletedMessage, userstate) => {
    const id = userstate['target-msg-id'];
    app.service('twitch/chat').remove(id);
  });
}

module.exports = {
  listenChats,
};
