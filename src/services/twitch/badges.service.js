const { getGlobalChatBadges, getChannelChatBadges } = require('../../lib/twitchAPI');

class TwitchBadges {
  constructor() {
    this.cache = new Map();
  }

  async get(id) {
    if (this.cache.has(id)) return this.cache.get(id);
    this.cache.set(id, id === 'global' ? getGlobalChatBadges() : getChannelChatBadges(id));
    return this.cache.get(id);
  }
}

module.exports = TwitchBadges;
