// scripts/migrate-users-subscription.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { UserModel } from "../models/User.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URL!);
  const users = await UserModel.find({
    $or: [{ subscriptionStart: { $exists: true, $ne: null } }, { subscriptionEnd: { $exists: true, $ne: null } }]
  });

  for (const u of users) {
    if (!u.subscription) {
      u.subscription = {
        status: "active",
        billingProvider: "manual",
        plan: { name: "migrated", baseAmount: 500, gstPercent: 18, totalAmount: 590, currency: "INR" },
        currentPeriodEnd: u.subscriptionEnd || null,
        createdAt: new Date(),
        metadata: { migrated: true }
      };
      await u.save();
      console.log("Migrated", u.email);
    }
  }
  console.log("Done");
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
