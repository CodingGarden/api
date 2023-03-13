/* eslint-disable eqeqeq */
/* eslint-disable class-methods-use-this */
const { sub } = require('date-fns');

const {
  twitchCommands,
  youtubeCommands,
} = require('../../db');

const voxRegex = /^!(ask|idea|submit|comment|upvote)/;
const eventRegex = /^!(ask|idea|submit|comment|upvote|archive)/;
const topLevelRegex = /^!(ask|idea|submit)/;
const commentUpvoteRegex = /^!(comment|upvote)/;

class VoxPopuliService {
  constructor(app) {
    this.app = app;
    app.service('twitch/commands').on('created', (message) => {
      if (message && message.message && message.message.match(eventRegex)) {
        app.service('vox/populi').create(message);
      }
    });
    app.service('youtube/commands').on('created', (message) => {
      if (message && message.message && message.message.match(eventRegex)) {
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
    const query = {
      id: {
        $ne: null,
      },
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
        // $gt: new Date('2020-05-20'),
        $gte: sub(new Date(), {
          days: 1,
        }),
      },
    };
    // TODO: show youtube commands in vox
    const twitchMessages = await twitchCommands.find(query);
    const youtubeMessages = await youtubeCommands.find(query);
    const messages = twitchMessages.concat(youtubeMessages);
    const twitchNames = [...new Set(twitchMessages.map((message) => message.username))];
    const twitchUsers = await this.app.service('twitch/users').find({
      query: {
        names: twitchNames,
      }
    });
    const youtubeIds = [...new Set(youtubeMessages.map((message) => message.author_id))];
    const youtubeUsers = await this.app.service('youtube/users').find({
      query: {
        ids: youtubeIds,
      }
    });
    const users = twitchUsers.concat(youtubeUsers);
    const questions = [];
    const ideas = [];
    const submissions = [];
    const upvotes = {};
    const comments = {};
    messages.forEach((message) => {
      if (message.author_handle) {
        message.platform = 'youtube';
      }
      const args = (message.parsedMessage || message.message).split(' ');
      const command = args.shift();
      if (command.match(topLevelRegex)) {
        if (!message.num) return;
        const value = args.join(' ');
        if (!value.trim()) return;
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
          upvotes[num].push(message.author_handle || message.username);
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
    const twitchMessage = await twitchCommands.findOneAndUpdate({
      _id,
    }, {
      $set: {
        archived: true,
      }
    });
    const youtubeMessage = await youtubeCommands.findOneAndUpdate({
      _id,
    }, {
      $set: {
        archived: true,
      }
    });
    const message = twitchMessage || youtubeMessage;
    if (message) {
      delete this.allByNum[message.num];
      this.data.questions = this.data.questions.filter((item) => item._id.toString() != _id);
      this.data.ideas = this.data.ideas.filter((item) => item._id.toString() != _id);
      this.data.submissions = this.data.submissions.filter((item) => item._id.toString() != _id);
      return message;
    }
    throw new Error('Not found.');
  }

  async patch(id, updates) {
    const twitchPatched = await this.app
      .service('twitch/commands')
      .patch(id, updates);
    const youtubePatched = await this.app
      .service('youtube/commands')
      .patch(id, updates);
    const patched = twitchPatched || youtubePatched;
    if (patched.num) {
      this.allByNum[patched.num] = patched;
    }
    return patched;
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
        if (!this.allByNum[message.num]) {
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
        }
      } else if (command.match(/^!(comment|upvote)/)) {
        const num = (args.shift() || '').replace('#', '');
        // eslint-disable-next-line no-restricted-globals
        if (num && !isNaN(num) && this.allByNum[num]) {
          if (command === '!comment') {
            message.content = args.join(' ');
            this.allByNum[num].comments.push(message);
          } else if (command === '!upvote') {
            this.allByNum[num].upvotes.push(message.author_handle || message.username);
            this.allByNum[num].upvotes = [...new Set(this.allByNum[num].upvotes)];
          }
        }
      }
    }
    return message;
  }
}

module.exports = VoxPopuliService;
