// src/utils/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

const storage = new CloudinaryStorage({
  cloudinary,
  // Keep params untyped to avoid TS/CJS differences across package versions
  params: async (_req: any, file: any) => {
    const originalName = file?.originalname ? String(file.originalname).split(".")[0] : "upload";
    return {
      folder: "tradejournal/trade-images",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      resource_type: "image",
      public_id: `trade-${Date.now()}-${originalName}`,
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    };
  },
});

// File filter: accept only the single field name "image" and image mime types
const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (file.fieldname !== "image") {
    // This will trigger MulterError: Unexpected field (makes the problem explicit)
    return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
  }
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

// Use this in routes: uploadSingle expects field name "image"
export const uploadSingle = upload.single("image");

export { cloudinary };
