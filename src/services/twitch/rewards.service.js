const TPS = require('twitchps');

const {
  TWITCH_CHANNEL_ID,
  Developing,
  TWITCH_REWARDS_TOKEN,
} = process.env;

const {
  twitchRewards,
} = require('../../db');

class TwitchRewardsService {
  constructor(app) {
    const init_topics = [{
      topic: `channel-points-channel-v1.${TWITCH_CHANNEL_ID}`,
      token: process.env.TWITCH_REWARDS_TOKEN,
    }];

    const pubSub = new TPS({
      init_topics,
      reconnect: true,
      debug: Developing ? true : false,
    });

    pubSub.on('channel-points', async (data) => {
      app.service('twitch/rewards').create(data);
    });
  }

  async find() {
    return twitchRewards.find({
      ack: {
        $ne: true,
      },
    });
  }

  async create(data) {
    const created = await twitchRewards.insert(data);
    return created;
  }
}

module.exports = TwitchRewardsService;