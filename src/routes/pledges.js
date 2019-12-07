const express = require('express');
const axios = require('axios');

const router = express.Router();

const {
  PATREON_ACCESS_TOKEN: accessToken,
  PATREON_CAMPAIGN_ID: campaignId
} = process.env;

router.get('/', async (req, res, next) => {
  try {
    const { sort } = req.query;
    let url = `https://www.patreon.com/api/oauth2/api/campaigns/${campaignId}/pledges?include=patron.null`;
    const pledgesByUserId = {};
    const rewardsById = {};
    const rewardIdsByCost = {};
    const users = [];
    while (url) {
    // eslint-disable-next-line
    const { data } = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      data.data.forEach((item) => {
        if (item.type === 'pledge' && item.attributes.declined_since === null) {
          const {
            attributes: {
              amount_cents,
              created_at,
            },
            relationships,
          } = item;
          const pledge = {
            amount_cents,
            created_at,
            reward_id: relationships.reward ? relationships.reward.data.id : null,
          };
          pledgesByUserId[item.relationships.patron.data.id] = pledge;
          rewardIdsByCost[amount_cents] = rewardIdsByCost[amount_cents] || null;
          if (pledge.reward_id) {
            rewardIdsByCost[amount_cents] = pledge.reward_id;
          }
        }
      });
      data.included.forEach((item) => {
        if (item.type === 'reward') {
          if (item.relationships && item.relationships.campaign.data.id === campaignId) {
            rewardsById[item.id] = item.attributes.title;
          }
        } else if (item.type === 'user' && pledgesByUserId[item.id]) {
          const {
            attributes: {
              first_name: name,
            }
          } = item;
          const user = {
            name,
            pledge: pledgesByUserId[item.id],
          };
          users.push(user);
        }
      });
      url = data.links.next;
    }

    users.forEach((user) => {
      user.pledge.reward_id = user.pledge.reward_id || rewardIdsByCost[user.pledge.amount_cents];
    });

    users.sort((a, b) => {
      if (sort === 'amount') {
        const priceDiff = b.pledge.amount_cents - a.pledge.amount_cents;
        if (priceDiff !== 0) return priceDiff;
      }
      return new Date(a.pledge.created_at) - new Date(b.pledge.created_at);
    });

    res.json({ users, rewards: rewardsById });
  } catch (error) {
    res.status(500);
    next(error);
  }
});

module.exports = router;
