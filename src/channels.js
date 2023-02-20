module.exports = function channels(app) {
  if (typeof app.channel !== 'function') {
    return;
  }

  app.on('connection', (connection) => {
    if (connection.apiKey && connection.apiKey === process.env.CLIENT_API_KEY) {
      app.channel('api-key').join(connection);
    }
    app.channel('anonymous').join(connection);
  });

  const apiKeyPaths = new Set([
    'youtube/users',
    'youtube/chat',
    'twitch/chat',
    'twitch/rewards',
    'twitch/commands'
  ]);

  app.publish((data, hook) => {
    const all = [];
    if (hook.path === 'vox/populi' || hook.path === 'twitch/users') {
      all.push(app.channel('anonymous'));
    } else if (apiKeyPaths.has(hook.path)) {
      all.push(app.channel('api-key'));
    }
    return all;
  });
};
