const { sub } = require('date-fns');
const {
  listenChats
} = require('./chat.functions');
const {
  twitchChats,
  counter,
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
    if (message.message.match(/^!(ask|idea|submit)/)) {
      const count = await counter.findOneAndUpdate({
        name: 'question',
      }, {
        $inc: { value: 1 }
      }, {
        upsert: true,
      });
      message.num = count.value;
    }
    const created = await twitchChats.insert(message);
    return created;
  }
}

module.exports = TwitchService;
