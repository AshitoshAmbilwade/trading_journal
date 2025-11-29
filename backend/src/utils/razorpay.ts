// src/utils/razorpay.ts
import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RZP_KEY_ID!,
  key_secret: process.env.RZP_KEY_SECRET!,
});
