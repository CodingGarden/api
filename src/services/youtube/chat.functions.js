const { getLiveEvents, getLiveStreamDetails, YTLiveChatManager } = require('../../lib/youtubeAPI');

let listenTimeout;

async function listenChatsSpecificVideo(videoId, app) {
  const liveEventDetails = await getLiveStreamDetails(videoId);
  if (liveEventDetails) {
    const youtubeChatService = app.service('youtube/chat');
    YTLiveChatManager.listen(
      {
        videoId,
        id: liveEventDetails.liveStreamingDetails.activeLiveChatId
      },
      (items) => {
        youtubeChatService.create(items);
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
