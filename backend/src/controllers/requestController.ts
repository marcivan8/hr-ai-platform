import { Request as ExRequest, Response } from 'express';
import ReqModel from '../models/Request';
import { Message } from '../models/Message';
import * as aiService from '../services/aiService';
import { generateAIResponse } from "../services/aiService";
import { generatePDF } from '../services/pdfService';
import path from 'path';
import fs from 'fs';

// Type correct de la fonction IA
const generateSummaryAndScenarios = (aiService as any).generateSummaryAndScenarios;

// ✅ Typage user injecté par middleware JWT
interface AuthRequest extends ExRequest {
  user?: {
    id: string;
    role?: 'employee' | 'hr' | 'admin';
  };
}

// -----------------------
// 📌 Create a Request
// -----------------------
export const askFollowUp = async (req: Request, res: Response) => {
  try {
    const { requestId, userMessage, history } = req.body;

    // fetch request
    const request = await RequestModel.findById(requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    // include current request data in prompt
    const prompt = `
    You are assisting with an HR request. Current data:
    ${JSON.stringify(request, null, 2)}
    User input: ${userMessage}
    Generate next follow-up questions to collect all info for a complete report.
    `;

    const aiReply = await generateAIResponse(prompt, history);

    res.json({ ok: true, aiReply });
  } catch (err: any) {
    console.error("❌ AI follow-up error:", err);
    res.status(500).json({ error: err.message });
  }
};

export async function createRequest(req: AuthRequest, res: Response) {
  try {
    const { type, title, description } = req.body;
    const employeeId = req.user?.id;

    if (!employeeId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const request = new ReqModel({
      employeeId,
      type,
      title,
      description,
      status: 'submitted'
    });

    await request.save();

    await new Message({
      requestId: request._id,
      sender: 'employee',
      text: description
    }).save();

    // ✅ AI preprocessing
    const conv = [{ role: 'employee', content: description }];
    const ai = await generateSummaryAndScenarios(conv, { title, type }).catch(() => null);

    (request as any).aiSummary =
      ai?.summary ||
      ai?.summary_text ||
      (typeof ai === 'string' ? ai : JSON.stringify(ai));

    (request as any).aiScenarios = Array.isArray(ai?.scenarios) ? ai.scenarios : [];

    await request.save();

    return res.json({ ok: true, request });

  } catch (err) {
    console.error('❌ createRequest error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// -----------------------
// 📌 Get Requests (employee or HR)
// -----------------------
export async function getRequests(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.role === 'hr' || user.role === 'admin') {
      const all = await ReqModel.find().populate('employeeId', 'email name');
      return res.json(all);
    }

    const list = await ReqModel.find({ employeeId: user.id })
      .populate('employeeId', 'email name');

    return res.json(list);

  } catch (err) {
    console.error('❌ getRequests error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// -----------------------
// 📌 Get Request by ID
// -----------------------
export async function getRequestById(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;
    const request = await ReqModel.findById(id)
      .populate('employeeId', 'email name');

    if (!request) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.json(request);

  } catch (err) {
    console.error('❌ getRequestById error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// -----------------------
// 📌 Export request to PDF
// -----------------------
export async function exportRequestPdf(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;
    const request = await ReqModel.findById(id)
      .populate('employeeId', 'email name');

    if (!request) {
      return res.status(404).json({ error: 'Not found' });
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

    const filename = `request-${request._id}.pdf`;
    const outPath = path.join(uploadsDir, filename);

    await generatePDF(
      {
        ...request.toObject(),
        employeeName:
          (request as any).employeeId?.name ||
          (request as any).employeeId?.email ||
          'Confidentiel'
      },
      outPath
    );

    return res.download(outPath, filename);

  } catch (err) {
    console.error('❌ exportRequestPdf error:', err);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
}