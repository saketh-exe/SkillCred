import { Router } from "express";
import multer from "multer";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/", upload.single("resume"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No PDF file received" });
  console.log(`Received resume: ${req.file.originalname} (${req.file.size} bytes)`);
  res.json({ message: `Resume received: ${req.file.originalname} (${req.file.size} bytes)` });
});

export default router;
