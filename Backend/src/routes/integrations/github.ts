import { Router } from "express";

const router = Router();

router.post("/analyze", (_req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

export default router;
