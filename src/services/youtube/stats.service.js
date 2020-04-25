const {
  getChannelFacts,
} = require('./members.functions');

class StatsService {
  // eslint-disable-next-line
  async find() {
    return getChannelFacts();
  }
}

module.exports = StatsService;
