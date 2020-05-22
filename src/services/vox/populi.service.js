/* eslint-disable class-methods-use-this */
const {
  twitchChats,
} = require('../../db');

class VoxPopuliService {
  constructor(app) {
    this.app = app;
    app.service('twitch/chat').on('created', (message) => {
      if (message.message.match(/^!(ask|idea|submit|comment|upvote)/)) {
        app.service('vox/populi').create(message);
      }
    });
  }

  async find() {
    const messages = await twitchChats.find({
      message: {
        $regex: /^!(ask|idea|submit|comment|upvote)/
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
    const questions = [];
    const ideas = [];
    const submissions = [];
    const upvotes = {};
    const comments = {};
    messages.forEach((message) => {
      const args = message.message.split(' ');
      const command = args.shift();
      if (command.match(/^!(ask|idea|submit)/)) {
        if (!message.num) return;
        comments[message.num] = comments[message.num] || [];
        upvotes[message.num] = upvotes[message.num] || [];
        message.comments = comments[message.num];
        message.upvotes = upvotes[message.num];
        const value = args.join(' ');
        message.content = value;
        if (command === '!ask') {
          message.type = 'questions';
          questions.push(message);
        } else if (command === '!idea') {
          message.type = 'ideas';
          ideas.push(message);
        } else if (command === '!submit') {
          message.type = 'submissions';
          submissions.push(message);
        }
      } else if (command.match(/^!(comment|upvote)/)) {
        const num = (args.shift() || '').replace('#', '');
        if (!num || isNaN(num)) return;
        if (command === '!comment') {
          message.content = args.join(' ');
          comments[num] = comments[num] || [];
          comments[num].push(message);
        } else if (command === '!upvote') {
          upvotes[num] = upvotes[num] || [];
          upvotes[num].push(message.display_name);
          upvotes[num] = [...new Set(upvotes[num])];
        }
      }
    });

    return {
      questions,
      ideas,
      submissions,
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
    return message;
  }
}

module.exports = VoxPopuliService;
