// @ts-check
const {
  youtubeCommands,
} = require('../../db');
const createCommandsService = require('../../lib/createCommandsService');

module.exports = createCommandsService({
  dbCollection: youtubeCommands,
  getUserService: (app) => app.service('youtube/users'),
  getUserQuery: ({ message, user }) => (user ? user.id : message.author_id),
  getIsModOrOwner: ({ message, question, user }) => user.is_chat_owner
    || user.is_chat_moderator
    || question.author_id === message.author_id
});
