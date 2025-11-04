import { Request, Response } from "express";
import RequestModel, { IRequest } from "../models/Request";
import { generateAIResponse } from "../services/aiService"; // your AI function

// Create a new request
export const createRequest = async (req: Request, res: Response): Promise<Response> => {
  const { title, description, requestedBy } = req.body;

  if (!title || !description || !requestedBy) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newRequest: IRequest = new RequestModel({
      title,
      description,
      requestedBy,
      history: []
    });

    await newRequest.save();

    return res.json({ ok: true, request: newRequest });
  } catch (err: any) {
    console.error("❌ createRequest error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Ask follow-up questions (AI)
export const askFollowUp = async (req: Request, res: Response): Promise<Response> => {
  const { requestId, userMessage } = req.body;

  if (!requestId || !userMessage) {
    return res.status(400).json({ error: "Missing requestId or userMessage" });
  }

  try {
    // Use generic type to tell Mongoose what type we expect
    const requestDoc = await RequestModel.findById<IRequest>(requestId);

    if (!requestDoc) return res.status(404).json({ error: "Request not found" });

    // Initialize history if undefined
    if (!requestDoc.history) requestDoc.history = [];

    // Generate AI response
    const aiReply = await generateAIResponse(userMessage, requestDoc.history);

    // Save AI response to request history
    requestDoc.history.push({ role: "user", content: userMessage });
    requestDoc.history.push({ role: "ai", content: aiReply });

    await requestDoc.save();

    return res.json({ ok: true, aiReply });
  } catch (err: any) {
    console.error("❌ askFollowUp error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Placeholder for future PDF generation
export const generatePDF = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ error: "PDF generation not implemented yet" });
};