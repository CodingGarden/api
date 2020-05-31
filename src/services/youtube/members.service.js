const {
  getMembers
} = require('./members.functions');

class MemberService {
  constructor() {
    this.data = null;
  }

  async find(params) {
    this.data = this.data || await getMembers();
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
    const latestData = await getMembers();
    const newMember = latestData.users.find((user) => !this.data.usersById[user.id]);
    this.data = latestData;
    return newMember;
  }
}

module.exports = MemberService;
