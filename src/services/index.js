const PledgeService = require('./pledges');

module.exports = function configure(app) {
  app.use('pledges', new PledgeService());
};
