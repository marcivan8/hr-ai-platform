import { Request, Response } from 'express';
import RequestModel, { IRequest } from '../models/Request';
import { generateAIResponse, extractStructuredData, IMessage } from '../services/aiService';
import path from 'path';
import fs from 'fs';
import { generatePDF } from '../services/pdfService';
import mongoose from 'mongoose';

function ensureConversation(reqDoc: IRequest) {
  if (!reqDoc.history) reqDoc.history = [];
  if (!reqDoc.conversationData) reqDoc.conversationData = { messages: [], collectedData: {}, summary: '' };
  if (!Array.isArray(reqDoc.conversationData.messages)) reqDoc.conversationData.messages = [];
}

/**
 * Create request (draft)
 */
export async function createRequest(req: Request, res: Response) {
  try {
    const { employeeId, title, description, requestType, priority } = req.body;
    if (!employeeId || !title || !description) return res.status(400).json({ error: 'Missing fields' });

    const newRequest = new RequestModel({
      employeeId,
      title,
      description,
      requestType: requestType || 'general_inquiry',
      status: 'draft',
      priority: priority || 'medium',
      history: [],
      conversationData: { messages: [], collectedData: {}, summary: '' }
    });

    const initialMsg: IMessage = { role: 'user', content: description, timestamp: new Date() };
    newRequest.history.push(initialMsg);
    newRequest.conversationData.messages.push(initialMsg);

    await newRequest.save();
    return res.status(201).json({ ok: true, request: newRequest });
  } catch (err: any) {
    console.error('createRequest error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}

/**
 * Interact with AI
 * POST /api/requests/interact/:requestId
 * body: { message: string }
 */
export async function interact(req: Request, res: Response) {
  try {
    const { requestId } = req.params;
    const { message } = req.body;

    if (!message) return res.status(400).json({ error: 'Missing message' });
    if (!mongoose.Types.ObjectId.isValid(requestId)) return res.status(400).json({ error: 'Invalid id' });

    const reqDoc = await RequestModel.findById(requestId);
    if (!reqDoc) return res.status(404).json({ error: 'Request not found' });

    // Ensure conversationData and history exist
    if (!reqDoc.history) reqDoc.history = [];
    if (!reqDoc.conversationData) reqDoc.conversationData = { messages: [], collectedData: {}, summary: '' };
    if (!Array.isArray(reqDoc.conversationData.messages)) reqDoc.conversationData.messages = [];

    const conversationData = reqDoc.conversationData;
    const history = reqDoc.history;

    // Push user message
    const userMsg: IMessage = { role: 'user', content: message, timestamp: new Date() };
    history.push(userMsg);
    conversationData.messages.push(userMsg);

    // Prepare history for AI context
    const historyForAi: IMessage[] = history.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp
    }));

    // Generate AI reply
    const { reply, structured } = await generateAIResponse(message, historyForAi);

    const assistantMsg: IMessage = { role: 'assistant', content: reply, timestamp: new Date() };
    history.push(assistantMsg);
    conversationData.messages.push(assistantMsg);

    // Merge structured data if available
    if (structured && typeof structured === 'object') {
      conversationData.collectedData = {
        ...conversationData.collectedData,
        ...structured
      };
    } else {
      // fallback: try to re-extract structured data from updated history
      try {
        const reExtract = await extractStructuredData([...history, { role: 'user', content: message, timestamp: new Date() }]);
        if (reExtract && typeof reExtract === 'object') {
          conversationData.collectedData = {
            ...conversationData.collectedData,
            ...reExtract
          };
        }
      } catch (e) {
        console.warn('Structured data re-extraction failed:', e);
      }
    }

    // Save updated document
    await reqDoc.save();

    return res.json({ ok: true, aiReply: reply, structured: structured || {} });
  } catch (err: any) {
    console.error('interact error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}

/**
 * List requests
 */
export async function listRequests(_req: Request, res: Response) {
  try {
    const all = await RequestModel.find().sort({ createdAt: -1 }).populate('employeeId', 'firstName lastName email');
    return res.json(all);
  } catch (err: any) {
    console.error('listRequests error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}