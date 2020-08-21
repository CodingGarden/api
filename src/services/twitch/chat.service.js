const { sub } = require('date-fns');
const { listenChats } = require('./chat.functions');
const { twitchChats } = require('../../db');

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
      if (params.query.user_id) {
        query.user_id = params.query.user_id;
      }
      if (params.query.created_at) {
        query.created_at = {
          $gte: new Date(params.query.created_at),
        };
      }
    }
    const messages = await twitchChats.find(query, {
      sort: {
        created_at: -1,
      },
      limit: params.query.limit || 1000,
    });
    return messages;
  }

  async remove(id) {
    await twitchChats.update({ id }, { $set: { deleted_at: new Date() } });
    return id;
  }

  async patch(id, updates) {
    const updated = await twitchChats.findOneAndUpdate(
      {
        id,
      },
      {
        $set: updates,
      },
      {
        upsert: true,
      }
    );
    return updated;
  }

  async create(message) {
    let user = {
      _id: message.user_id,
      name: message.username,
      bio: '',
      created_at: new Date(),
      display_name: message.display_name,
      id: message.user_id,
      logo: 'https://static-cdn.jtvnw.net/jtv_user_pictures/611cac54-34e0-4c2a-851b-66e5ea2b3f81-profile_image-300x300.png',
      type: 'user',
      updated_at: new Date(),
      follow: false,
      subscription: false,
    };
    try {
      user = await this.app.service('twitch/users').get(message.username);
    } catch (error) {
      console.error(
        'error requesting user...',
        error.message,
        message.username
      );
    }
    const created = await twitchChats.findOneAndUpdate(
      {
        id: message.id,
      },
      {
        $set: message,
      },
      {
        upsert: true,
      }
    );
    created.user = user;
    return created;
  }
}

module.exports = TwitchService;
