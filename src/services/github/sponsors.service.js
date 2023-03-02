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
    if (!verifySecret(params.rawBody, params.headers['x-hub-signature-256'])) { throw new Error('Invalid signature.'); }
    this.data = this.data || (await getSponsors());
    if (body.action === 'created') {
      const { sponsor } = body.sponsorship;
      const info = {
        login: sponsor.login,
        avatarUrl: sponsor.avatarUrl,
      };
      const { sponsorship } = body;
      info.amount = sponsorship.tier.monthly_price_in_cents;
      info.private = sponsorship.privacy_level === 'PRIVATE';
      if (sponsorship.tier.is_one_time) {
        info.is_one_time = true;
      }
      return {
        action: 'created',
        info,
      };
    }
    return { message: 'OK' };
  }
}

module.exports = GithubSponsorsService;
