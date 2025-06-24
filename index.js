import express from "express";
import webhookRoutes from "./routes/webhook.js";
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();


const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/webhook", webhookRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ MongoDB connected");
}).catch(err => {
  console.error("❌ MongoDB error:", err);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

