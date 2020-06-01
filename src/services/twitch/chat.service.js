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

  async find() {
    const messages = await twitchChats.find({
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
    }, {
      sort: {
        created_at: -1
      },
      limit: 100,
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
    const created = await twitchChats.findOneAndUpdate({
      id: message.id,
    }, {
      $set: message,
    }, {
      upsert: true,
    });
    const user = await this.app.service('twitch/users').get(message.username);
    if (message.message.match(/^!(country|flag|team)/)) {
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
