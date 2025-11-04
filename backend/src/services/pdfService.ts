// src/services/pdfService.ts
import PDFDocument from 'pdfkit';
import fs from 'fs';
import { IRequest } from '../models/Request';

export async function generatePDF(request: Partial<IRequest> & { employeeName?: string }, outPath: string) {
  return new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    doc.fontSize(18).text('Dossier RH — Demande', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Titre: ${request.title || ''}`);
    doc.text(`Type: ${request.requestType || request.type || ''}`);
    doc.text(`Employé: ${request.employeeName || 'Confidentiel'}`);
    doc.text(`Statut: ${request.status || ''}`);
    doc.moveDown();

    doc.fontSize(12).text('Description:');
    doc.fontSize(10).text(request.description || '', { lineGap: 4 });
    doc.moveDown();

    if (request.aiSummary) {
      doc.fontSize(12).text('Résumé IA:');
      doc.fontSize(10).text(request.aiSummary);
      doc.moveDown();
    }

    if ((request.aiScenarios || []).length) {
      doc.fontSize(12).text('Scénarios proposés:');
      (request.aiScenarios || []).forEach((s: any, i: number) => {
        doc.fontSize(10).text(`${i + 1}. ${s.description || JSON.stringify(s)}`);
      });
      doc.moveDown();
    }

    // Get last 20 conversation messages (support old .history and new conversationData.messages)
const conv =
  request.conversationData?.messages ||
  (request as any).history ||
  [];

const recentConv = conv.slice(-20);

if (recentConv.length) {
  doc.fontSize(12).text('Conversation (derniers échanges):');
  doc.fontSize(10);

  recentConv.forEach((m: any) => {
    const who = m.role === 'assistant' ? 'Assistant' : 'Employé';
    const time = m.timestamp ? new Date(m.timestamp).toLocaleString('fr-FR') : '';
    doc.text(`${who} [${time}]: ${m.content}`, { lineGap: 3 });
  });

  doc.moveDown();
}

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });
}