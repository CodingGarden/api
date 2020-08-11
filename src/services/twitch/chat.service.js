const { sub } = require('date-fns');
const {
  listenChats
} = require('./chat.functions');
const {
  twitchChats,
} = require('../../db');

class TwitchService {
  constructor(app) {
    this.app = app;
    listenChats(app);
  }

  async find(params) {
    const query = {
      deleted_at: {
        $eq: null,
      },
      created_at: {
        $gte: sub(new Date(), {
          hours: 6,
        }),
      },
      ack: {
        $ne: true,
      },
    };
    if (params.query) {
      if (params.query.commands === 'false' || params.query.commands === false) {
        query.message = {
          $regex: /^(?!\\!)\w+/,
        };
      }
      if (params.query.user_id) {
        query.user_id = params.query.user_id;
      }
      if (params.query.created_at) {
        query.created_at = params.query.created_at;
      }
    }
    const messages = await twitchChats.find(query, {
      sort: {
        created_at: -1
      },
      limit: 1000,
    });
    return messages;
  }

  async remove(id) {
    await twitchChats.update({ id }, { $set: { deleted_at: new Date() } });
    return id;
  }

  async patch(id, updates) {
    const updated = await twitchChats.findOneAndUpdate({
      id,
    }, {
      $set: updates,
    }, {
      upsert: true,
    });
    return updated;
  }

  async create(message) {
    const user = await this.app.service('twitch/users').get(message.username);
    const created = await twitchChats.findOneAndUpdate({
      id: message.id,
    }, {
      $set: message,
    }, {
      upsert: true,
    });
    created.user = user;
    return created;
  }
}

module.exports = TwitchService;
