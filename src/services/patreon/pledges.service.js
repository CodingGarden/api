const {
  getPledges,
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

  async create() {
    const oldUsers = this.data.users;
    this.data = await getPledges({});
    return Object.values(this.data.users).find((user) => !oldUsers[user.id]);
  }
}

module.exports = PledgeService;
