/* eslint-disable eqeqeq */
/* eslint-disable class-methods-use-this */
const {
  twitchCommands,
} = require('../../db');

const voxRegex = /^!(ask|idea|submit|comment|upvote)/;
const topLevelRegex = /^!(ask|idea|submit)/;
const commentUpvoteRegex = /^!(comment|upvote)/;

class VoxPopuliService {
  constructor(app) {
    this.app = app;
    app.service('twitch/commands').on('created', (message) => {
      if (message.message.match(voxRegex)) {
        app.service('vox/populi').create(message);
      }
    });
  }

  async find() {
    if (this.data) return this.data;
    this.data = await this.getVox();
    this.allByNum = {};
    this.data.questions.forEach((question) => this.allByNum[question.num] = question);
    this.data.ideas.forEach((idea) => this.allByNum[idea.num] = idea);
    this.data.submissions.forEach((submission) => this.allByNum[submission.num] = submission);
    this.usersById = this.data.users.reduce((byId, user) => {
      byId[user.id] = user;
      return byId;
    }, {});
    return this.data;
  }

  async getVox() {
    const messages = await twitchCommands.find({
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
      const args = (message.parsedMessage || message.message).split(' ');
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
        // eslint-disable-next-line no-restricted-globals
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
    const message = await twitchCommands.findOneAndUpdate({
      _id,
    }, {
      $set: {
        archived: true,
      }
    });
    if (message) {
      delete this.allByNum[message.num];
      this.data.questions = this.data.questions.filter((item) => item._id != _id);
      this.data.ideas = this.data.ideas.filter((item) => item._id != _id);
      this.data.submissions = this.data.submissions.filter((item) => item._id != _id);
      return message;
    }
    throw new Error('Not found.');
  }

  async create(message) {
    if (this.data) {
      if (!this.usersById[message.user.id]) {
        this.data.users.push(message.user);
      }
      this.usersById[message.user.id] = message.user;
      const args = (message.parsedMessage || message.message).split(' ');
      const command = args.shift();
      if (command.match(/^!(ask|idea|submit)/) && message.num) {
        const value = args.join(' ');
        message.content = value;
        message.comments = [];
        message.upvotes = [];
        message.upvote_count = 0;
        this.allByNum[message.num] = message;
        if (command === '!ask') {
          this.data.questions.push(message);
        } else if (command === '!idea') {
          this.data.ideas.push(message);
        } else if (command === '!submit') {
          this.data.submissions.push(message);
        }
      } else if (command.match(/^!(comment|upvote)/)) {
        const num = (args.shift() || '').replace('#', '');
        if (num && !isNaN(num) && this.allByNum[num]) {
          if (command === '!comment') {
            message.content = args.join(' ');
            this.allByNum[num].comments.push(message);
          } else if (command === '!upvote') {
            this.allByNum[num].upvotes.push(message.username);
            this.allByNum[num].upvotes = [...new Set(this.allByNum[num].upvotes)];
          }
        }
      }
    }
    return message;
  }
}

module.exports = VoxPopuliService;
