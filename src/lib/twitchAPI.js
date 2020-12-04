const axios = require('axios');

const twitchAPI = axios.create({
  baseURL: 'https://api.twitch.tv/kraken',
  headers: {
    'Client-ID': process.env.TWITCH_SUB_CLIENT_ID,
    Accept: 'application/vnd.twitchtv.v5+json',
    Authorization: `Bearer ${process.env.TWITCH_SUB_OAUTH_TOKEN}`
  },
});

const helixAPI = axios.create({
  baseURL: 'https://api.twitch.tv/helix',
  headers: {
    'Client-ID': process.env.TWITCH_SUB_CLIENT_ID,
    Authorization: `Bearer ${process.env.TWITCH_REWARDS_TOKEN}`
  },
});

async function getChannel(channelId) {
  const { data } = await twitchAPI.get(`/channels/${channelId}`);
  return data;
}

async function getChannelFollows(channelId, cursor = '', followers = []) {
  const {
    data: {
      _cursor,
      follows
    }
  } = await twitchAPI.get(`/channels/${channelId}/follows?limit=100&cursor=${cursor}`);
  if (_cursor) {
    return followers.concat(await getChannelFollows(channelId, _cursor, follows));
  }
  const all = followers.concat(follows);
  return all;
}

async function getTeam(teamName) {
  const { data: { users } } = await twitchAPI.get(`/teams/${teamName}`);
  return users;
}

async function getStream(channelId) {
  const { data: { stream } } = await twitchAPI.get(`/streams/${channelId}`);
  return stream;
}

async function getUserFollow(userId, channelId) {
  try {
    const { data: { created_at, notifications } } = await twitchAPI.get(`/users/${userId}/follows/channels/${channelId}`);
    return { created_at, notifications };
  } catch (error) {
    console.log(userId, error.response.data);
    return false;
  }
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

async function updateRedemption(redemption) {
  const { data } = await helixAPI.patch(`/channel_points/custom_rewards/redemptions?id=${redemption.id}&reward_id=${redemption.reward.id}&broadcaster_id=${redemption.channel_id}`, {
    status: 'FULFILLED',
  });
  return data;
}

module.exports = {
  getChannel,
  getChannelByUsername,
  getStream,
  getTeam,
  getUserFollow,
  getUsers,
  getChannelFollows,
  updateRedemption,
};
