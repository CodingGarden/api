// @ts-check
const {
  twitchCommands,
} = require('../../db');
const createCommandsService = require('../../lib/createCommandsService');

module.exports = createCommandsService({
  dbCollection: twitchCommands,
  getUserService: (app) => app.service('twitch/users'),
  getUserQuery: ({ message, user }) => (user ? user.name : message.username),
  getIsModOrOwner: ({ message, question }) => !!(message.badges.moderator
    || message.badges.broadcaster
    || question.user_id === message.user_id)
});
