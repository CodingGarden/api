/* eslint-disable no-await-in-loop */
const {
  getUserFollow,
  getUsers,
} = require('../../lib/twitchAPI');
const {
  getModerators,
} = require('./chat.functions');
const {
  twitchUsers,
} = require('../../db');

const {
  TWITCH_CHANNEL_ID: channelId
} = process.env;

const cacheTime = 30 * 60 * 1000;
const existingCacheTime = 10 * 60 * 1000;
const cache = new Map();

class TwitchUsersService {
  constructor(app) {
    this.app = app;
  }

  async get(name) {
    if (name === 'moderator') {
      return getModerators();
    }
    const cachedUser = cache.get(name);
    if (cachedUser && cachedUser.time > Date.now() - cacheTime) {
      return cachedUser.user;
    }
    try {
      const [updatedUser] = await getUsers(name);
      if (updatedUser) {
        const createdUser = await this.create(updatedUser);
        cache.set(name, {
          time: Date.now(),
          user: createdUser,
        });
        return createdUser;
      }
      return {
        id: 'not-found',
        name: 'not-found',
        display_name: 'not-found',
        logo: 'https://cdn.discordapp.com/attachments/639685013964849182/716027585594785852/unknown.png',
        follow: false,
        subscription: false,
      };
    } catch (error) {
      console.error(error.response ? error.response.data : error);
      throw new Error('Not Found', error.message);
    }
  }

  async find(params) {
    const { names = [] } = params.query;
    let notFound = [];
    const users = [];
    names.forEach((name) => {
      const cachedUser = cache.get(name);
      if (cachedUser && cachedUser.time > Date.now() - cacheTime) {
        users.push(cachedUser.user);
      } else {
        notFound.push(name);
      }
    });
    try {
      let createdUsers = [];
      const existingUsers = [];
      if (notFound.length) {
        while (notFound.length > 0) {
          const next100 = notFound.slice(0, 100);
          const dbUsers = await twitchUsers.find({
            name: {
              $in: next100,
            },
          });
          console.log(dbUsers.length, 'already in db...');
          const notInDb = new Set(next100);
          // eslint-disable-next-line no-loop-func
          dbUsers.forEach((user) => {
            notInDb.delete(user.name);
            existingUsers.push(user);
            cache.set(user.name, {
              time: Date.now() - existingCacheTime,
              user,
            });
          });
          const remaining = [...notInDb];
          if (remaining.length) {
            console.log(remaining.length, 'users not in db...');
            const results = await getUsers(...remaining);
            createdUsers = createdUsers.concat(results);
          }
          notFound = notFound.slice(next100.length);
        }
        createdUsers = await Promise.all(
          createdUsers.map((user) => this.create(user))
        );
        createdUsers.forEach((user) => {
          cache.set(user.name, {
            time: Date.now(),
            user,
          });
        });
      }
      return users.concat(createdUsers).concat(existingUsers);
    } catch (error) {
      throw new Error('Not Found');
    }
  }

  async patch(name, updates) {
    await this.get(name);
    const updatedUser = await twitchUsers.findOneAndUpdate({
      name,
    }, {
      $set: updates,
    }, {
      upsert: true,
    });

    const cachedUser = cache.get(name);

    if (cachedUser) {
      cache.set(name, {
        time: cachedUser.time,
        user: Object.assign(cachedUser.user, updatedUser),
      });
    }

    return updatedUser;
  }

  async create(user) {
    user.id = user._id;
    delete user._id;
    const follow = await getUserFollow(user.id, channelId);
    user.follow = follow;
    user.subscription = false;
    try {
      const subscription = await this.app.service('twitch/subs').get(user.id);
      if (subscription) {
        user.subscription = {
          sub_plan: subscription.level.level_id,
          created_at: subscription.level.created_at
        };
      }
    } catch(error) {
      console.log('error retrieving subs...', error.message, user);
    }
    const createdUser = await twitchUsers.findOneAndUpdate({
      name: user.name,
    }, {
      $set: user,
    }, {
      upsert: true,
    });
    return createdUser;
  }
}

module.exports = TwitchUsersService;
