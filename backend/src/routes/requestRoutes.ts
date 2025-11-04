import { Router } from 'express';
import * as requestController from '../controllers/requestController';

const router = Router();

router.post("/create", requestController.createRequest);
router.post("/ask", requestController.askFollowUp);
router.post("/generate-pdf", requestController.generatePDF); // implement later

export default router;