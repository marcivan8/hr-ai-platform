// src/routes/requestRoutes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/requestController';

const router = Router();

router.post('/create', ctrl.createRequest); // create draft request
router.post('/interact/:requestId', ctrl.interact); // user message -> AI reply
router.post('/submit/:requestId', ctrl.submitRequest); // finalize + generate PDF
router.get('/:requestId', ctrl.getRequestById);
router.get('/', ctrl.listRequests);

export default router;