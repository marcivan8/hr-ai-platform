// src/controllers/requestController.ts
import { Request, Response } from 'express';
import RequestModel, { IRequest } from '../models/Request';
import { generateAIResponse, extractStructuredData, IMessage } from '../services/aiService';
import path from 'path';
import fs from 'fs';
import { generatePDF } from '../services/pdfService';
import mongoose from 'mongoose';

function ensureConversation(reqDoc: Partial<IRequest>) {
  // support both conversationData.messages and legacy history
  if (!reqDoc.history) (reqDoc as any).history = [];
  if (!reqDoc.conversationData) (reqDoc as any).conversationData = { messages: [], collectedData: {}, summary: '' };
  if (!Array.isArray((reqDoc as any).conversationData.messages)) (reqDoc as any).conversationData.messages = [];
}

/**
 * Create request (draft)
 * POST /api/requests/create
 * body: { employeeId, title, description, requestType?, priority? }
 */
export async function createRequest(req: Request, res: Response) {
  try {
    const { employeeId, title, description, requestType, priority } = req.body;
    if (!employeeId || !title || !description) {
      return res.status(400).json({ error: 'Missing fields' });
    }

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

    // initial user message saved into history for AI context
    const initialMsg: IMessage = { role: 'user', content: description, timestamp: new Date() };
    newRequest.history.push(initialMsg as any);
    newRequest.conversationData!.messages.push(initialMsg as any);

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

    ensureConversation(reqDoc);

    // Push user message
    const userMsg: IMessage = { role: 'user', content: message, timestamp: new Date() };
    (reqDoc as any).history.push(userMsg);
    (reqDoc as any).conversationData.messages.push(userMsg);

    // Prepare history to pass to AI (use history array for context)
    const historyForAi: IMessage[] = ((reqDoc as any).history || []).map((m: any) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp
    }));

    // Generate AI reply
    const { reply, structured } = await generateAIResponse(message, historyForAi);

    const assistantMsg: IMessage = { role: 'assistant', content: reply, timestamp: new Date() };
    (reqDoc as any).history.push(assistantMsg);
    (reqDoc as any).conversationData.messages.push(assistantMsg);

    // Merge structured into conversationData.collectedData if present
    if (structured && typeof structured === 'object') {
      (reqDoc as any).conversationData.collectedData = {
        ...((reqDoc as any).conversationData.collectedData || {}),
        ...structured
      };
    } else {
      // best-effort attempt to re-extract structured data from updated history
      try {
        const reExtract = await extractStructuredData(historyForAi.concat({ role: 'user', content: message }));
        if (reExtract && typeof reExtract === 'object') {
          (reqDoc as any).conversationData.collectedData = {
            ...((reqDoc as any).conversationData.collectedData || {}),
            ...reExtract
          };
        }
      } catch (e) {
        // ignore extraction errors
      }
    }

    await reqDoc.save();

    return res.json({ ok: true, aiReply: reply, structured: structured || {} });
  } catch (err: any) {
    console.error('interact error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}

/**
 * Submit request: mark as submitted, generate PDF and store url
 * POST /api/requests/submit/:requestId
 */
export async function submitRequest(req: Request, res: Response) {
  try {
    const { requestId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(requestId)) return res.status(400).json({ error: 'Invalid id' });

    const reqDoc = await RequestModel.findById(requestId).populate('employeeId', 'firstName lastName email');
    if (!reqDoc) return res.status(404).json({ error: 'Request not found' });

    reqDoc.status = 'submitted';
    await reqDoc.save();

    // Ensure uploads dir
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const filename = `request-${reqDoc._id}.pdf`;
    const outPath = path.join(uploadsDir, filename);

    const employeeName = (reqDoc as any).employeeId?.name || (reqDoc as any).employeeId?.email || 'Confidentiel';
    await generatePDF({ ...reqDoc.toObject(), employeeName }, outPath);

    reqDoc.pdfReportUrl = `/uploads/${filename}`;
    await reqDoc.save();

    return res.json({ ok: true, request: reqDoc, pdfUrl: reqDoc.pdfReportUrl });
  } catch (err: any) {
    console.error('submitRequest error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}

/**
 * Get a request by id
 * GET /api/requests/:requestId
 */
export async function getRequestById(req: Request, res: Response) {
  try {
    const { requestId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(requestId)) return res.status(400).json({ error: 'Invalid id' });

    const reqDoc = await RequestModel.findById(requestId).populate('employeeId', 'firstName lastName email');
    if (!reqDoc) return res.status(404).json({ error: 'Not found' });

    return res.json(reqDoc);
  } catch (err: any) {
    console.error('getRequestById error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}

/**
 * List requests
 * GET /api/requests/
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