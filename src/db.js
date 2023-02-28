const monk = require('monk');

const db = monk(process.env.MONGO_URI);

const youtubeChats = db.get('youtube-chats');
youtubeChats.createIndex('id author_id author_display_name author_handle message live_chat_id');

const youtubeUsers = db.get('youtube-users');
youtubeUsers.createIndex('id display_name handle');

const youtubeCommands = db.get('youtube-commands');
youtubeCommands.createIndex('id author_id author_display_name author_handle message live_chat_id');

const twitchChats = db.get('twitch-chats');
twitchChats.createIndex('username name userId id created_at message');

const twitchCommands = db.get('twitch-commands');
twitchCommands.createIndex('username command name userId id created_at message');

const twitchUsers = db.get('twitch-users');
twitchChats.createIndex('name display_name id created_at');

const twitchRewards = db.get('twitch-rewards');
twitchChats.createIndex('ack');

const counter = db.get('counter');
counter.createIndex('name');

module.exports = {
  db,
  twitchRewards,
  twitchCommands,
  twitchChats,
  twitchUsers,
  counter,
  youtubeChats,
  youtubeUsers,
  youtubeCommands,
};
