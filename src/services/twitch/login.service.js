const crypto = require('crypto');
const axios = require('axios');
const jws = require('jws');

const {
  getModerators,
} = require('./chat.functions');

const {
  JWT_SECRET: secret,
  TWITCH_MGMT_CLIENT_ID: client_id,
  TWITCH_MGMT_CLIENT_SECRET: client_secret,
  TWITCH_CHANNEL_NAME: channel_name,
} = process.env;

const algorithm = { alg: 'HS256' };

function createToken(payload = crypto.randomBytes(2).toString('hex')) {
  const token = jws.sign({
    header: algorithm,
    payload,
    secret,
  });
  const [, data, signature] = token.split('.');
  return [data, signature].join('.');
}

function validateToken(state) {
  return jws.verify(`eyJhbGciOiJIUzI1NiJ9.${state}`, algorithm.alg, secret);
}

class TwitchLoginService {
  constructor(app) {
    this.app = app;
  }

  async get(id, params) {
    if (id !== 'mod') throw new Error('Not Found');
    const state = createToken();
    const requestParams = new URLSearchParams({
      client_id,
      redirect_uri: 'http://localhost:8080/#/twitch/callback',
      response_type: 'code',
      state,
      force_verify: true
    });
    params.res.status(302);
    params.res.set('Location', `https://id.twitch.tv/oauth2/authorize?${requestParams}`);
    return {
      status: 'Logging in...'
    };
  }

  async create(info) {
    const { code, state } = info;
    if (!validateToken(state)) {
      throw new Error('Invalid state');
    }
    const authParams = new URLSearchParams({
      client_id,
      client_secret,
      code,
      scope: '',
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:8080/#/twitch/callback',
      state,
    });
    try {
      const {
        data: {
          access_token,
        }
      } = await axios.post(`https://id.twitch.tv/oauth2/token?${authParams}`);
      const { data: { data: [user] } } = await axios.get('https://api.twitch.tv/helix/users', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'client-id': client_id,
        },
      });
      const moderators = await getModerators();
      if (channel_name !== user.login && !moderators.includes(user.login)) {
        throw new Error('You are not a moderator.');
      }
      const token = createToken({
        id: user.id,
        login: user.login,
        display_name: user.display_name,
        image: user.profile_image_url,
        moderator: true,
      });
      return { token };
    } catch (error) {
      error.message = error.response ? error.response.data.message : error.message;
      throw error;
    }
  }
}

module.exports = TwitchLoginService;
