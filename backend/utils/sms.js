const twilio = require('twilio');

// Twilio ki details .env file se aayengi
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Ye check karna ki saari details .env file mein hain ya nahi
if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn('Twilio credentials not found in .env file. SMS will not be sent.');
}

const client = twilio(accountSid, authToken);

const sendSms = async (to, body) => {
  // Agar Twilio credentials nahi hain, to function se bahar aa jao
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    return;
  }
  
  try {
    // Phone number ko Indian format (+91) mein karna
    const formattedTo = `+91${to}`;
    
    await client.messages.create({
      body: body,
      from: twilioPhoneNumber,
      to: formattedTo,
    });
    console.log(`SMS sent successfully to ${formattedTo}`);
  } catch (error) {
    console.error(`Failed to send SMS to ${to}:`, error.message);
  }
};

module.exports = sendSms;
