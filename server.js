const express = require('express');
const app = express();
const port = 1337;
const { knex } = require('./knex');
const referrals = require('./referrals.json');

//parse JSON bodies
app.use(express.json());

//parse URL encoded bodies
app.use(express.urlencoded({ extended: true }));

app.post('/send-text', async (req, res) => {
  const { referral_uuid, text } = req.body;
  const sent_by_fullname = 'Kirsten Lindsmith';
  const sent_by_uuid = '656fa29d-454e-47ef-999e-4f624518b6f6';
  //send a request to twilio, await a response
  const twilio_id = '111fa29d-454e-47ef-999e-4f624518b6f6';
  knex('messages').insert({
    text,
    sent_by_fullname,
    sent_by_uuid,
    twilio_id,
    referral_uuid,
  });
});

app.post('/receive-text', async (req, res) => {});

app.get('/texts', (req, res) => {
  const { referral_uuid } = req.body;
});

app.listen(port, () => {
  console.log(`Twilio demo backend listening on port ${port}`);
});
