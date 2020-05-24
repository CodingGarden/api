const app = require('../src/app');
const {
  twitchChats,
} = require('../src/db');

async function updateAllUsers() {
  try {
    const messages = await twitchChats.find({});
    const names = [...new Set(messages.map((message) => message.username))];
    const users = await app.service('twitch/users').find({
      query: {
        names,
      }
    });
    console.log('updated', users.length);
  } catch (error) {
    console.error(error);
  }
}

updateAllUsers();
