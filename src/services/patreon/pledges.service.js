const {
  addPledge,
  addReward,
  addUser,
  getPledges,
  verifySecret,
} = require('./pledges.functions');

class PledgeService {
  constructor() {
    this.data = null;
  }

  async find(params) {
    this.data = this.data || await getPledges({});
    const result = {
      users: Object.values(this.data.users),
      levels: this.data.rewardsById,
    };
    const { sort } = params.query;
    result.users = result.users.sort((a, b) => {
      if (sort === 'amount') {
        const priceDiff = b.level.amount_cents - a.level.amount_cents;
        if (priceDiff !== 0) return priceDiff;
      }
      return new Date(a.level.created_at) - new Date(b.level.created_at);
    });
    return result;
  }

  async create(body, params) {
    if (!this.data) return { success: true };
    if (!verifySecret(params.rawBody, params.headers['x-patreon-signature'])) throw new Error('Invalid signature.');
    const { data, included } = body;
    if (params.headers['x-patreon-event'] === 'pledges:delete') {
      delete this.data.users[data.relationships.patron.data.id];
      delete this.data.pledgesByUserId[data.relationships.patron.data.id];
      return {
        type: 'delete',
        id: data.relationships.patron.data.id,
      };
    }
    addPledge(data, this.data.pledgesByUserId, this.data.rewardIdsByCost);
    included.forEach((item) => {
      if (item.type === 'reward') {
        addReward(item, this.data.rewardsById);
      } else if (item.type === 'user' && this.data.pledgesByUserId[item.id]) {
        addUser(item, this.data.pledgesByUserId, this.data.users);
      }
    });
    return this.data.users[data.relationships.patron.data.id];
  }
}

module.exports = PledgeService;
