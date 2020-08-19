const { FeathersError } = require('@feathersjs/errors');

const PledgeService = require('./patreon/pledges.service');
const MemberService = require('./youtube/members.service');
const StatsService = require('./youtube/stats.service');
const TwitchChatService = require('./twitch/chat.service');
const VoxPopuliService = require('./vox/populi.service');
const TwitchSubsService = require('./twitch/subs.service');
const TwitchUsersService = require('./twitch/users.service');
const TwitchRewardsService = require('./twitch/rewards.service');
const TwitchLoginService = require('./twitch/login.service');
const TwitchCommandsService = require('./twitch/commands.service');

const unAuthorizedMessage = 'Un-Authorized. 👮🚨 This event will be reported to the internet police. 🚨👮';

const internalOnly = async (context) => {
  if (!context.params.provider) return context;
  throw new FeathersError(unAuthorizedMessage, 'un-authorized', 401, 'UnAuthorizedError', null);
};

const verifyAPIKey = async (context) => {
  if (!context.params.provider) return context;
  if ((context.params.query && context.params.query.key === process.env.CLIENT_API_KEY)
  || context.params.headers['X-API-KEY'] === process.env.CLIENT_API_KEY
  || context.params.apiKey === process.env.CLIENT_API_KEY) return context;
  throw new FeathersError(unAuthorizedMessage, 'un-authorized', 401, 'UnAuthorizedError', null);
};

module.exports = function configure(app) {
  const apiKeyFindHooks = {
    before: {
      get: [verifyAPIKey],
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
  app.use('twitch/rewards', new TwitchRewardsService(app));
  app.service('twitch/rewards').hooks({
    before: {
      find: [verifyAPIKey],
      patch: [verifyAPIKey],
      create: [internalOnly],
    },
  });
  app.use('twitch/chat', new TwitchChatService(app));
  app.service('twitch/chat').hooks({
    before: {
      find: [verifyAPIKey],
      patch: [verifyAPIKey],
      create: [internalOnly],
      remove: [internalOnly],
    },
  });
  app.use('twitch/commands', new TwitchCommandsService(app));
  app.service('twitch/commands').hooks({
    before: {
      find: [verifyAPIKey],
      patch: [verifyAPIKey],
      create: [internalOnly],
      remove: [internalOnly],
    },
  });
  app.use('twitch/users', new TwitchUsersService(app));
  app.service('twitch/users').hooks({
    before: {
      get: [verifyAPIKey],
      find: [verifyAPIKey],
      patch: [internalOnly],
      create: [internalOnly, (context) => context.event = null],
    },
  });
  app.use('vox/populi', new VoxPopuliService(app));
  app.service('vox/populi').hooks({
    before: {
      create: [internalOnly],
      remove: [verifyAPIKey],
    },
  });
  app.use('twitch/login', new TwitchLoginService(app));
};
