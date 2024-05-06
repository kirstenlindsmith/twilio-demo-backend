const express = require('express');
const app = express();
const port = 1337;
const { knex } = require('./knex');

app.post('/send-text', async (req, res) => {});

app.post('/receive-text', async (req, res) => {});

app.get('/texts', (req, res) => {});

app.listen(port, () => {
  console.log(`Twilio demo backend listening on port ${port}`);
});
