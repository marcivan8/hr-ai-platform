import { Router } from "express";
import * as requestController from "../controllers/requestController";

const router = Router();

// Create a new request
router.post("/create", requestController.createRequest);

// AI follow-up conversation
router.post("/ask", requestController.askFollowUp);

// PDF generation placeholder
router.post("/generate-pdf", requestController.generatePDF);

export default router;