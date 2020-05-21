const { FeathersError } = require('@feathersjs/errors');

const PledgeService = require('./patreon/pledges.service');
const MemberService = require('./youtube/members.service');
const StatsService = require('./youtube/stats.service');
const TwitchChatService = require('./twitch/chat.service');
const VoxPopuliService = require('./vox/populi.service');
const TwitchSubsService = require('./twitch/subs.service');

const unAuthorizedMessage = 'Un-Authorized. 👮🚨 This event will be reported to the internet police. 🚨👮';

const internalOnly = async (context) => {
  if (!context.params.provider) return context;
  throw new FeathersError(unAuthorizedMessage, 'un-authorized', 401, 'UnAuthorizedError', null);
};

const verifyAPIKey = async (context) => {
  if ((context.params.query && context.params.query.key === process.env.CLIENT_API_KEY)
  || context.params.headers['X-API-KEY'] === process.env.CLIENT_API_KEY) return context;
  throw new FeathersError(unAuthorizedMessage, 'un-authorized', 401, 'UnAuthorizedError', null);
};

module.exports = function configure(app) {
  const apiKeyFindHooks = {
    before: {
      find: [verifyAPIKey],
    }
  };
  app.use('patreon/pledges', new PledgeService());
  app.service('patreon/pledges').hooks(apiKeyFindHooks);
  app.use('youtube/stats', new StatsService(app));
  app.service('youtube/stats').hooks(apiKeyFindHooks);
  app.use('youtube/members', new MemberService(app));
  app.service('youtube/members').hooks(apiKeyFindHooks);
  app.use('twitch/subs', new TwitchSubsService());
  app.service('twitch/subs').hooks(apiKeyFindHooks);
  app.use('twitch/chat', new TwitchChatService(app));
  app.service('twitch/chat').hooks({
    before: {
      find: [verifyAPIKey],
      create: [internalOnly],
      remove: [internalOnly],
    },
  });
  app.use('vox/populi', new VoxPopuliService(app));
  app.service('vox/populi').hooks({
    before: {
      create: [internalOnly],
      remove: [verifyAPIKey],
    },
  });
};
