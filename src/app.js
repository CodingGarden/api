const path = require('path');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

require('dotenv').config();

const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');

const middlewares = require('./middlewares');
const services = require('./services');
const channels = require('./channels');
const listenStreamlabs = require('./streamlabs');

const app = express(feathers());

app.use(cors());
app.configure(express.rest());
app.configure(socketio((io) => {
  io.set('transports', ['websocket']);
  io.use((socket, next) => {
    socket.feathers.apiKey = socket.handshake.query.key;
    next();
  });
}));

app.set('trust proxy', 'loopback');
app.use(morgan('[:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.json({
  verify: (req, res, buf) => {
    req.feathers.rawBody = buf;
  }
}));
app.use(helmet());

app.get('/', (req, res) => {
  res.json({
    message: '🌱🦄🌈✨👋🌎🌍🌏✨🌈🦄🌱'
  });
});

app.use((req, res, next) => {
  req.feathers.res = res;
  next();
});

app.configure(services);
app.configure(channels);
app.configure(listenStreamlabs);

app.use(middlewares.notFound);
app.use((error, req, res, next) => {
  // console.error(error);
  next(error);
});
app.use(express.errorHandler());

module.exports = app;
