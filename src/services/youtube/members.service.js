const {
  getMembers
} = require('./members.functions');

class MemberService {
  constructor() {
    this.data = null;
  }

  async find() {
    this.data = this.data || await getMembers();
    return this.data.users;
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
