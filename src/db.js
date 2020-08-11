const monk = require('monk');

const db = monk(process.env.MONGO_URI);

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
};
