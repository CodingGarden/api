const { getLiveEvents, getLiveStreamDetails, YTLiveChatManager } = require('../../lib/youtubeAPI');

let listenTimeout;

async function listenChatsSpecificVideo(videoId, app) {
  const liveEventDetails = await getLiveStreamDetails(videoId);
  if (liveEventDetails) {
    const youtubeChatService = app.service('youtube/chat');
    const youtubeCommandsService = app.service('youtube/commands');
    YTLiveChatManager.listen(
      {
        videoId,
        id: liveEventDetails.liveStreamingDetails.activeLiveChatId
      },
      async (items) => {
        await Promise.all(items.map(async (item) => {
          if (item.snippet.type === 'textMessageEvent') {
            const message = {
              author_id: item.authorDetails.channelId,
              author_display_name: item.authorDetails.displayName,
              author_handle: null,
              message: item.snippet.displayMessage,
              created_at: new Date(item.snippet.publishedAt),
              deleted_at: null,
              live_chat_id: item.snippet.liveChatId,
            };
            if (message.message.match(/^!\w/)) {
              message.args = item.snippet.displayMessage.split(' ');
              message.command = message.args.shift().slice(1);
              await youtubeCommandsService.create(message);
            } else {
              await youtubeChatService.create({ message, item });
            }
          }
        }));
      }
    );
    return '';
  }
  return `No live event found for video id: ${videoId}`;
}

async function listenChats(app) {
  clearTimeout(listenTimeout);
  try {
    if (!YTLiveChatManager.hasListeners()) {
      console.log('Detecting YT live events...');
      const events = await getLiveEvents();
      const liveEvent = events.items[0];
      if (liveEvent) {
        const result = await listenChatsSpecificVideo(liveEvent.id.videoId, app);
        if (result) {
          console.log(result);
        }
      } else {
        console.log('No YT live events detected.');
      }
      listenTimeout = setTimeout(() => {
        listenChats(app);
      }, 60 * 1000);
    } else {
      listenTimeout = setTimeout(() => {
        listenChats(app);
      }, 60 * 10000);
    }
  } catch (error) {
    console.log(error);
    listenTimeout = setTimeout(() => {
      listenChats(app);
    }, 60 * 1000);
  }
}

module.exports = {
  listenChats,
  listenChatsSpecificVideo,
};
