const axios = require('axios');

const {
  TWITCH_SUB_OAUTH_TOKEN
} = process.env;

// {
//   "broadcaster_id": "413856795",
//   "broadcaster_name": "CodingGarden",
//   "gifter_id": "112793979",
//   "gifter_name": "PixelogicDev",
//   "is_gift": true,
//   "plan_name": "Wall Flower",
//   "tier": "1000",
//   "user_id": "465598376",
//   "user_name": "mynameisinfi"
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

const apiUrl = 'https://api.twitch.tv/helix/subscriptions?broadcaster_id=413856795&first=100';

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

async function getSubs() {
  const { data: { data } } = await axios.get(apiUrl, {
    headers: {
      authorization: `Bearer ${TWITCH_SUB_OAUTH_TOKEN}`,
    }
  });
  const usersById = {};
  const users = data.map(({
    user_id: id,
    user_name: name,
    tier,
  }) => {
    const user = {
      id,
      name,
      level: {
        amount_cents: tiersToCents[tier],
        created_at: new Date(),
        level_id: tier,
      },
    };
    usersById[id] = user;
    return user;
  });
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

  async find(params) {
    this.data = this.data || await getSubs();
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
