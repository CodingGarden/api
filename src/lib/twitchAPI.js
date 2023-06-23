const axios = require('axios');

const helixAPI = axios.create({
  baseURL: 'https://api.twitch.tv/helix',
  headers: {
    'Client-ID': process.env.TWITCH_SUB_CLIENT_ID,
    Authorization: `Bearer ${process.env.TWITCH_SUB_OAUTH_TOKEN}`
  },
});

async function getChannel(channelId) {
  const { data } = await helixAPI.get(`/channels?broadcaster_id=${channelId}`);
  return data;
}

async function getChannelFollows(channelId, cursor = '', followers = []) {
  const {
    data: {
      _cursor,
      follows
    }
  } = await helixAPI.get(`/users/follows?to_id=${channelId}&first=100&after=${cursor}`);
  if (_cursor) {
    return followers.concat(await getChannelFollows(channelId, _cursor, follows));
  }
  const all = followers.concat(follows);
  return all;
}

async function getTeam(teamName) {
  const { data: { users } } = await helixAPI.get(`/teams?name=${teamName}`);
  return users;
}

async function getStream(channelId) {
  const { data: [stream] } = await helixAPI.get(`/streams?user_id=${channelId}`);
  return stream;
}

async function getUserFollow(userId, channelId) {
  try {
    const { data: { data: [follow] } } = await helixAPI.get(`/users/follows?to_id=${channelId}&from_id=${userId}`);
    if (!follow) return false;
    // TODO: missing notifications property...
    return { created_at: follow.followed_at };
  } catch (error) {
    console.log(userId, error.response.data);
    return false;
  }
}

async function getUsers(...usernames) {
  const url = `/users?login=${usernames.map((u) => encodeURIComponent(u)).join('&login=')}`;
  const { data: { data: users } } = await helixAPI.get(url);
  return users.map((u) => {
    u.name = u.login;
    u.logo = u.profile_image_url;
    return u;
  });
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

async function getChannelChatBadges(broadcaster_id) {
  const { data: { data } } = await helixAPI.get(`/chat/badges?broadcaster_id=${broadcaster_id}`);
  return data;
}

async function getGlobalChatBadges() {
  const { data: { data } } = await helixAPI.get('/chat/badges/global');
  return data;
}

module.exports = {
  getChannel,
  getChannelByUsername,
  getGlobalChatBadges,
  getChannelChatBadges,
  getStream,
  getTeam,
  getUserFollow,
  getUsers,
  getChannelFollows,
  updateRedemption,
};
