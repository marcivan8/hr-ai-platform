import PDFDocument from 'pdfkit';
import { IRequest } from '../models/Request';
import fs from 'fs';

export function generatePDF(
  request: Partial<IRequest> & { employeeName?: string },
  outPath: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const stream = fs.createWriteStream(outPath);

      doc.pipe(stream);

      // Header
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('Dossier RH — Demande', { align: 'center' });
      
      doc.moveDown(1.5);

      // Request details
      doc.fontSize(12).font('Helvetica-Bold').text('Informations générales');
      doc.fontSize(10).font('Helvetica');
      
      doc.text(`Titre: ${request.title || 'Non spécifié'}`, { indent: 20 });
      doc.text(`Type: ${request.type || request.requestType || 'Non spécifié'}`, { indent: 20 });
      doc.text(`Statut: ${request.status || 'Non spécifié'}`, { indent: 20 });
      doc.text(`Priorité: ${request.priority || 'Non spécifiée'}`, { indent: 20 });
      doc.text(`Employé: ${request.employeeName || 'Confidentiel'}`, { indent: 20 });
      
      doc.moveDown();

      // Description
      if (request.description) {
        doc.fontSize(12).font('Helvetica-Bold').text('Description:');
        doc.fontSize(10).font('Helvetica').text(request.description, { 
          lineGap: 4,
          indent: 20,
          align: 'justify'
        });
        doc.moveDown();
      }

      // AI Summary
      if (request.aiSummary) {
        doc.fontSize(12).font('Helvetica-Bold').text('Résumé IA:');
        doc.fontSize(10).font('Helvetica').text(request.aiSummary, {
          lineGap: 4,
          indent: 20,
          align: 'justify'
        });
        doc.moveDown();
      }

      // Scenarios
      if (Array.isArray(request.aiScenarios) && request.aiScenarios.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('Scénarios proposés:');
        doc.fontSize(10).font('Helvetica');
        
        request.aiScenarios.forEach((scenario: any, index: number) => {
          const description = scenario.description || 
                            (typeof scenario === 'string' ? scenario : JSON.stringify(scenario));
          doc.text(`${index + 1}. ${description}`, { 
            indent: 20,
            lineGap: 3
          });
        });
        doc.moveDown();
      }

      // HR Notes
      if (request.hrNotes) {
        doc.fontSize(12).font('Helvetica-Bold').text('Notes RH:');
        doc.fontSize(10).font('Helvetica').text(request.hrNotes, {
          lineGap: 4,
          indent: 20,
          align: 'justify'
        });
        doc.moveDown();
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').text(
        `Document généré le ${new Date().toLocaleDateString('fr-FR')}`,
        { align: 'center' }
      );

      doc.end();

      stream.on('finish', () => {
        console.log(`✅ PDF generated successfully: ${outPath}`);
        resolve();
      });

      stream.on('error', (error) => {
        console.error('❌ PDF generation error:', error);
        reject(error);
      });

    } catch (error) {
      console.error('❌ PDF generation error:', error);
      reject(error);
    }
  });
}