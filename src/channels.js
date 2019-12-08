module.exports = function channels(app) {
  if (typeof app.channel !== 'function') {
    return;
  }

  app.on('connection', (connection) => {
    app.channel('anonymous').join(connection);
  });

  app.publish(() => {
    console.log('Publishing all events to all users.');
    return app.channel('anonymous');
  });
};
