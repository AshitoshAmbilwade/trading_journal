// src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import routes from "./src/routes/index.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// 1) CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/**
 * 2) RAW BODY FOR RAZORPAY WEBHOOKS
 * This MUST be registered BEFORE express.json()
 * and MUST target `/api/webhooks/*`
 */
app.use(
  "/api/webhooks",
  express.raw({ type: "application/json" }) // Razorpay sends application/json
);

// 3) Normal JSON parsing for the rest of the API
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4) Health check
app.get("/", (req, res) => res.send("Backend running 🚀"));

// 5) Mount all API routes (including /webhooks router)
app.use("/api", routes);

// 6) Connect DB then start server
connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
});
