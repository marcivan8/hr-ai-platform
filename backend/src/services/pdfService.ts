import PDFDocument = require('pdfkit');
import { IRequest } from '../models/Request';
import fs from 'fs';

export function generatePDF(
  request: Partial<IRequest> & { employeeName?: string },
  outPath: string
) {
  return new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(outPath);

    doc.pipe(stream);

    doc.fontSize(18).text('Dossier RH — Demande', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Titre: ${request.title || ''}`);
    doc.text(`Type: ${request.type || ''}`);
    doc.text(`Employé: ${request.employeeName || 'Confidentiel'}`);
    doc.moveDown();

    doc.text('Description:');
    doc.fontSize(10).text(request.description || '—', { lineGap: 4 });
    doc.moveDown();

    doc.fontSize(12).text('Résumé IA:');
    doc.fontSize(10).text(request.aiSummary || '—');
    doc.moveDown();

    if (Array.isArray(request.aiScenarios) && request.aiScenarios.length > 0) {
      doc.fontSize(12).text('Scénarios proposés:');
      request.aiScenarios.forEach((s: any, i: number) => {
        doc.fontSize(10).text(`${i + 1}. ${s.description || JSON.stringify(s)}`);
      });
    }

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}