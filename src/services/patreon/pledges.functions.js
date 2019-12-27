const crypto = require('crypto');
const axios = require('axios');

const {
  PATREON_ACCESS_TOKEN: accessToken,
  PATREON_CAMPAIGN_ID: campaignId,
  PATREON_WEBHOOK_SECRET: webhookSecret,
} = process.env;

const API_BASE = 'https://www.patreon.com/api/oauth2/api';

function addPledge(item, pledgesByUserId, rewardIdsByCost) {
  const { attributes: { amount_cents, created_at, }, relationships, } = item;
  const level = {
    amount_cents,
    created_at,
    level_id: relationships.reward ? relationships.reward.data.id : null,
  };
  pledgesByUserId[item.relationships.patron.data.id] = level;
  rewardIdsByCost[amount_cents] = rewardIdsByCost[amount_cents] || null;
  if (level.level_id) {
    rewardIdsByCost[amount_cents] = level.level_id;
  }
}

function addReward(item, rewardsById) {
  if (item.relationships && item.relationships.campaign.data.id === campaignId) {
    rewardsById[item.id] = item.attributes.title;
  }
}

function addUser(item, pledgesByUserId, users) {
  const { attributes: { first_name: name, }, id } = item;
  const user = {
    id,
    name,
    level: pledgesByUserId[item.id],
  };
  users[id] = user;
}

async function getPledges({
  pledgesByUserId = {},
  rewardsById = {},
  rewardIdsByCost = {},
  users = {},
}) {
  let url = `${API_BASE}/campaigns/${campaignId}/pledges?include=patron.null`;
  while (url) {
    // eslint-disable-next-line
    const { data } = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    data.data.forEach((item) => {
      if (item.type === 'pledge' && item.attributes.declined_since === null) {
        addPledge(item, pledgesByUserId, rewardIdsByCost);
      }
    });
    data.included.forEach((item) => {
      if (item.type === 'reward') {
        addReward(item, rewardsById);
      } else if (item.type === 'user' && pledgesByUserId[item.id]) {
        addUser(item, pledgesByUserId, users);
      }
    });
    url = data.links.next;
  }

  Object.values(users).forEach((user) => {
    user.level.level_id = user.level.level_id || rewardIdsByCost[user.level.amount_cents];
  });

  return {
    pledgesByUserId,
    rewardsById,
    rewardIdsByCost,
    users,
  };
}

function verifySecret(body, signature) {
  try {
    const hash = crypto.createHmac('md5', webhookSecret).update(body).digest('hex');
    return signature === hash;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = {
  addPledge,
  addReward,
  addUser,
  getPledges,
  verifySecret,
};
