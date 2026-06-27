import { Router, Request, Response } from "express";
import multer from "multer";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "../middleware/auth";
import { config, integrations } from "../config";
import { HttpError } from "../middleware/errors";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

let _supabase: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabase;
}

// POST /api/upload
router.post(
  "/",
  requireAdmin,
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) throw new HttpError(400, "file is required");

    if (!integrations.supabase || config.useMocks) {
      // Dev fallback: data URL so the frontend can preview.
      const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      return res.json({ url: dataUrl, publicId: null, stub: true });
    }

    const ext = req.file.originalname.split(".").pop() ?? "png";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${req.body.folder ?? ""}/${fileName}`.replace(/^\//, "");

    const { error } = await sb()
      .storage.from(config.supabase.storageBucket)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });
    if (error) throw new HttpError(500, `Upload failed: ${error.message}`);

    const { data: pub } = sb()
      .storage.from(config.supabase.storageBucket)
      .getPublicUrl(path);
    res.json({ url: pub.publicUrl, path });
  }
);

export default router;
