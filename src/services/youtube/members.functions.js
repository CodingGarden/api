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
        nodes: [
          {
            key: 'DASHBOARD_FACT_ANALYTICS_CURRENT',
            value: {
              query: {
                dimensions: [],
                metrics: [
                  { type: 'VIEWS' },
                  { type: 'WATCH_TIME' },
                  { type: 'TOTAL_ESTIMATED_EARNINGS' },
                  { type: 'SUBSCRIBERS_NET_CHANGE' }
                ],
                restricts: [
                  {
                    dimension: { type: 'USER' },
                    inValues: [externalChannelId]
                  }
                ],
                orders: [],
                timeRange: {
                  dateIdRange: {
                    inclusiveStart: 20230112,
                    exclusiveEnd: 20230209
                  }
                },
                currency: 'USD',
                returnDataInNewFormat: true,
                limitedToBatchedData: false,
                useMultiFormatArtistAnalytics: false
              }
            }
          },
          {
            key: 'TOP_VIDEOS',
            value: {
              query: {
                dimensions: [{ type: 'VIDEO' }],
                metrics: [{ type: 'VIEWS' }],
                restricts: [
                  {
                    dimension: { type: 'USER' },
                    inValues: [externalChannelId]
                  }
                ],
                orders: [
                  {
                    metric: { type: 'VIEWS' },
                    direction: 'ANALYTICS_ORDER_DIRECTION_DESC'
                  }
                ],
                timeRange: {
                  unixTimeRange: {
                    inclusiveStart: '1675818000',
                    exclusiveEnd: '1675990800'
                  }
                },
                limit: { pageSize: 3, pageOffset: 0 },
                returnDataInNewFormat: true,
                limitedToBatchedData: false,
                useMultiFormatArtistAnalytics: false
              }
            }
          },
          {
            key: 'DASHBOARD_FACT_ANALYTICS_LIFETIME_SUBSCRIBERS',
            value: {
              query: {
                dimensions: [],
                metrics: [{ type: 'SUBSCRIBERS_NET_CHANGE' }],
                restricts: [
                  {
                    dimension: { type: 'USER' },
                    inValues: [externalChannelId]
                  }
                ],
                orders: [],
                timeRange: { unboundedRange: {} },
                currency: 'USD',
                returnDataInNewFormat: true,
                limitedToBatchedData: false,
                useMultiFormatArtistAnalytics: false
              }
            }
          },
          {
            key: 'DASHBOARD_FACT_ANALYTICS_TYPICAL',
            value: {
              getTypicalPerformance: {
                query: {
                  metrics: [
                    { metric: { type: 'VIEWS' } },
                    { metric: { type: 'WATCH_TIME' } },
                    { metric: { type: 'TOTAL_ESTIMATED_EARNINGS' } }
                  ],
                  externalChannelId,
                  timeRange: {
                    dateIdRange: {
                      inclusiveStart: 20230112,
                      exclusiveEnd: 20230209
                    }
                  },
                  type: 'TYPICAL_PERFORMANCE_TYPE_NORMAL',
                  entityType: 'TYPICAL_PERFORMANCE_ENTITY_TYPE_CHANNEL',
                  currency: 'USD'
                }
              }
            }
          },
          {
            key: 'TOP_VIDEOS_VIDEO',
            value: {
              getCreatorVideos: {
                mask: {
                  videoId: true,
                  title: true,
                  permissions: { all: true }
                }
              }
            }
          }
        ],
        connectors: [
          {
            extractorParams: {
              resultKey: 'TOP_VIDEOS',
              resultTableExtractorParams: { dimension: { type: 'VIDEO' } }
            },
            fillerParams: {
              targetKey: 'TOP_VIDEOS_VIDEO',
              idFillerParams: {}
            }
          }
        ]
      },
      videoSnapshotAnalyticsParams: {
        nodes: [
          {
            key: 'VIDEO_SNAPSHOT_DATA_QUERY',
            value: {
              getVideoSnapshotData: {
                externalChannelId,
                catalystType: 'CATALYST_ANALYSIS_TYPE_RECENT_VIDEO_PERFORMANCE',
                showCtr: true
              }
            }
          }
        ],
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
  data.cards.forEach((card) => {
    if (card.id === 'facts') {
      info = card.body.basicCard.item.channelFactsItem.channelFactsData.results.find((result) => result.key === 'DASHBOARD_FACT_ANALYTICS_LIFETIME_SUBSCRIBERS');
    }
  });
  const subscribers = info.value.resultTable.metricColumns[0].counts.values[0];
  return {
    subscribers,
  };
}

async function getMemberData() {
  const {
    data
  } = await axios.post(`${studioBaseURL}/sponsors/creator_sponsorships_sponsors?alt=json&key=${key}`, {
    context,
    externalChannelId,
    sponsorsOptions: {
      pageSize: 100,
      continuationToken: 'EgwI14nPnwYQyKK5qQEYAyIAKgYKBAgEEAE',
      filter: {},
      order: {
        orderFields: [
          {
            field: 'SPONSORSHIPS_SPONSORS_ORDER_FIELD_LAST_EVENT_DURATION',
            order: 'SPONSORSHIPS_SPONSORS_ORDER_ASC'
          }
        ]
      }
    }
  }, {
    headers,
    referrer,
  });
  return data.sponsorsData.sponsors;
}

async function getEmoji() {
  const {
    data
  } = await axios.post(`${studioBaseURL}/sponsors/creator_sponsorships_data?alt=json&key=${key}`, {
    context,
    externalChannelId,
    mask: {
      emojiData: { all: true },
    },
    sponsorsOptions: {
      pageSize: 100,
      filter: {},
    },
  }, {
    headers,
    referrer,
  });
  return data.sponsorshipsData.emojiData;
}

let moderators = null;
async function getModerators(cache = true) {
  if (cache && moderators) return moderators;
  moderators = new Promise((resolve) => {
    (async () => {
      const {
        data
      } = await axios.post(`${studioBaseURL}/creator/get_creator_channels?alt=json&key=${key}`, {
        context,
        channelIds: [externalChannelId],
        mask: {
          settings: { all: true },
        }
      }, {
        headers,
        referrer,
      });
      resolve(data.channels[0].settings
        .comments
        .moderators
        .reduce((all, mod) => {
          all[mod.externalChannelId] = true;
          return all;
        }, {}));
    })();
  });
  return moderators;
}

const unitMap = {
  SPONSORSHIPS_TIME_UNIT_MONTH: 'month',
  SPONSORSHIPS_TIME_UNIT_DAY: 'day',
};

const plural = (value) => (value > 1 ? 's' : '');

async function getMembers() {
  const memberData = await getMemberData();
  const usersById = {};
  const users = memberData.map((member) => {
    const user = {
      id: member.externalChannelId,
      name: member.displayName,
      loyaltyBadge: member.loyaltyBadge.thumbnailUrl,
      time_as_member: `${member.durationAtCurrentTier.amount} ${unitMap[member.durationAtCurrentTier.timeUnit]}${plural(member.durationAtCurrentTier.amount)}`,
    };
    usersById[member.externalChannelId] = user;
    return user;
  });
  return {
    users,
    usersById,
  };
}

module.exports = {
  getEmoji,
  getMembers,
  getModerators,
  getChannelFacts,
};
