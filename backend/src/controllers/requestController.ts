import { Request, Response } from "express";
import RequestModel, { IRequest } from "../models/Request";
import { generateAIResponse } from "../services/aiService"; // your AI function

// Create a new request
export const createRequest = async (req: Request, res: Response): Promise<Response> => {
  const { title, description, employeeId } = req.body;

  if (!title || !description || !employeeId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newRequest: IRequest = new RequestModel({
      title,
      description,
      employeeId,
      conversationData: { messages: [], collectedData: {}, summary: "" },
      status: "draft",
      priority: "medium",
      isAnonymous: false,
      consentGiven: true
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
    const requestDoc = await RequestModel.findById<IRequest>(requestId);

    if (!requestDoc) return res.status(404).json({ error: "Request not found" });

    // Ensure conversation container exists
    if (!requestDoc.conversationData) {
      requestDoc.conversationData = { messages: [], collectedData: {}, summary: "" };
    }

    // Prepare message history for AI call
    const messages = (requestDoc.conversationData.messages || []).map(msg => ({
      role: msg.role, 
      content: msg.content,
    }));

    // Add latest user message
    messages.push({ role: "user", content: userMessage });

    // Get AI response
    const aiReply = await generateAIResponse(userMessage, messages);

    // Save conversation to DB
    requestDoc.conversationData.messages.push({
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    });

    requestDoc.conversationData.messages.push({
      role: "assistant",
      content: aiReply,
      timestamp: new Date(),
    });

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