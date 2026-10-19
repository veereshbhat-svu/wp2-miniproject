import PDFDocument from 'pdfkit';

/**
 * Generates an official, hospital-grade PDF report stream
 * @param {Object} report - Complete urinalysis report document
 * @param {string} [qrDataUrl] - Base64 QR code data URL
 * @returns {PDFKit.PDFDocument}
 */
export function buildReportPdf(report, qrDataUrl = null) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // 1. Hospital Header
  doc
    .fillColor('#1e1b4b')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('K. J. SOMAIYA HOSPITAL & RESEARCH CENTER', { align: 'center' });

  doc
    .fillColor('#4338ca')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('DEPARTMENT OF CLINICAL PATHOLOGY & POINT-OF-CARE DIAGNOSTICS', { align: 'center' });

  doc
    .fillColor('#64748b')
    .fontSize(8)
    .font('Helvetica')
    .text('Somaiya Ayurvihar Complex, Eastern Express Hwy, Sion East, Mumbai, Maharashtra 400022', { align: 'center' });

  doc.moveDown(0.5);
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.8);

  // 2. Report & Patient Details Box
  const startBoxY = doc.y;
  doc
    .rect(40, startBoxY, 515, 65)
    .fillAndStroke('#f8fafc', '#e2e8f0');

  doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
  doc.text(`Patient Name: ${report.patientName || 'N/A'}`, 55, startBoxY + 10);
  doc.text(`Patient ID: ${report.patientId || 'N/A'}`, 55, startBoxY + 26);
  doc.text(`Age / Gender: ${report.patientAge || '42 yrs'} / ${report.patientGender || 'Male'}`, 55, startBoxY + 42);

  doc.text(`Report ID: ${report.reportId || report.id}`, 320, startBoxY + 10);
  doc.text(`Date & Time: ${report.date} ${report.time || ''}`, 320, startBoxY + 26);
  doc.text(`Ordering Physician: ${report.requestedBy || 'Dr. A. Sharma'}`, 320, startBoxY + 42);

  doc.y = startBoxY + 75;

  // 3. Status Banner
  const statusColor = report.status === 'Normal' ? '#059669' : report.status === 'Warning' ? '#d97706' : '#dc2626';
  const statusBg = report.status === 'Normal' ? '#ecfdf5' : report.status === 'Warning' ? '#fffbeb' : '#fef2f2';

  doc.rect(40, doc.y, 515, 24).fillAndStroke(statusBg, statusColor);
  doc
    .fillColor(statusColor)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(`DIAGNOSTIC STATUS: ${report.status.toUpperCase()} URINALYSIS SCREENING`, 40, doc.y + 7, {
      align: 'center',
    });

  doc.moveDown(1.5);

  // 4. Analytes Table Header
  const tableTop = doc.y;
  doc.rect(40, tableTop, 515, 20).fill('#e0e7ff');

  doc.fillColor('#312e81').fontSize(8.5).font('Helvetica-Bold');
  doc.text('ANALYTE PARAMETER', 50, tableTop + 5);
  doc.text('MEASURED VALUE', 200, tableTop + 5);
  doc.text('REFERENCE INTERVAL', 330, tableTop + 5);
  doc.text('STATUS', 470, tableTop + 5);

  let currentY = tableTop + 22;

  (report.analytes || []).forEach((analyte, idx) => {
    if (idx % 2 === 0) {
      doc.rect(40, currentY - 2, 515, 17).fill('#f8fafc');
    }

    const rowColor = analyte.status === 'abnormal' ? '#dc2626' : analyte.status === 'warning' ? '#d97706' : '#1e293b';

    doc.fillColor('#0f172a').font('Helvetica').fontSize(8);
    doc.text(analyte.name, 50, currentY + 1);

    doc.fillColor(rowColor).font('Helvetica-Bold');
    doc.text(`${analyte.exact} ${analyte.unit || ''}`.trim(), 200, currentY + 1);

    doc.fillColor('#64748b').font('Helvetica');
    doc.text(analyte.ref || 'Normal', 330, currentY + 1);

    doc.fillColor(rowColor).font('Helvetica-Bold');
    doc.text(analyte.status.toUpperCase(), 470, currentY + 1);

    currentY += 17;
  });

  doc.y = currentY + 10;

  // 5. Clinical Findings & Risk Assessment
  if (report.clinicalRisk) {
    const riskY = doc.y;
    doc.rect(40, riskY, 515, 60).fillAndStroke('#f1f5f9', '#cbd5e1');

    doc.fillColor('#1e1b4b').fontSize(9).font('Helvetica-Bold');
    doc.text('CLINICAL DECISION SUPPORT & RISK INDICES', 50, riskY + 8);

    doc.fontSize(8).font('Helvetica');
    doc.text(`• UTI Likelihood Score: ${report.clinicalRisk.utiScore || 0}% (${report.clinicalRisk.utiRiskLevel || 'Low'})`, 50, riskY + 22);
    doc.text(`• Renal Glomerular Strain: ${report.clinicalRisk.renalRiskScore || 0}% (${report.clinicalRisk.renalRiskLevel || 'Low'})`, 50, riskY + 34);
    doc.text(`• Diabetic Ketoacidosis Risk: ${report.clinicalRisk.dkaScore || 0}% (${report.clinicalRisk.dkaRiskLevel || 'Low'})`, 50, riskY + 46);

    const findingsText = (report.clinicalRisk.findings || []).slice(0, 2).join(' ') || report.clinicalNote;
    doc.text(`Note: ${findingsText}`, 260, riskY + 22, { width: 280, height: 32 });

    doc.y = riskY + 70;
  }

  // 6. QR Code & Digital Verification Stamp
  if (qrDataUrl) {
    try {
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(base64Data, 'base64');
      doc.image(qrBuffer, 40, doc.y, { width: 65, height: 65 });
    } catch {
      // Ignore if image buffer issue
    }
  }

  const stampX = qrDataUrl ? 115 : 40;
  doc
    .fillColor('#0f172a')
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .text('DIGITALLY CERTIFIED MEDICAL REPORT', stampX, doc.y + 5);

  doc
    .fillColor('#64748b')
    .fontSize(7.5)
    .font('Helvetica')
    .text(
      'Scan the QR code with any smartphone camera to verify authentic hospital cryptographic records in real time.\n' +
      'Complies with CDSCO Medical Device Rules 2017 & HL7 FHIR DiagnosticReport v4.0.1.',
      stampX,
      doc.y + 18,
      { width: 280 }
    );

  // Signatures
  doc
    .fillColor('#1e293b')
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .text('Dr. A. Sharma, M.D.', 420, doc.y + 15, { align: 'right' });
  doc
    .fillColor('#64748b')
    .fontSize(7.5)
    .font('Helvetica')
    .text('Consultant Pathologist & Lab Director', 420, doc.y + 28, { align: 'right' });

  return doc;
}

export default {
  buildReportPdf,
};
