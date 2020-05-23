module.exports = function channels(app) {
  if (typeof app.channel !== 'function') {
    return;
  }

  app.on('connection', (connection) => {
    app.channel('anonymous').join(connection);
  });

  app.publish((data, hook) => {
    const all = [];
    if (hook.path === 'vox/populi') {
      all.push(app.channel('anonymous'));
    }
    return all;
  });
};
