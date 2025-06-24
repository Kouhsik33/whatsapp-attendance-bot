// routes/webhook.js
import express from 'express';
import twilio from 'twilio';
// const MessagingResponse = twilio.twiml.MessagingResponse;
import User from '../models/user.js';
import fetchAttendance from '../services/scraper.js';

const MessagingResponse = twilio.twiml.MessagingResponse;

const router = express.Router();

router.post('/', async (req, res) => {
  const rawMsg = req.body.Body;
  const incomingMsg = rawMsg?.trim().toUpperCase();
  const phone = req.body.From?.replace('whatsapp:', '');

  console.log("📥 RAW MESSAGE:", rawMsg);
  console.log("📞 FROM:", phone);
  console.log("🔎 NORMALIZED:", incomingMsg);

  const twiml = new MessagingResponse();

  if (!incomingMsg || !phone) {
    console.warn("⚠️ Invalid message or missing phone");
    twiml.message('❌ Invalid request. Please send a valid message.');
    return res.type('text/xml').send(twiml.toString());
  }

  if (incomingMsg.startsWith("REGISTER")) {
    console.log("📌 REGISTER command received");
    const [, regno, password] = rawMsg.trim().split(" ");

    if (!regno || !password) {
      console.warn("⚠️ Missing regno or password");
      twiml.message("❌ Usage: REGISTER <regno> <password>");
      return res.type('text/xml').send(twiml.toString());
    }

    await User.findOneAndUpdate(
      { phone },
      { regno, password },
      { new: true, upsert: true }
    );

    console.log(`✅ Registered user ${regno}`);
    twiml.message("✅ Registered successfully! Send ATTENDANCE to get your stats.");
    return res.type('text/xml').send(twiml.toString());
  }

  if (incomingMsg === "ATTENDANCE") {
    console.log("📌 ATTENDANCE command received");

    const user = await User.findOne({ phone });
    if (!user) {
      console.warn("❌ No user found for phone:", phone);
      twiml.message("❌ You are not registered. Send:\nREGISTER <regno> <password>");
      return res.type('text/xml').send(twiml.toString());
    }

    try {
      console.log("🔄 Fetching attendance for:", user.regno);
      const result = await fetchAttendance(user.regno, user.password);
      console.log("📊 Attendance fetched:", result);
      twiml.message(result || "❌ Could not fetch your attendance.");
    } catch (err) {
      console.error("💥 Attendance fetch error:", err.message);
      twiml.message("⚠️ Failed to fetch attendance due to an error.");
    }

    return res.type('text/xml').send(twiml.toString());
  }

  console.log("❓ Unrecognized command:", incomingMsg);
  twiml.message("🤖 Available Commands:\n- REGISTER <regno> <password>\n- ATTENDANCE");
  res.type('text/xml').send(twiml.toString());
});

export default router;
