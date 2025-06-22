// routes/webhook.js
import express from 'express';
import twilio from 'twilio';
// const MessagingResponse = twilio.twiml.MessagingResponse;
import User from '../models/user.js';
import fetchAttendance from '../services/scraper.js';

const MessagingResponse = twilio.twiml.MessagingResponse;

const router = express.Router();

router.post('/', async (req, res) => {
  const incomingMsg = req.body.Body?.trim();
  const phone = req.body.From?.replace('whatsapp:', '');

  const twiml = new MessagingResponse();

  if (!incomingMsg || !phone) {
    twiml.message('❌ Invalid request. Please send a valid message.');
    return res.type('text/xml').send(twiml.toString());
  }

  if (incomingMsg.toUpperCase().startsWith("REGISTER")) {
    const [, regno, password] = incomingMsg.split(" ");

    if (!regno || !password) {
      twiml.message("❌ Usage: REGISTER <regno> <password>");
      return res.type('text/xml').send(twiml.toString());
    }

    await User.findOneAndUpdate(
      { phone },
      { regno, password },
      { new: true, upsert: true }
    );

    twiml.message("✅ Registered successfully! Send ATTENDANCE to get your stats.");
    return res.type('text/xml').send(twiml.toString());
  }

  if (incomingMsg.toUpperCase() === "ATTENDANCE") {
    const user = await User.findOne({ phone });

    if (!user) {
      twiml.message("❌ You are not registered. Send:\nREGISTER <regno> <password>");
      return res.type('text/xml').send(twiml.toString());
    }

    const result = await fetchAttendance(user.regno, user.password);
    twiml.message(result || "❌ Could not fetch your attendance.");
    return res.type('text/xml').send(twiml.toString());
  }

  twiml.message("🤖 Available Commands:\n- REGISTER <regno> <password>\n- ATTENDANCE");
  res.type('text/xml').send(twiml.toString());
});

export default router;
