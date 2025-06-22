const twilio = require("twilio");
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM = process.env.TWILIO_PHONE_NUMBER;

async function sendMessage(to, body) {
  try {
    await client.messages.create({
      from: FROM,
      to,
      body,
    });
  } catch (err) {
    console.error("❌ Error sending message:", err.message);
  }
}

module.exports = { sendMessage };
