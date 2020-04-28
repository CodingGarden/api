module.exports = function channels(app) {
  if (typeof app.channel !== 'function') {
    return;
  }

  app.on('connection', (connection) => {
    app.channel('anonymous').join(connection);
  });

  app.publish(() => app.channel('anonymous'));
};
