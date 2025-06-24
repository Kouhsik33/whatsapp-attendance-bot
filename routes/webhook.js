import express from 'express';
import twilio from 'twilio';
import User from '../models/user.js';
import fetchAttendance from '../services/scraper.js';
import { sendMessage } from '../utils/responder.js'; // Ensure this is ES module

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
    twiml.message('❌ Invalid request. Please send a valid message.');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(twiml.toString());
  }

  // === REGISTER ===
  if (incomingMsg.startsWith("REGISTER")) {
    console.log("📌 REGISTER command received");
    const [, regno, password] = rawMsg.trim().split(" ");

    if (!regno || !password) {
      twiml.message("❌ Usage: REGISTER <regno> <password>");
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      return res.end(twiml.toString());
    }

    await User.findOneAndUpdate(
      { phone },
      { regno, password },
      { new: true, upsert: true }
    );

    console.log(`✅ Registered user ${regno}`);
    twiml.message("✅ Registered successfully! Send ATTENDANCE to get your stats.");
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(twiml.toString());
  }

  // === ATTENDANCE ===
  if (incomingMsg === "ATTENDANCE") {
    console.log("📌 ATTENDANCE command received");

    const user = await User.findOne({ phone });

    if (!user) {
      console.warn("❌ No user found for phone:", phone);
      twiml.message("❌ You are not registered. Send:\nREGISTER <regno> <password>");
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      return res.end(twiml.toString());
    }

    try {
      console.log("🔄 Fetching attendance for:", user.regno);
      const result = await fetchAttendance(user.regno, user.password);
      console.log("📊 Attendance fetched:", result);
      await sendMessage(`whatsapp:${phone}`, result || "❌ Could not fetch your attendance.");
    } catch (err) {
      console.error("💥 Attendance fetch error:", err.message);
      await sendMessage(`whatsapp:${phone}`, "⚠️ Failed to fetch attendance due to an error.");
    }

    return res.status(200).end(); // ✅ prevent double response
  }

  // === UNKNOWN COMMAND ===
  console.log("❓ Unrecognized command:", incomingMsg);
  twiml.message("🤖 Available Commands:\n- REGISTER <regno> <password>\n- ATTENDANCE");
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  return res.end(twiml.toString());
});

export default router;
