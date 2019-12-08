const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

require('dotenv').config();

const middlewares = require('./middlewares');
const pledges = require('./routes/pledges');

const app = express();

app.use(morgan('common'));
app.use(helmet());
app.use(cors());

app.get('/', (req, res) => {
  res.json({
    message: '🦄🌈✨👋🌎🌍🌏✨🌈🦄'
  });
});

app.use('/pledges', pledges);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;
