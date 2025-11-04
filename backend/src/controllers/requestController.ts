import { Request, Response } from 'express';
import RequestModel from '../models/Request';
import { generateAIResponse } from '../services/aiService';
import mongoose from 'mongoose';
import { generatePDF } from '../services/pdfService';
import path from 'path';
import fs from 'fs';

/**
 * Create request (draft)
 */
export async function createRequest(req: Request, res: Response) {
  try {
    const { employeeId, title, description, requestType, priority, type } = req.body;
    if (!employeeId || !title || !description) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const newRequest = new RequestModel({
      employeeId,
      title,
      description,
      requestType: requestType || type || 'general_inquiry',
      status: 'draft',
      priority: priority || 'medium',
      history: [],
      conversationData: { messages: [], collectedData: {}, summary: '' }
    });

    const initialMsg = {
      role: 'user' as const,
      content: description,
      timestamp: new Date()
    };
    
    // Ensure arrays exist before pushing
    if (!newRequest.history) newRequest.history = [];
    if (!newRequest.conversationData) {
      newRequest.conversationData = { messages: [], collectedData: {}, summary: '' };
    }
    if (!newRequest.conversationData.messages) {
      newRequest.conversationData.messages = [];
    }
    
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
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const reqDoc = await RequestModel.findById(requestId);
    if (!reqDoc) return res.status(404).json({ error: 'Request not found' });

    // Ensure conversationData and history exist
    if (!reqDoc.history) reqDoc.history = [];
    if (!reqDoc.conversationData) {
      reqDoc.conversationData = { messages: [], collectedData: {}, summary: '' };
    }
    if (!Array.isArray(reqDoc.conversationData.messages)) {
      reqDoc.conversationData.messages = [];
    }

    // At this point we've ensured both exist above; narrow types for TS
    if (!reqDoc.conversationData) {
      reqDoc.conversationData = { messages: [], collectedData: {}, summary: '' };
    }
    if (!reqDoc.history) {
      reqDoc.history = [];
    }

    const conversationData = reqDoc.conversationData as {
      messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: Date }>;
      collectedData?: Record<string, any>;
      summary?: string;
    };
    conversationData.messages = conversationData.messages || [];

    const history = reqDoc.history as Array<{ role: 'user' | 'assistant'; content: string; timestamp?: Date }>;

    // Push user message - filter out 'system' role for storage
    const userMsg = {
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    history.push(userMsg);
    conversationData.messages.push(userMsg);

    // Prepare history for AI context - only user/assistant messages
    const historyForAi = history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.timestamp
      }));

    // Generate AI reply
    const { reply, structured } = await generateAIResponse(message, historyForAi);

    const assistantMsg = {
      role: 'assistant' as const,
      content: reply,
      timestamp: new Date()
    };
    history.push(assistantMsg);
    conversationData.messages.push(assistantMsg);

    // Merge structured data if available
    if (structured && typeof structured === 'object') {
      conversationData.collectedData = {
        ...conversationData.collectedData,
        ...structured
      };
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
 * Submit request (finalize)
 * POST /api/requests/submit/:requestId
 */
export async function submitRequest(req: Request, res: Response) {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    const reqDoc = await RequestModel.findById(requestId).populate('employeeId', 'firstName lastName email');
    if (!reqDoc) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Update status to submitted
    reqDoc.status = 'submitted';

    // Generate AI summary if not exists
    if (!reqDoc.aiSummary && reqDoc.conversationData?.messages) {
      const allMessages = reqDoc.conversationData.messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');
      reqDoc.aiSummary = `Résumé de la demande: ${allMessages.substring(0, 500)}...`;
    }

    await reqDoc.save();

    // Generate PDF
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const pdfPath = path.join(uploadsDir, `request-${requestId}.pdf`);
    const employeeName = reqDoc.employeeId 
      ? `${(reqDoc.employeeId as any).firstName || ''} ${(reqDoc.employeeId as any).lastName || ''}`.trim()
      : 'Confidentiel';

    await generatePDF({ ...reqDoc.toObject(), employeeName }, pdfPath);
    reqDoc.pdfReportUrl = `/uploads/request-${requestId}.pdf`;
    await reqDoc.save();

    return res.json({ 
      ok: true, 
      request: reqDoc,
      message: 'Demande soumise avec succès' 
    });
  } catch (err: any) {
    console.error('submitRequest error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}

/**
 * Get request by ID
 * GET /api/requests/:requestId
 */
export async function getRequestById(req: Request, res: Response) {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    const reqDoc = await RequestModel.findById(requestId)
      .populate('employeeId', 'firstName lastName email department position');

    if (!reqDoc) {
      return res.status(404).json({ error: 'Request not found' });
    }

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
    const all = await RequestModel.find()
      .sort({ createdAt: -1 })
      .populate('employeeId', 'firstName lastName email');
    return res.json(all);
  } catch (err: any) {
    console.error('listRequests error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}