const express = require('express');
const app = express();
const port = 1337;
const { knex } = require('./knex');
const referrals = require('./referrals.json');
const { authMiddleware } = require('./authMiddleware');
const {
  DEMO_test_twilio_SID,
  DEMO_test_twilio_auth_token,
  twilio_phone_number,
} = require('./secrets.json');
const twilioClient = require('twilio')(DEMO_test_twilio_SID, DEMO_test_twilio_auth_token);

//parse JSON bodies
app.use(express.json());

//parse URL encoded bodies
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => res.send('SOMETHING'));

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

app.post('/receive-text', authMiddleware, async (req, res) => {
  try {
    const { From, Body, MessageSid } = req.body;

    const patientPhoneNumber = From.replace('+1', '');
    const targetReferral = referrals.find(
      referral => referral.patient_phone_number === patientPhoneNumber
    );
    if (!targetReferral) throw new Error('Invalid patient phone number');

    const sent_by_fullname = `${targetReferral.patient_first_name} ${targetReferral.patient_last_name}`;
    const sent_by_uuid = targetReferral.tl_tracked_referral_uuid;
    const referral_uuid = targetReferral.tl_tracked_referral_uuid;
    const twilio_id = MessageSid;
    const text = Body;

    await knex('messages').insert({
      text,
      sent_by_fullname,
      sent_by_uuid,
      twilio_id,
      referral_uuid,
    });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send(`Error processing received text: ${error.message || 'Unknown'}`);
  }
});

app.get('/texts/:referral_uuid', async (req, res) => {
  try {
    const { referral_uuid } = req.params;
    const referralTexts = await knex('messages').where({ referral_uuid });
    res.send(referralTexts);
  } catch (error) {
    res
      .status(500)
      .send(
        `Error getting texts for referral ${req.params.referral_uuid}: ${
          error.message || 'Unknown'
        }`
      );
  }
});

app.listen(port, () => {
  console.log(`Twilio demo backend listening on port ${port}`);
});

/*

twilio response when successfully sending an outgoing text:

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

twilio payload to webhook when receiving an incoming text:

BODY -> 
{
  ToCountry: 'US',
  ToState: '',
  SmsMessageSid: 'identicalAcrossAllThreeVersions',
  NumMedia: '0',
  ToCity: '',
  FromZip: 'xxxxx',
  SmsSid: 'identicalAcrossAllThreeVersions',
  FromState: 'xx',
  SmsStatus: 'received',
  FromCity: 'xxxxxxx',
  Body: 'Hi this is a text',
  FromCountry: 'US',
  To: '+1xxxxxxxxxx',
  ToZip: '',
  NumSegments: '1',
  MessageSid: 'identicalAcrossAllThreeVersions',
  AccountSid: 'xxx',
  From: '+1xxxxxxxxxx',
  ApiVersion: '2010-04-01'
}

HEADERS -> 
{
  host: 'hostSameInBothPlaces',
  'user-agent': 'TwilioProxy/1.1',
  'content-length': '405',
  accept: '*', //actual is star/star but breaks comment structure
  'content-type': 'application/x-www-form-urlencoded',
  'i-twilio-idempotency-token': 'xxx',
  'x-forwarded-for': 'xxx',
  'x-forwarded-host': 'hostSameInBothPlaces',
  'x-forwarded-proto': 'https',
  'x-home-region': 'us1',
  'x-twilio-signature': 'xxx',
  'accept-encoding': 'gzip'
}
*/
