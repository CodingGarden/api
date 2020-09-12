const axios = require('axios');

const Requesting_subs_limit = 100;

const {
  TWITCH_SUB_OAUTH_TOKEN,
  TWITCH_SUB_CLIENT_ID,
  TWITCH_CHANNEL_ID,
} = process.env;

// {
// created_at": "2020-04-28T11:37:28Z",
// "_id": "e60aaaf329e3a89a1cfb0cf33dd848205893dd20",
// "sub_plan": "3000",
// "sub_plan_name": "Avocado",
// "is_gift": false,
// "user": {
//   "display_name": "CodingGarden",
//   "type": "user",
//   "bio": "",
//   "created_at": "2019-02-02T04:46:04Z",
//   "updated_at": "2020-04-29T20:05:08Z",
//   "name": "codinggarden",
//   "_id": "413856795",
//   "logo": "https://static-cdn.jtvnw.net/jtv_user_pictures/611cac54-34e0-4c2a-851b-66e5ea2b3f81-profile_image-300x300.png"
// },
// "sender": null
// },

// {
//   "id": "2870215",
//   "name": "Danny",
//   "level": {
//     "amount_cents": 100,
//     "created_at": "2018-06-02T00:58:14.762+00:00",
//     "level_id": "2915602"
//   }
// },

const cacheTime = 30 * 60 * 1000;
let lastRequest;
const apiUrl = `https://api.twitch.tv/kraken/channels/${TWITCH_CHANNEL_ID}/subscriptions?limit=${Requesting_subs_limit}`;

const tiersToCents = {
  1000: 499,
  2000: 999,
  3000: 2499
};

const levels = {
  1000: 'Wall Flower',
  2000: 'Fertilizer',
  3000: 'Avocado',
};

async function getSubsPage(offset = 0, all = []) {
  console.log('Gettting sub offset', offset);
  const { data: { _total, subscriptions } } = await axios
    .get(`${apiUrl}&offset=${offset}`, {
      headers: {
        authorization: `OAuth ${TWITCH_SUB_OAUTH_TOKEN}`,
        'Client-ID': TWITCH_SUB_CLIENT_ID,
        Accept: 'application/vnd.twitchtv.v5+json',
      }
    });
  all = all.concat(subscriptions);
  console.log('Got', all.length, 'of', _total, 'subs');
  if (all.length >= _total) return all;
  return getSubsPage(offset + 100, all);
}

async function getSubs() {
  console.log('getting subs...');
  const data = await getSubsPage();
  console.log('got all subs!');
  const usersById = {};
  const users = data.map(({
    sub_plan: tier,
    created_at,
    user: {
      _id: id,
      name,
    },
  }) => {
    const user = {
      id,
      name,
      level: {
        amount_cents: tiersToCents[tier],
        created_at: new Date(created_at),
        level_id: tier,
      },
    };
    usersById[id] = user;
    return user;
  }).filter((user) => user.id !== TWITCH_CHANNEL_ID);
  return {
    users,
    levels,
    usersById,
  };
}

class TwitchSubs {
  constructor() {
    this.data = null;
  }

  async get(id) {
    if (!this.data) {
      this.data = getSubs();
      lastRequest = Date.now();
    } else if (!lastRequest || lastRequest < Date.now() - cacheTime) {
      this.data = getSubs();
      lastRequest = Date.now();
    }
    this.data = await this.data;
    if (Object.prototype.hasOwnProperty.call(this.data.usersById, id)) {
      return this.data.usersById[id];
    }
    return false;
  }

  async find(params) {
    if (!this.data) {
      this.data = getSubs();
      lastRequest = Date.now();
    } else if (!lastRequest || lastRequest < Date.now() - cacheTime) {
      this.data = getSubs();
      lastRequest = Date.now();
    }
    this.data = await this.data;
    const result = {
      users: this.data.users.slice(0),
      levels: this.data.levels,
    };
    const {
      sort
    } = params.query;
    result.users = result.users.sort((a, b) => {
      if (sort === 'amount') {
        const priceDiff = b.level.amount_cents - a.level.amount_cents;
        if (priceDiff !== 0) return priceDiff;
      }
      return new Date(a.level.created_at) - new Date(b.level.created_at);
    });
    return result;
  }

  async create() {
    if (!this.data) return { created: true };
    const latestData = await getSubs();
    const newMember = latestData.users.find((user) => !this.data.usersById[user.id]);
    this.data = latestData;
    return newMember;
  }
}

module.exports = TwitchSubs;
