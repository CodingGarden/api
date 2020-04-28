const monk = require('monk');

const db = monk(process.env.MONGO_URI);

const twitchChats = db.get('twitch-chats');
twitchChats.createIndex('username name userId id created_at');

const questionsAndComments = db.get('questions-comments');

module.exports = {
  twitchChats,
  questionsAndComments,
};
