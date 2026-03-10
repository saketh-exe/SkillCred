import { Router } from "express";
import statusRouter from "./status";
import resumesRouter from "./resumes";
import interviewRouter from "./assessments/interview";
import testRouter from "./assessments/test";
import githubRouter from "./integrations/github";

const router = Router();

// api/status -> GET  /api/status
router.use("/status", statusRouter);

// api/resumes -> POST /api/resumes
router.use("/resumes", resumesRouter);

// api/assessments/interview -> POST /api/assessments/interview
router.use("/assessments/interview", interviewRouter);

// api/assessments/test -> POST /api/assessments/test
router.use("/assessments/test", testRouter);

// api/integrations/github/analyze -> POST /api/integrations/github/analyze
router.use("/integrations/github", githubRouter);

export default router;
