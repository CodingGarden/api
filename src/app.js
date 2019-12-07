const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');

require('dotenv').config();

const middlewares = require('./middlewares');
const pledges = require('./routes/pledges');

const app = express();

app.use(morgan('common'));
app.use(helmet());

app.get('/', (req, res) => {
  res.json({
    message: '🦄🌈✨👋🌎🌍🌏✨🌈🦄'
  });
});

app.use('/pledges', pledges);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;
