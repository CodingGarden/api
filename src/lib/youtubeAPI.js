const axios = require('axios');

const youtubeAPI = axios.create({
  baseURL: process.env.YOUTUBE_OPERATIONAL_API_ENDPOINT,
});

async function getLiveEvents(channelId) {
  const params = new URLSearchParams({
    part: 'snippet',
    channelId: channelId || process.env.YOUTUBE_CHANNEL_ID,
    order: 'date',
    type: 'video',
    eventType: 'live',
  });

  const { data } = await youtubeAPI(`/noKey/search?${params.toString()}`);
  return data;
}

async function getLiveStreamDetails(id) {
  const params = new URLSearchParams({
    part: 'liveStreamingDetails,snippet',
    id,
  });

  const { data } = await youtubeAPI(`/noKey/videos?${params.toString()}`);
  return data.items[0];
}

async function getLiveStreamChats(liveChatId, pageToken) {
  const params = new URLSearchParams({
    part: 'snippet,authorDetails',
    liveChatId,
    maxResults: 2000,
  });

  if (pageToken) {
    params.append('pageToken', pageToken);
  }

  const { data } = await youtubeAPI(`/noKey/liveChat/messages?${params.toString()}`);
  return data;
}

async function getUsers(...ids) {
  const params = new URLSearchParams({
    part: 'snippet',
    id: ids.join(','),
    maxResults: 50,
  });

  const { data } = await youtubeAPI(`/noKey/channels?${params.toString()}`);
  return data.items.map((item) => ({
    id: item.id,
    display_name: item.snippet.title,
    handle: item.snippet.customUrl,
    logo: item.snippet.thumbnails.default.url,
    created_at: new Date(item.snippet.publishedAt),
  }));
}

class YTLiveChatManager {
  constructor() {
    this.liveChatListeners = new Map();
    this.liveChatTimeoutIds = new Map();
  }

  hasListeners() {
    return this.liveChatListeners.size > 0;
  }

  isListening(id) {
    return this.liveChatListeners.has(id);
  }

  async pollChat(id, pageToken) {
    clearTimeout(this.liveChatTimeoutIds.get(id));
    const result = await getLiveStreamChats(id, pageToken);
    if (result.items) {
      if (result.items.length) {
        const cb = this.liveChatListeners.get(id);
        cb(result.items);
      }
      const timeoutId = setTimeout(async () => {
        this.pollChat(id, result.nextPageToken);
      }, result.pollingIntervalMillis || 2000);
      this.liveChatTimeoutIds.set(id, timeoutId);
    } else {
      console.log(`Live stream "${id}" ended. Removing listeners`);
      this.liveChatListeners.delete(id);
      this.liveChatTimeoutIds.delete(id);
    }
  }

  async listen({ videoId, id }, cb) {
    if (!this.isListening(id)) {
      console.log('Start listening to LIVE YT event:', videoId);
      this.liveChatListeners.set(id, cb);
      this.pollChat(id);
    }
  }
}

module.exports = {
  getLiveEvents,
  getLiveStreamDetails,
  getUsers,
  YTLiveChatManager: new YTLiveChatManager(),
};
