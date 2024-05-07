const { DEMO_twilio_SID, twilio_SID } = require('./secrets.json');

const getCaseInsensitiveHeaderValue = (headerKey, requestHeaders) => {
  for (key in requestHeaders) {
    if (key.toLowerCase() === headerKey.toLowerCase()) {
      return requestHeaders[key];
    }
  }
};

const authMiddleware = (req, res, next) => {
  try {
    const { AccountSid } = req.body;
    const userAgent = getCaseInsensitiveHeaderValue('user-agent', req.headers);
    const twilioIdempotencyToken = getCaseInsensitiveHeaderValue(
      'i-twilio-idempotency-token',
      req.headers
    );
    const twilioSignature = getCaseInsensitiveHeaderValue('x-twilio-signature', req.headers);

    if (AccountSid !== DEMO_twilio_SID && AccountSid !== twilio_SID)
      throw new Error('Invalid twilio account SID');
    if (!userAgent.includes('TwilioProxy')) throw new Error('Invalid user agent');
    if (!twilioIdempotencyToken || !twilioSignature)
      throw new Error('Missing required twilio headers');
    next();
  } catch (error) {
    console.error(`Authentication error: ${error.message || 'Unknown'}`);
    res.sendStatus(401);
  }
};

module.exports = { authMiddleware };
