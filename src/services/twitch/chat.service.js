const { sub } = require('date-fns');
const {
  listenChats
} = require('./chat.functions');
const {
  twitchChats,
  counter,
} = require('../../db');
const getCountries = require('../../lib/getCountries');
const getBrands = require('../../lib/getBrands');

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
    if (params.query && (params.query.commands === 'false' || params.query.commands === false)) {
      query.message = {
        $regex: /^(?!\\!)\w+/,
      };
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
    const archiveQuestion = message.message.match(/^!archive\s+#?(\d+)$/);
    if (archiveQuestion) {
      const num = +archiveQuestion[1];
      const question = await twitchChats.findOne({
        num,
      });
      if (question && !question.archived && !question.deleted_at && (message.badges.moderator
        || message.badges.broadcaster
        || question.user_id === message.user_id)) {
        await this.app.service('vox/populi').remove(question._id);
      }
    } else if (message.message.match(/^!(ask|idea|submit)/)) {
      const count = await counter.findOneAndUpdate({
        name: 'question',
      }, {
        $inc: { value: 1 }
      }, {
        upsert: true,
      });
      message.num = count.value;
      const now = new Date();
      await this.app.service('twitch/users').patch(user.name, {
        last_seen: now,
      });
      user.last_seen = now;
    }
    const created = await twitchChats.findOneAndUpdate({
      id: message.id,
    }, {
      $set: message,
    }, {
      upsert: true,
    });
    if (message.message.match(/^!here$/)) {
      const now = new Date();
      await this.app.service('twitch/users').patch(user.name, {
        last_seen: now,
      });
      user.last_seen = now;
    } else if (message.message.match(/^!setstatus /)) {
      const args = (message.parsedMessage || message.message).split(' ');
      args.shift().slice(1);
      const status = args.join(' ');
      user.status = status;
      await this.app.service('twitch/users').patch(user.name, {
        status,
      });
    } else if (message.message.match(/^!clearstatus/)) {
      user.status = null;
      await this.app.service('twitch/users').patch(user.name, {
        status: null,
      });
    } else if (message.message.match(/^!(country|flag|team)/)) {
      const args = message.message.split(' ');
      const command = args.shift().slice(1);
      if (command === 'country' || command === 'flag') {
        const countryLookup = args.shift().toLowerCase();
        const countries = await getCountries();
        const country = countries.get(countryLookup);
        if (country) {
          user.country = country;
          await this.app.service('twitch/users').patch(user.name, {
            country,
          });
        }
      } else if (command === 'team') {
        const team = args.shift().toLowerCase();
        const brands = await getBrands();
        if (brands.has(team)) {
          user.team = team;
          await this.app.service('twitch/users').patch(user.name, {
            team,
          });
        }
      }
    }
    created.user = user;
    return created;
  }
}

module.exports = TwitchService;
