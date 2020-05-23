const axios = require('axios');

const twitchAPI = axios.create({
  baseURL: 'https://api.twitch.tv/kraken',
  headers: {
    'Client-ID': process.env.TWITCH_SUB_CLIENT_ID,
    Accept: 'application/vnd.twitchtv.v5+json',
  },
});

async function getChannel(channelId) {
  const { data } = await twitchAPI.get(`/channels/${channelId}`);
  return data;
}

async function getTeam(teamName) {
  const { data: { users } } = await twitchAPI.get(`/teams/${teamName}`);
  return users;
}

async function getStream(channelId) {
  const { data: { stream } } = await twitchAPI.get(`/streams/${channelId}`);
  return stream;
}

async function getUsers(...usernames) {
  const { data: { users } } = await twitchAPI.get(`/users?login=${encodeURIComponent(usernames.join(','))}`);
  return users;
}

async function getChannelByUsername(username) {
  const [user] = await getUsers(username);
  if (user) {
    return getChannel(user._id);
  }
  throw new Error('Not Found!');
}

module.exports = {
  getChannel,
  getChannelByUsername,
  getStream,
  getTeam,
  getUsers,
};
