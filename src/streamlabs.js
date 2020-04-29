const io = require('socket.io-client');

const streamLabsURL = 'https://sockets.streamlabs.com';

const {
  STREAMLABS_SOCKET_TOKEN: socketToken
} = process.env;

function listenStreamlabs(app) {
  const streamlabs = io(`${streamLabsURL}?token=${socketToken}`, {
    transports: ['websocket']
  });
  streamlabs.on('connect', () => {
    console.log('connected to streamlabs');
  });
  streamlabs.on('connect_error', (error) => {
    console.log('error connecting to streamlabs');
    console.error(error);
  });
  streamlabs.on('event', (eventData) => {
    if (eventData.for === 'youtube_account' && eventData.type === 'subscription') {
      app.service('youtube/members').create({});
    } else if (eventData.for === 'twitch_account' && eventData.type === 'subscription') {
      app.service('twitch/subs').create({});
    }
  });
}

module.exports = listenStreamlabs;
