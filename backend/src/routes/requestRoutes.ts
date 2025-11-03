import { Router } from 'express';
import { createRequest, getRequests, getRequestById, exportRequestPdf } from '../controllers/requestController';
import { ensureAuth } from '../middleware/auth';

const router = Router();
router.post("/", ensureAuth as any, createRequest as any);
router.get("/", ensureAuth as any, getRequests as any);
router.get("/:id", ensureAuth as any, getRequestById as any);
router.get("/:id/pdf", ensureAuth as any, exportRequestPdf as any);

export default router;