const axios = require('axios');

const {
  key,
  externalChannelId,
  context,
  headers,
  referrer,
} = require('./members.config');

const studioBaseURL = 'https://studio.youtube.com/youtubei/v1';

async function getChannelFacts() {
  const {
    data
  } = await axios.post(`${studioBaseURL}/creator/get_channel_dashboard?alt=json&key=${key}`, {
    dashboardParams: {
      channelId: externalChannelId,
      factsAnalyticsParams: {
        nodes: [{
          key: 'DASHBOARD_FACT_ANALYTICS_LIFETIME_SUBSCRIBERS',
          value: {
            query: {
              dimensions: [],
              metrics: [{
                type: 'SUBSCRIBERS_NET_CHANGE'
              }],
              restricts: [{
                dimension: {
                  type: 'USER'
                },
                inValues: [externalChannelId]
              }],
              orders: [],
              timeRange: {
                unboundedRange: {}
              },
              currency: 'USD',
              returnDataInNewFormat: true,
              limitedToBatchedData: false
            }
          }
        }],
        connectors: []
      },
      videoSnapshotAnalyticsParams: {
        nodes: [],
        connectors: []
      },
      cardProducerTimeout: 'CARD_PRODUCER_TIMEOUT_SHORT'
    },
    context,
  }, {
    headers,
    referrer,
  });
  let info = null;
  data.cards.find((card) => {
    info = card.body.basicCard.item.channelFactsItem.channelFactsData.results.find((result) => result.key === 'DASHBOARD_FACT_ANALYTICS_LIFETIME_SUBSCRIBERS');
    return info;
  });
  const subscribers = info.value.resultTable.metricColumns[0].counts.values[0];
  return {
    subscribers,
  };
}

async function getMemberData() {
  const {
    data
  } = await axios.post(`${studioBaseURL}/sponsors/creator_sponsorships_data?alt=json&key=${key}`, {
    context,
    externalChannelId,
    mask: {
      sponsorshipsTierData: {
        all: true,
      },
      sponsorsData: {
        all: true,
      },
    },
    sponsorsOptions: {
      pageSize: 100,
      filter: {},
    },
  }, {
    headers,
    referrer,
  });
  return {
    tiers: data.sponsorshipsData.sponsorshipsTierData.tiers,
    memberData: data.sponsorshipsData.sponsorsData.sponsors,
  };
}

async function getChannelData(channelIds) {
  const {
    data
  } = await axios.post(`${studioBaseURL}/creator/get_creator_channels?alt=json&key=${key}`, {
    context,
    channelIds,
    mask: {
      channelId: true,
      title: true,
    },
  }, {
    headers,
    referrer,
  });
  return data.channels;
}

const reduceById = (prop) => (byId, item) => {
  byId[item[prop]] = item;
  return byId;
};

const daysToMilliseconds = (days) => (60 * 60 * 24 * days * 1000);
const emojiRegex = new RegExp(['💧', '🌻', '💩', '🥑', '🚜'].join('|'), 'g');

async function getMembers() {
  const {
    tiers,
    memberData
  } = await getMemberData();
  const channelData = await getChannelData(memberData.map((m) => m.externalChannelId));
  const channelsById = channelData.reduce(reduceById('channelId'), {});
  const tiersById = tiers.reduce(reduceById('id'), {});
  const usersById = {};
  const users = memberData.map((member) => {
    const tier = tiersById[member.tierId];
    const user = {
      id: member.externalChannelId,
      name: channelsById[member.externalChannelId].title.split(' ')[0],
      level: {
        level_id: tier.id,
        amount_cents: tier.pricingLevelId / 10000,
        created_at: new Date(Date.now() - daysToMilliseconds(member.durationAtCurrentTier.amount)),
      },
    };
    usersById[member.externalChannelId] = user;
    return user;
  });
  return {
    users,
    usersById,
    levels: tiers.reduce((all, tier) => {
      all[tier.id] = tier.liveVersion.name.replace(emojiRegex, '').trim();
      return all;
    }, {}),
  };
}

module.exports = {
  getMembers,
  getChannelFacts,
};
