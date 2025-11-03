import { Router } from 'express';
import { createRequest, getRequests, getRequestById, exportRequestPdf } from '../controllers/requestController';
import { auth } from '../middleware/auth';

const router = Router();
router.post("/", auth as any, createRequest as any);
router.get("/", auth as any, getRequests as any);
router.get("/:id", auth as any, getRequestById as any);
router.get("/:id/pdf", auth as any, exportRequestPdf as any);

export default router;