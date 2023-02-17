const crypto = require('crypto');
const { getSponsors } = require('./sponsors.functions');

function verifySecret(body, signature) {
  try {
    const hash = crypto
      .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');
    return signature === `sha256=${hash}`;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

class GithubSponsorsService {
  constructor() {
    this.data = null;
  }

  async find() {
    this.data = this.data || (await getSponsors());
    return this.data;
  }

  async create(body, params) {
    console.log(JSON.stringify(body, null, 2));
    if (!verifySecret(params.rawBody, params.headers['x-hub-signature-256'])) { throw new Error('Invalid signature.'); }
    const { monthlySponsors } = this.data;
    this.data = await getSponsors();
    const monthlySponsorLogins = new Set(monthlySponsors.map((s) => s.login));
    const newMonthly = this.data.monthlySponsors.find(
      (sponsor) => !monthlySponsorLogins.has(sponsor.login)
    );
    // TODO: parse incoming body; alert on new one time sponsor
    return newMonthly || { message: 'OK' };
  }
}

module.exports = GithubSponsorsService;
