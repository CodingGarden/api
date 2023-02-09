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
    const messages = await youtubeChats.find();
    return messages;
  }

  async create(items) {
    const results = await Promise.all(items
      .filter((item) => item.snippet.type === 'textMessageEvent')
      .map(async (item) => {
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
        const message = {
          author_id: user.id,
          author_display_name: user.display_name,
          author_handle: user.handle,
          message: item.snippet.displayMessage,
          created_at: new Date(item.snippet.publishedAt),
          deleted_at: null,
          live_chat_id: item.snippet.liveChatId,
        };
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
        return created;
      }));
    return results;
  }
}

module.exports = YouTubeChatService;
