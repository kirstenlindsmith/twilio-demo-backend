const express = require('express');
const app = express();
const port = 1337;
const { knex } = require('./knex');
const referrals = require('./referrals.json');
const { twilio_SID, twilio_auth_token, twilio_phone_number } = require('./secrets.json');
const twilioClient = require('twilio')(twilio_SID, twilio_auth_token);

//parse JSON bodies
app.use(express.json());

//parse URL encoded bodies
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.send('HOOPLA'));

app.post('/send-text', async (req, res) => {
  try {
    const { referral_uuid, text } = req.body;
    const sent_by_fullname = 'Kirsten Lindsmith';
    const sent_by_uuid = '656fa29d-454e-47ef-999e-4f624518b6f6';
    const patientPhone = referrals.find(
      referral => referral.tl_tracked_referral_uuid === referral_uuid
    )?.patient_phone_number;

    if (!patientPhone) throw new Error('No phone number on file for this patient');

    const twilioMessage = await twilioClient.messages.create({
      body: text,
      from: twilio_phone_number,
      to: `+1${patientPhone}`,
    });
    const twilio_id = twilioMessage.sid;

    if (!twilio_id) throw new Error('No record of this message found in Twilio');

    await knex('messages').insert({
      text,
      sent_by_fullname,
      sent_by_uuid,
      twilio_id,
      referral_uuid,
    });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send(`Error sending text: ${error.message || 'Unknown'}`);
  }
});

app.post('/receive-text', async (req, res) => {});

app.get('/texts', (req, res) => {
  const { referral_uuid } = req.body;
});

app.listen(port, () => {
  console.log(`Twilio demo backend listening on port ${port}`);
});

/*

twilio message response:

{
  body: 'Sent from your Twilio trial account - Hello world',
  numSegments: '1',
  direction: 'outbound-api',
  from: '+1xxxxxxxxxx',
  to: '+1xxxxxxxxxx',
  dateUpdated: 2024-05-06T19:32:48.000Z,
  price: null,
  errorMessage: null,
  uri: 'xxxx',
  accountSid: 'xxxx',
  numMedia: '0',
  status: 'queued',
  messagingServiceSid: null,
  sid: 'xxxx',
  dateSent: null,
  dateCreated: 2024-05-06T19:32:48.000Z,
  errorCode: null,
  priceUnit: 'USD',
  apiVersion: '2010-04-01',
  subresourceUris: {
    media: 'xxxx'
  }
}
*/
