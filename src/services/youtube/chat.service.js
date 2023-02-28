const { YTLiveChatManager } = require('../../lib/youtubeAPI');
const { listenChats, listenChatsSpecificVideo } = require('./chat.functions');
const { youtubeChats } = require('../../db');

class YouTubeChatService {
  constructor(app) {
    this.app = app;
    listenChats(app);
  }

  async get(id) {
    const result = await listenChatsSpecificVideo(id, this.app);
    return {
      message: result || 'OK',
    };
  }

  async find() {
    const ids = [...YTLiveChatManager.liveChatListeners.keys()];
    const messages = await youtubeChats.find({
      live_chat_id: {
        $in: ids
      }
    });
    return messages;
  }

  async create({ message, item }) {
    let user = {
      id: item.authorDetails.channelId,
      handle: null,
      display_name: item.authorDetails.displayName,
      logo: item.authorDetails.profileImageUrl,
      created_at: new Date(),
      updated_at: new Date(),
      is_verified: item.authorDetails.isVerified,
      is_chat_owner: item.authorDetails.isChatOwner,
      is_chat_sponsor: item.authorDetails.isChatSponsor,
      is_chat_moderator: item.authorDetails.isChatModerator,
    };
    try {
      user = await this.app.service('youtube/users').get(item.authorDetails.channelId);
    } catch (error) {
      console.error(
        'error requesting user...',
        error.message,
        item.authorDetails.channelId
      );
    }
    const created = await youtubeChats.findOneAndUpdate(
      {
        id: item.id,
      },
      {
        $set: message,
      },
      {
        upsert: true,
      }
    );
    created.user = user;
    return [created];
  }
}

module.exports = YouTubeChatService;
