import { Router } from 'express';
import { createRequest, getRequests, getRequestById, exportRequestPdf } from '../controllers/requestController';
import { ensureAuth } from '../middleware/auth';

const router = Router();
router.post('/', ensureAuth, createRequest);
router.get('/', ensureAuth, getRequests);
router.get('/:id', ensureAuth, getRequestById);
router.get('/:id/pdf', ensureAuth, exportRequestPdf);

export default router;