const PledgeService = require('./patreon/pledges.service');
const MemberService = require('./youtube/members.service');

module.exports = function configure(app) {
  app.use('patreon/pledges', new PledgeService());
  app.use('youtube/members', new MemberService(app));
  app.service('youtube/members').on('created', (data) => {
    console.log('created!', data);
  });
};
