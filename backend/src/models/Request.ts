import { Request, Response } from 'express';
import RequestModel, { IRequest } from '../models/Request';
import { generateAIResponse } from '../services/aiService'; // Your AI helper
import mongoose from 'mongoose';

/**
 * Create a new request
 */
export const createRequest = async (req: Request, res: Response) => {
  try {
    const { employeeId, type, requestType, title, description, priority, isAnonymous } = req.body;

    const newRequest = new RequestModel({
      employeeId,
      type,
      requestType,
      title,
      description,
      priority: priority || 'medium',
      status: 'draft',
      isAnonymous: isAnonymous ?? false,
      conversationData: { messages: [], collectedData: {}, summary: '' }
    });

    await newRequest.save();
    return res.status(201).json({ ok: true, request: newRequest });
  } catch (err: any) {
    console.error('❌ createRequest error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Add a message and get AI response
 */
export const interactWithRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    const requestDoc = await RequestModel.findById(requestId);
    if (!requestDoc) return res.status(404).json({ error: 'Request not found' });

    // Initialize conversationData if missing
    if (!requestDoc.conversationData) {
      requestDoc.conversationData = { messages: [], collectedData: {}, summary: '' };
    }

    // Add user message
    requestDoc.conversationData.messages.push({ role: 'user', content: message, timestamp: new Date() });

    // Call AI to get response
    const aiResponse = await generateAIResponse(message, requestDoc.conversationData.messages);

    // Add AI response to conversation
    requestDoc.conversationData.messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });

    await requestDoc.save();
    return res.json({ ok: true, aiResponse, request: requestDoc });
  } catch (err: any) {
    console.error('❌ interactWithRequest error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Submit request (changes status to 'submitted')
 */
export const submitRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    const requestDoc = await RequestModel.findById(requestId);
    if (!requestDoc) return res.status(404).json({ error: 'Request not found' });

    requestDoc.status = 'submitted';
    await requestDoc.save();

    return res.json({ ok: true, request: requestDoc });
  } catch (err: any) {
    console.error('❌ submitRequest error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get all requests
 */
export const getRequests = async (_req: Request, res: Response) => {
  try {
    const requests = await RequestModel.find().populate('employeeId', 'firstName lastName email');
    return res.json({ ok: true, requests });
  } catch (err: any) {
    console.error('❌ getRequests error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get single request
 */
export const getRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    const requestDoc = await RequestModel.findById(requestId).populate('employeeId', 'firstName lastName email');
    if (!requestDoc) return res.status(404).json({ error: 'Request not found' });

    return res.json({ ok: true, request: requestDoc });
  } catch (err: any) {
    console.error('❌ getRequest error:', err);
    return res.status(500).json({ error: err.message });
  }
};