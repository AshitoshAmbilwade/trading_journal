// src/controllers/tradeController.ts
import type { Request, Response } from "express";
import { TradeModel } from "../models/Trade.js";
import { Types, isValidObjectId } from "mongoose";

// Minimal AuthRequest to reflect multer attaching `file`
interface AuthRequest extends Request {
  user?: any;
  file?: Express.Multer.File;
  files?: Express.Multer.File[]; // backward compatibility
}

/**
 * Try to extract a usable string from various shapes:
 *  - multer file (req.file)
 *  - req.body.image (string or object)
 *  - req.body.images (array -> take first)
 */
const extractImageUrl = (req: AuthRequest): string => {
  // 1) multer file (upload.single("image"))
  const file: any = req.file;
  if (file) {
    // common locations for URL depending on storage library
    const url =
      (file.path && String(file.path)) ||
      (file.secure_url && String(file.secure_url)) ||
      (file.location && String(file.location)) ||
      (file.url && String(file.url)) ||
      (file.filename && String(file.filename)) ||
      "";
    if (url) return url;
  }

  // Helper to extract from an object (path/secure_url/location/url/filename/public_id)
  const extractFromObj = (obj: any): string => {
    if (!obj || typeof obj !== "object") return "";
    const candidates = ["path", "secure_url", "location", "url", "filename", "public_id"];
    for (const k of candidates) {
      if (obj[k]) return String(obj[k]);
    }
    // fallback stringify but avoid returning "{}"
    try {
      const s = JSON.stringify(obj);
      if (s && s !== "{}") return s;
    } catch {}
    return "";
  };

  // 2) body.image
  const bodyImage = (req.body && (req.body as any).image) || undefined;
  if (bodyImage) {
    if (typeof bodyImage === "string") {
      if (bodyImage && bodyImage !== "{}" && bodyImage !== "[object Object]") return bodyImage;
    } else if (typeof bodyImage === "object") {
      const v = extractFromObj(bodyImage);
      if (v) return v;
    }
  }

  // 3) body.images array first element
  const bodyImages = (req.body && (req.body as any).images) || undefined;
  if (Array.isArray(bodyImages) && bodyImages.length > 0) {
    const first = bodyImages[0];
    if (typeof first === "string" && first && first !== "{}") return first;
    if (typeof first === "object") {
      const v = extractFromObj(first);
      if (v) return v;
    }
  }

  return "";
};

/**
 * Coerce numeric/date fields and sanitize image/aiAnalysis fields.
 * Returns a shallow clone (doesn't mutate original body).
 */
const coerceTradeBody = (body: any) => {
  const coerced: any = { ...body };

  // sanitize image field if it's a JSON-string or empty object
  if (coerced.image === "{}" || coerced.image === "[object Object]") {
    coerced.image = "";
  } else if (coerced.image && typeof coerced.image === "object") {
    // plain empty object -> ""
    if (Object.getPrototypeOf(coerced.image) === Object.prototype && Object.keys(coerced.image).length === 0) {
      coerced.image = "";
    } else {
      // try to extract candidate string fields
      const img = coerced.image;
      const candidates = ["path", "secure_url", "location", "url", "filename", "public_id"];
      let extracted = "";
      for (const k of candidates) {
        if (img[k]) {
          extracted = String(img[k]);
          break;
        }
      }
      if (extracted) coerced.image = extracted;
      else {
        try {
          const s = JSON.stringify(img);
          coerced.image = s && s !== "{}" ? s : "";
        } catch {
          coerced.image = "";
        }
      }
    }
  }

  // numbers
  if (coerced.quantity !== undefined) coerced.quantity = Number(coerced.quantity);
  if (coerced.price !== undefined) coerced.price = Number(coerced.price);
  if (coerced.pnl !== undefined) coerced.pnl = Number(coerced.pnl);
  if (coerced.brokerage !== undefined && coerced.brokerage !== null && coerced.brokerage !== "")
    coerced.brokerage = Number(coerced.brokerage);

  // dates
  if (coerced.tradeDate) coerced.tradeDate = new Date(coerced.tradeDate);
  if (coerced.entryDate) coerced.entryDate = new Date(coerced.entryDate);
  if (coerced.exitDate) coerced.exitDate = new Date(coerced.exitDate);

  // aiAnalysis string -> object
  if (typeof coerced.aiAnalysis === "string") {
    try {
      const parsed = JSON.parse(coerced.aiAnalysis);
      if (parsed && typeof parsed === "object") coerced.aiAnalysis = parsed;
    } catch {
      // ignore invalid JSON
    }
  }

  return coerced;
};

const checkTierLimit = async (user: any) => {
  if (user && user.tier === "Free") {
    const tradeCount = await TradeModel.countDocuments({ userId: new Types.ObjectId(user._id) });
    if (tradeCount >= 50) throw new Error("Free tier limit reached. Upgrade to Premium to add more trades.");
  }
};

// ===============================
// Create Trade (single Cloudinary image)
// ===============================
export const createTrade = async (req: AuthRequest, res: Response) => {
  try {
    console.log("===== createTrade start =====");
    if (!req.user) {
      console.warn("Unauthorized attempt to create trade");
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Debugging: incoming multipart/body/file info
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("req.body keys:", Object.keys(req.body || {}).slice(0, 50));
    try {
      console.log(
        "req.body preview:",
        JSON.stringify(
          Object.fromEntries(Object.keys(req.body || {}).slice(0, 50).map((k) => [k, (req.body as any)[k]])),
          null,
          2
        )
      );
    } catch (e) {
      console.log("Could not stringify req.body preview:", e);
    }

    console.log("req.file present?:", !!req.file);
    if (req.file) {
      const f: any = req.file;
      console.log("req.file summary:", {
        fieldname: f.fieldname,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        path: f.path || f.secure_url || f.location || f.url,
        filename: f.filename,
      });
    }

    // enforce tier limit
    await checkTierLimit(req.user);

    // prefer extracted URL from file/body/images
    const imageUrlFromReq = extractImageUrl(req);

    // coerce body once
    const coercedBody = coerceTradeBody(req.body);

    // final image: prefer uploaded/extracted url; otherwise use sanitized body.image (string) or ""
    const finalImage = imageUrlFromReq || (typeof coercedBody.image === "string" ? coercedBody.image : "");

    // Build trade data
    const tradePayload: any = {
      ...coercedBody,
      userId: new Types.ObjectId(req.user._id),
      image: finalImage || "",
    };

    // Remove legacy images array if present in the incoming payload
    if ("images" in tradePayload) delete tradePayload.images;

    console.log("tradePayload preview:", {
      userId: String(tradePayload.userId),
      symbol: tradePayload.symbol,
      type: tradePayload.type,
      quantity: tradePayload.quantity,
      price: tradePayload.price,
      pnl: tradePayload.pnl,
      image: tradePayload.image ? "[exists]" : "[empty]",
    });

    const trade = await TradeModel.create(tradePayload);

    // Defensive cleanup of legacy field if somehow saved
    if ((trade as any).images) {
      try {
        await TradeModel.findByIdAndUpdate(trade._id, { $unset: { images: "" } });
      } catch (e) {
        console.warn("Failed to $unset images on new trade:", e);
      }
    }

    console.log("Trade created id:", trade._id);
    console.log("===== createTrade end =====");
    return res.status(201).json({ trade });
  } catch (err: any) {
    console.error("Create Trade Error:", err?.message || err);
    return res.status(400).json({ message: err?.message || "Error creating trade" });
  }
};

// ===============================
// Get All Trades
// ===============================
export const getTrades = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const trades = await TradeModel.find({ userId: new Types.ObjectId(req.user._id) }).sort({ tradeDate: -1 });
    return res.status(200).json({ trades });
  } catch (err: any) {
    console.error("Get Trades Error:", err);
    return res.status(500).json({ message: err.message || "Error fetching trades" });
  }
};

// ===============================
// Get Single Trade
// ===============================
export const getTrade = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid ID" });

    const trade = await TradeModel.findOne({
      _id: req.params.id,
      userId: new Types.ObjectId(req.user._id),
    });

    if (!trade) return res.status(404).json({ message: "Trade not found" });
    return res.status(200).json({ trade });
  } catch (err: any) {
    console.error("Get Trade Error:", err);
    return res.status(500).json({ message: err.message || "Error fetching trade" });
  }
};

// ===============================
// Update Trade (single image) — removes legacy `images` array
// ===============================
export const updateTrade = async (req: AuthRequest, res: Response) => {
  try {
    console.log("===== updateTrade start =====");
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid ID" });

    const trade = await TradeModel.findOne({
      _id: req.params.id,
      userId: new Types.ObjectId(req.user._id),
    });

    if (!trade) {
      console.warn("Trade not found for update, id:", req.params.id);
      return res.status(404).json({ message: "Trade not found" });
    }

    console.log("update req.body keys:", Object.keys(req.body || {}).slice(0, 50));
    console.log("req.file present?:", !!req.file);

    // extract new image URL if any (uploaded file or body/images)
    const newImageUrl = extractImageUrl(req);
    if (newImageUrl) console.log("New image URL:", newImageUrl);

    // coerce body once
    const coerced = coerceTradeBody(req.body);
    const updateSet: any = { ...coerced };

    if (newImageUrl) {
      // replace image field with new uploaded URL
      updateSet.image = newImageUrl;
    } else if (req.body && (req.body as any).image === "") {
      // client explicitly requested clearing the image
      updateSet.image = "";
    } else {
      // no change to image — don't set image key (so mongoose won't change it)
      if ("image" in updateSet) {
        // sanitized earlier, could be empty string or string;
        // if it's empty string but client didn't send explicit "", we remove it to avoid accidental clearing
        if (updateSet.image === "") delete updateSet.image;
      }
    }

    // Remove incoming legacy images array if present in the body
    if ("images" in updateSet) delete updateSet.images;

    // Prepare update operations: $set updateSet and $unset images if present in db (legacy)
    const updateOps: any = {};
    if (Object.keys(updateSet).length > 0) updateOps.$set = updateSet;
    // attempt to unset legacy images array on every update (harmless if not present)
    updateOps.$unset = { images: "" };

    console.log("updateData preview:", {
      id: req.params.id,
      symbol: updateSet.symbol,
      price: updateSet.price,
      quantity: updateSet.quantity,
      pnl: updateSet.pnl,
      image: Object.prototype.hasOwnProperty.call(updateSet, "image")
        ? updateSet.image
          ? "[will-set]"
          : "[will-clear]"
        : "[no-change]",
    });

    const updatedTrade = await TradeModel.findByIdAndUpdate(trade._id, updateOps, {
      new: true,
      runValidators: true,
    });

    console.log("Updated trade id:", updatedTrade?._id);
    console.log("===== updateTrade end =====");
    return res.status(200).json({ trade: updatedTrade });
  } catch (err: any) {
    console.error("Update Trade Error:", err);
    return res.status(500).json({ message: err.message || "Error updating trade" });
  }
};

// ===============================
// Delete Trade
// ===============================
export const deleteTrade = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid ID" });

    const trade = await TradeModel.findOneAndDelete({
      _id: req.params.id,
      userId: new Types.ObjectId(req.user._id),
    });

    if (!trade) return res.status(404).json({ message: "Trade not found" });

    // Note: We only store image URL (not the public_id). If later you store public_id,
    // call cloudinary.uploader.destroy(public_id) here to remove remote file.
    console.log("Deleted trade id:", req.params.id);
    return res.status(200).json({ message: "Trade deleted" });
  } catch (err: any) {
    console.error("Delete Trade Error:", err);
    return res.status(500).json({ message: err.message || "Error deleting trade" });
  }
};
