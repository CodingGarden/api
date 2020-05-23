/* eslint-disable class-methods-use-this */
const {
  twitchChats,
} = require('../../db');

const voxRegex = /^!(ask|idea|submit|comment|upvote)/;
const topLevelRegex = /^!(ask|idea|submit)/;
const commentUpvoteRegex = /^!(comment|upvote)/;

class VoxPopuliService {
  constructor(app) {
    this.app = app;
    app.service('twitch/chat').on('created', (message) => {
      if (message.message.match(voxRegex)) {
        app.service('vox/populi').create(message);
      }
    });
  }

  async find() {
    const messages = await twitchChats.find({
      message: {
        $regex: voxRegex,
      },
      deleted_at: {
        $eq: null,
      },
      archived: {
        $ne: true,
      },
      created_at: {
        $gt: new Date('2020-05-20'),
      },
    });
    const names = [...new Set(messages.map((user) => user.username))];
    const users = await this.app.service('twitch/users').find({
      query: {
        names,
      }
    });
    const questions = [];
    const ideas = [];
    const submissions = [];
    const upvotes = {};
    const comments = {};
    messages.forEach((message) => {
      const args = message.message.split(' ');
      const command = args.shift();
      if (command.match(topLevelRegex)) {
        if (!message.num) return;
        const value = args.join(' ');
        message.content = value;
        if (command === '!ask') {
          questions.push(message);
        } else if (command === '!idea') {
          ideas.push(message);
        } else if (command === '!submit') {
          submissions.push(message);
        }
      } else if (command.match(commentUpvoteRegex)) {
        const num = (args.shift() || '').replace('#', '');
        if (!num || isNaN(num)) return;
        if (command === '!comment') {
          message.content = args.join(' ');
          comments[num] = comments[num] || [];
          comments[num].push(message);
        } else if (command === '!upvote') {
          upvotes[num] = upvotes[num] || [];
          upvotes[num].push(message.username);
          upvotes[num] = [...new Set(upvotes[num])];
        }
      }
    });

    const setProps = (item) => {
      item.comments = comments[item.num] || [];
      item.upvotes = upvotes[item.num] || [];
    };

    questions.forEach(setProps);
    ideas.forEach(setProps);
    submissions.forEach(setProps);

    return {
      questions,
      ideas,
      submissions,
      users,
    };
  }

  async remove(_id) {
    const message = await twitchChats.findOneAndUpdate({
      _id,
    }, {
      $set: {
        archived: true,
      }
    });
    if (message) {
      return message;
    }
    throw new Error('Not found.');
  }

  async create(message) {
    const user = await this.app.service('twitch/users').get(message.username);
    message.user = user;
    return message;
  }
}

module.exports = VoxPopuliService;
