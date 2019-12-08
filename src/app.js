const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

require('dotenv').config();

const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');

const middlewares = require('./middlewares');
const services = require('./services');

const app = express(feathers());

app.configure(express.rest());
app.configure(socketio());

app.use(morgan('common'));
app.use(express.json({
  verify: (req, res, buf) => {
    req.feathers.rawBody = buf;
  }
}));
app.use(helmet());
app.use(cors());

app.get('/', (req, res) => {
  res.json({
    message: '🦄🌈✨👋🌎🌍🌏✨🌈🦄'
  });
});

app.configure(services);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;
