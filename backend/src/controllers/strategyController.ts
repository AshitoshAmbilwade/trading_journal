// src/controllers/strategyController.ts
import { Request, Response } from "express";
import StrategyModel from "../models/Strategy.js";
import { Types } from "mongoose";

const SECTION_KEYS = ["entryCriteria", "sltpCriteria", "managementRules"] as const;
type SectionKey = typeof SECTION_KEYS[number];

const getUserId = (req: Request): string => {
  // authMiddleware attaches Mongoose user doc to req.user
  // accept either req.user._id or req.user.id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  if (!user) throw new Error("Unauthorized");
  if (user._id) return user._id.toString();
  if (user.id) return user.id.toString();
  throw new Error("Unauthorized");
};

const validateSectionKey = (k: string): k is SectionKey =>
  (SECTION_KEYS as readonly string[]).includes(k);

const MAX_ITEM_LENGTH = 1000; // max chars per criterion
const MAX_ITEMS = 200;

export const createStrategy = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { name, entryCriteria = [], sltpCriteria = [], managementRules = [] } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Strategy name is required" });
    }

    const norm = (arr: any) =>
      (Array.isArray(arr)
        ? arr
            .slice(0, MAX_ITEMS)
            .map((s: unknown) => String(s))
            .map((s: string) => s.trim().slice(0, MAX_ITEM_LENGTH))
        : []);

    const doc = {
      userId: new Types.ObjectId(userId),
      name: name.trim(),
      entryCriteria: norm(entryCriteria),
      sltpCriteria: norm(sltpCriteria),
      managementRules: norm(managementRules),
      isActive: true,
    };

    const strategy = await StrategyModel.create(doc);
    return res.status(201).json(strategy);
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ message: "Strategy name already exists" });
    console.error("createStrategy error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const listStrategies = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const includeInactive = req.query.includeInactive === "true";
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (!includeInactive) filter.isActive = true;

    const strategies = await StrategyModel.find(filter).sort({ createdAt: -1 }).lean();
    return res.status(200).json(strategies);
  } catch (err) {
    console.error("listStrategies error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getStrategy = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const strat = await StrategyModel.findOne({ _id: id, userId: new Types.ObjectId(userId) }).lean();
    if (!strat) return res.status(404).json({ message: "Strategy not found" });
    return res.status(200).json(strat);
  } catch (err) {
    console.error("getStrategy error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateStrategy = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const allowed = ["name", "entryCriteria", "sltpCriteria", "managementRules", "isActive"];
    const updatePayload: any = {};
    for (const key of allowed) {
      if (typeof (req.body as any)[key] !== "undefined") updatePayload[key] = (req.body as any)[key];
    }

    if (updatePayload.name && typeof updatePayload.name === "string")
      updatePayload.name = updatePayload.name.trim().slice(0, 200);

    // sanitize arrays
    for (const k of ["entryCriteria", "sltpCriteria", "managementRules"]) {
      if (Array.isArray((updatePayload as any)[k])) {
        (updatePayload as any)[k] = (updatePayload as any)[k]
          .slice(0, MAX_ITEMS)
          .map((s: unknown) => String(s))
          .map((s: string) => s.trim().slice(0, MAX_ITEM_LENGTH));
      }
    }

    const updated = await StrategyModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { $set: updatePayload },
      { new: true, runValidators: true, context: "query" }
    );

    if (!updated) return res.status(404).json({ message: "Strategy not found" });
    return res.status(200).json(updated);
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ message: "Strategy name conflict" });
    console.error("updateStrategy error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteStrategy = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const updated = await StrategyModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Strategy not found" });
    return res.status(200).json({ message: "Strategy deactivated" });
  } catch (err) {
    console.error("deleteStrategy error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Micro endpoints for the UI to add/remove single criteria items.
 *
 * POST  /api/strategies/:id/sections/:section/add
 *   body: { item: string }    -> pushes item to array (if under limit)
 *
 * DELETE /api/strategies/:id/sections/:section/:index
 *   -> removes item at index (safer than removing by value)
 */

// Add single item to a section
export const addSectionItem = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id, section } = req.params;
    const { item } = req.body;

    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });
    if (!validateSectionKey(section)) return res.status(400).json({ message: "Invalid section" });
    if (!item || typeof item !== "string" || !item.trim()) return res.status(400).json({ message: "Item is required" });

    const trimmed = item.trim().slice(0, MAX_ITEM_LENGTH);

    // ensure not beyond max items
    const doc = await StrategyModel.findOne({ _id: id, userId: new Types.ObjectId(userId) });
    if (!doc) return res.status(404).json({ message: "Strategy not found" });

    const arr = (doc as any)[section] as string[];
    if (!Array.isArray(arr)) return res.status(400).json({ message: "Invalid section data" });
    if (arr.length >= MAX_ITEMS) return res.status(400).json({ message: "Section reached maximum items" });

    arr.push(trimmed);
    (doc as any)[section] = arr;
    await doc.save();
    return res.status(200).json({ message: "Added", item: trimmed, section, strategy: doc });
  } catch (err) {
    console.error("addSectionItem error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Remove item by index from a section
export const removeSectionItem = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id, section, index } = req.params;

    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });
    if (!validateSectionKey(section)) return res.status(400).json({ message: "Invalid section" });

    const idx = Number(index);
    if (Number.isNaN(idx) || idx < 0) return res.status(400).json({ message: "Invalid index" });

    const doc = await StrategyModel.findOne({ _id: id, userId: new Types.ObjectId(userId) });
    if (!doc) return res.status(404).json({ message: "Strategy not found" });

    const arr = (doc as any)[section] as string[];
    if (!Array.isArray(arr)) return res.status(400).json({ message: "Invalid section data" });
    if (idx >= arr.length) return res.status(400).json({ message: "Index out of range" });

    const removed = arr.splice(idx, 1)[0];
    (doc as any)[section] = arr;
    await doc.save();
    return res.status(200).json({ message: "Removed", removed, section, strategy: doc });
  } catch (err) {
    console.error("removeSectionItem error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
