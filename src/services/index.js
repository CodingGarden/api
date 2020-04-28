const { FeathersError } = require('@feathersjs/errors');

const PledgeService = require('./patreon/pledges.service');
const MemberService = require('./youtube/members.service');
const StatsService = require('./youtube/stats.service');
const TwitchChatService = require('./twitch/chat.service');
const QuestionsService = require('./qna/questions.service');

const unAuthorizedMessage = 'Un-Authorized. 👮🚨 This event will be reported to the internet police. 🚨👮';
const notFoundMessage = '🤖 These are not the endpoints you are looking for. 🤖';

const internalOnly = async (context) => {
  if (!context.params.provider) return context;
  throw new FeathersError(unAuthorizedMessage, 'un-authorized', 401, 'UnAuthorizedError', null);
};

const verifyAPIKey = async (context) => {
  if (context.params.headers['X-API-KEY'] === process.env.CLIENT_API_KEY) return context;
  throw new FeathersError(unAuthorizedMessage, 'un-authorized', 401, 'UnAuthorizedError', null);
};

module.exports = function configure(app) {
  app.use('patreon/pledges', new PledgeService());
  app.use('youtube/stats', new StatsService(app));
  app.use('youtube/members', new MemberService(app));
  app.use('twitch/chat', new TwitchChatService(app));
  app.service('twitch/chat').hooks({
    before: {
      create: [internalOnly],
      remove: [internalOnly],
    },
  });
  app.use('qna/questions', new QuestionsService());
  app.service('qna/questions').hooks({
    before: {
      create: [verifyAPIKey],
      remove: [verifyAPIKey],
    },
  });
};
