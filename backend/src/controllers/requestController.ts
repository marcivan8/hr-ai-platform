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

    const userMsg: IMessage = { role: 'user', content: message, timestamp: new Date() };
    reqDoc.history.push(userMsg);
    reqDoc.conversationData.messages.push(userMsg);

    // AI context
    const historyForAi = reqDoc.history.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp }));

    const { reply, structured } = await generateAIResponse(message, historyForAi);

    const assistantMsg: IMessage = { role: 'assistant', content: reply, timestamp: new Date() };
    reqDoc.history.push(assistantMsg);
    reqDoc.conversationData.messages.push(assistantMsg);

    // Merge structured data
    if (structured && typeof structured === 'object') {
      reqDoc.conversationData.collectedData = {
        ...reqDoc.conversationData.collectedData,
        ...structured
      };
    } else {
      try {
        const reExtract = await extractStructuredData([...historyForAi, { role: 'user', content: message }]);
        if (reExtract && typeof reExtract === 'object') {
          reqDoc.conversationData.collectedData = {
            ...reqDoc.conversationData.collectedData,
            ...reExtract
          };
        }
      } catch (e) {
        // ignore
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
 * Submit request
 */
export async function submitRequest(req: Request, res: Response) {
  try {
    const { requestId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(requestId)) return res.status(400).json({ error: 'Invalid id' });

    const reqDoc = await RequestModel.findById(requestId).populate('employeeId', 'firstName lastName email');
    if (!reqDoc) return res.status(404).json({ error: 'Request not found' });

    reqDoc.status = 'submitted';
    await reqDoc.save();

    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const filename = `request-${reqDoc._id}.pdf`;
    const outPath = path.join(uploadsDir, filename);

    const employeeName = (reqDoc.employeeId as any)?.name || (reqDoc.employeeId as any)?.email || 'Confidentiel';
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
 * Get request by ID
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