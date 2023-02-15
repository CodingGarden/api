const axios = require('axios');

const {
  PATREON_DEVICE_ID: patreonDeviceId,
  PATREON_SESSION_ID: patreonSessionId,
} = process.env;

const API_BASE = 'https://www.patreon.com/api/';

function addPledge(item, pledgesByUserId, rewardIdsByCost) {
  const { attributes: { pledge_amount_cents: amount_cents, }, relationships, } = item;
  const level = {
    amount_cents,
    level_id: relationships.reward ? relationships.reward.data.id : null,
  };
  pledgesByUserId[relationships.user.data.id] = level;
  rewardIdsByCost[amount_cents] = rewardIdsByCost[amount_cents] || null;
  if (level.level_id) {
    rewardIdsByCost[amount_cents] = level.level_id;
  }
}

function addReward(item, rewardsById) {
  rewardsById[item.id] = item;
}

function addUser(item, pledgesByUserId, users) {
  const { attributes: { full_name: name, }, id } = item;
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
  let url = `${API_BASE}/members?include=user,reward,latest_pledge.campaign,address,follow-setting&${encodeURIComponent('fields[campaign]')}=is_anniversary_billing&${encodeURIComponent('fields[follow_settings]')}=shipping_opt_out&${encodeURIComponent('fields[member]')}=access_expires_at,reward_id,pledge_amount_cents,pledge_cap_amount_cents,pledge_cadence,pledge_relationship_start,pledge_relationship_end,last_charge_date,last_charge_status,next_charge_date,patron_status,is_follower,is_free_trial,note,currency,email,campaign_currency,campaign_pledge_amount_cents,campaign_lifetime_support_cents,is_reward_fulfilled,discord_vanity&${encodeURIComponent('fields[user]')}=full_name,thumb_url,url&${encodeURIComponent('fields[reward]')}=requires_shipping,description,amount_cents,currency,title,discord_role_ids&${encodeURIComponent('fields[pledge]')}=amount_cents,cadence,currency&${encodeURIComponent('filter[timezone]')}=America/Denver&${encodeURIComponent('filter[membership_type]')}=active_patron&${encodeURIComponent('filter[campaign_id]')}=1192685&sort=&${encodeURIComponent('page[offset]')}=0&${encodeURIComponent('page[count]')}=50&json-api-use-default-includes=false&json-api-version=1.0`;
  while (url) {
    // eslint-disable-next-line
    const { data } = await axios.get(url, {
      headers: {
        Cookie: `patreon_device_id=${patreonDeviceId}; patreon_location_country_code=US; patreon_locale_code=en-US; session_id=${patreonSessionId};`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/111.0',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Referer: 'https://www.patreon.com/members',
        'Content-Type': 'application/vnd.api+json',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        DNT: '1',
        'Sec-GPC': '1',
        TE: 'trailers',
      }
    });

    data.data.forEach((item) => {
      if (item.type === 'member') {
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

module.exports = {
  addPledge,
  addReward,
  addUser,
  getPledges,
};
