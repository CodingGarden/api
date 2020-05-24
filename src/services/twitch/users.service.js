/* eslint-disable no-await-in-loop */
const {
  getUserSubscription,
  getUserFollow,
  getUsers,
} = require('../../lib/twitchAPI');
const {
  twitchUsers,
} = require('../../db');

const {
  TWITCH_CHANNEL_ID: channelId
} = process.env;

const cacheTime = 30 * 60 * 60 * 1000;
const cache = new Map();

class TwitchUsersService {
  constructor(app) {
    this.app = app;
  }

  async get(name) {
    const cachedUser = cache.get(name);
    if (cachedUser && cachedUser.time > Date.now() - cacheTime) {
      return cachedUser.user;
    }
    try {
      const [updatedUser] = await getUsers(name);
      const createdUser = await this.create(updatedUser);
      cache.set(name, {
        time: Date.now(),
        user: createdUser,
      });
      return createdUser;
    } catch (error) {
      throw new Error('Not Found');
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
      if (notFound.length) {
        let updatedUsers = [];
        while (notFound.length > 0) {
          const next100 = notFound.slice(0, 100);
          const results = await getUsers(...next100);
          updatedUsers = updatedUsers.concat(results);
          notFound = notFound.slice(next100.length);
        }
        createdUsers = await Promise.all(
          updatedUsers.map((user) => this.create(user))
        );
        createdUsers.forEach((user) => {
          cache.set(user.name, {
            time: Date.now(),
            user,
          });
        });
      }
      return users.concat(createdUsers);
    } catch (error) {
      throw new Error('Not Found');
    }
  }

  async create(user) {
    user.id = user._id;
    delete user._id;
    const follow = await getUserFollow(user.id, channelId);
    user.follow = follow;
    user.subscription = false;
    const subscription = await this.app.service('twitch/subs').get(user.id);
    if (subscription) {
      user.subscription = {
        sub_plan: subscription.level.level_id,
        created_at: subscription.level.created_at
      };
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
