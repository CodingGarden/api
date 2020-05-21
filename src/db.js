const monk = require('monk');

const db = monk(process.env.MONGO_URI);

const twitchChats = db.get('twitch-chats');
twitchChats.createIndex('username name userId id created_at message');

const counter = db.get('counter');
counter.createIndex('name');

module.exports = {
  twitchChats,
  counter,
};
