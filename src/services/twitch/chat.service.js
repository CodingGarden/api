/* eslint-disable class-methods-use-this */
const { sub } = require('date-fns');
const {
  listenChats
} = require('./chat.functions');
const {
  twitchChats
} = require('../../db');

class TwitchService {
  constructor(app) {
    listenChats(app);
  }

  async find() {
    return twitchChats.find({
      deleted_at: {
        $eq: null,
      },
      created_at: {
        $gte: sub(new Date(), {
          hours: 6,
        }),
      }
    });
  }

  async remove(id) {
    await twitchChats.update({ id }, { $set: { deleted_at: new Date() } });
    return id;
  }

  async create(message) {
    const created = await twitchChats.insert(message);
    return created;
  }
}

module.exports = TwitchService;
