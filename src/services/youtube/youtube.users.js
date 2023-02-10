/* eslint-disable no-await-in-loop */
const {
  getUsers,
  getChannelMeta,
} = require('../../lib/youtubeAPI');
const {
  getModerators
} = require('./members.functions');
const {
  youtubeUsers,
} = require('../../db');

const cacheTime = 30 * 60 * 1000;
const existingCacheTime = 10 * 60 * 1000;
const cache = new Map();

class YouTubeUsersService {
  constructor(app) {
    this.app = app;
  }

  async get(id) {
    const cachedUser = cache.get(id);
    if (cachedUser && cachedUser.time > Date.now() - cacheTime) {
      return cachedUser.user;
    }
    try {
      const [updatedUser] = await getUsers(id);
      if (updatedUser) {
        const createdUser = await this.create(updatedUser);
        cache.set(id, {
          time: Date.now(),
          user: createdUser,
        });
        return createdUser;
      }
      return {
        _id: 'not-found',
        id: 'not-found',
        display_name: 'not-found',
        logo: 'https://cdn.discordapp.com/attachments/639685013964849182/716027585594785852/unknown.png',
        created_at: new Date(),
        updated_at: new Date(),
        membership: null,
        is_verified: false,
        is_chat_owner: false,
        is_chat_moderator: false,
      };
    } catch (error) {
      console.error(error.response ? error.response.data : error);
      throw new Error('Not Found', error.message);
    }
  }

  async find(params) {
    const { ids = [], moderators, nocache = 'false' } = params.query || {};
    if (moderators) {
      return getModerators(nocache === 'false');
    }
    let notFound = [];
    const users = [];
    ids.forEach((id) => {
      const cachedUser = cache.get(id);
      if (cachedUser && cachedUser.time > Date.now() - cacheTime) {
        users.push(cachedUser.user);
      } else {
        notFound.push(id);
      }
    });
    try {
      let createdUsers = [];
      const existingUsers = [];
      if (notFound.length) {
        while (notFound.length > 0) {
          const next50 = notFound.slice(0, 50);
          const dbUsers = await youtubeUsers.find({
            id: {
              $in: next50,
            },
          });
          console.log(dbUsers.length, 'already in db...');
          const notInDb = new Set(next50);
          // eslint-disable-next-line no-loop-func
          dbUsers.forEach((user) => {
            notInDb.delete(user.id);
            existingUsers.push(user);
            cache.set(user.id, {
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
          notFound = notFound.slice(next50.length);
        }
        createdUsers = await Promise.all(
          createdUsers.map((user) => this.create(user))
        );
        createdUsers.forEach((user) => {
          cache.set(user.id, {
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

  async patch(id, updates) {
    await this.get(id);
    const updatedUser = await youtubeUsers.findOneAndUpdate({
      id,
    }, {
      $set: updates,
    }, {
      upsert: true,
    });

    const cachedUser = cache.get(id);

    if (cachedUser) {
      cache.set(id, {
        time: cachedUser.time,
        user: Object.assign(cachedUser.user, updatedUser),
      });
    }

    return updatedUser;
  }

  async create(user) {
    user.is_chat_owner = user.id === process.env.YOUTUBE_CHANNEL_ID;
    const members = await this.app.service('youtube/members').find();
    user.membership = members.find((member) => member.id === user.id);
    const channel = await getChannelMeta(user.id);
    user.is_verified = channel ? channel.approval === 'Verified' : null;
    user.handle = channel ? channel.about.handle : null;
    const moderatorsById = await this.find({
      query: {
        moderators: true
      }
    });
    user.is_chat_moderator = user.is_chat_owner || !!moderatorsById[user.id];
    const createdUser = await youtubeUsers.findOneAndUpdate({
      id: user.id,
    }, {
      $set: user,
    }, {
      upsert: true,
    });
    return createdUser;
  }
}

module.exports = YouTubeUsersService;
