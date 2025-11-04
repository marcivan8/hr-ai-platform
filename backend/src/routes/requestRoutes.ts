// src/routes/requestRoutes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/requestController';
import { ensureAuth } from '../middleware/auth';

const router = Router();

// Preferred RESTful endpoints (match frontend `requestAPI` expectations)
router.post('/', ensureAuth, ctrl.createRequest); // POST /api/requests -> create draft request
router.post('/:requestId/messages', ensureAuth, ctrl.interact); // POST /api/requests/:id/messages -> user message -> AI reply
router.post('/:requestId/finalize', ensureAuth, ctrl.submitRequest); // POST /api/requests/:id/finalize -> finalize + generate PDF
router.get('/:requestId', ctrl.getRequestById);
router.get('/', ctrl.listRequests);

// Legacy/alias endpoints (keep for backward compatibility)
router.post('/create', ctrl.createRequest);
router.post('/interact/:requestId', ctrl.interact);
router.post('/submit/:requestId', ctrl.submitRequest);

export default router;