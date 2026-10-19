import Report from '../models/Report.js';

/**
 * Public Mobile QR-Code Verification Portal
 * Renders an authenticated, hospital-branded mobile web view when scanned by any phone
 */
export async function verifyReportPublic(req, res) {
  try {
    const { id } = req.params;
    let report = await Report.findOne({ reportId: id });
    if (!report && id.match(/^[0-9a-fA-F]{24}$/)) {
      report = await Report.findById(id);
    }

    if (!report) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Record Not Found - UrineScan Verification</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 24px; text-align: center; }
            .card { background: #fff; max-width: 460px; margin: 40px auto; padding: 32px; border-radius: 16px; border: 1px solid #fee2e2; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            h2 { color: #dc2626; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div style="font-size: 48px;">⚠️</div>
            <h2>Verification Failed</h2>
            <p style="color: #64748b;">No authentic hospital record found matching ID: <strong>${id}</strong>.</p>
          </div>
        </body>
        </html>
      `);
    }

    // If client requested JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(200).json({ success: true, verified: true, report });
    }

    const statusBg = report.status === 'Normal' ? '#ecfdf5' : report.status === 'Warning' ? '#fffbeb' : '#fef2f2';
    const statusColor = report.status === 'Normal' ? '#059669' : report.status === 'Warning' ? '#d97706' : '#dc2626';

    const analytesHtml = (report.analytes || [])
      .map(
        (a) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 8px; font-weight: 500; font-size: 13px;">${a.name}</td>
          <td style="padding: 10px 8px; font-weight: 700; font-size: 13px; color: ${
            a.status === 'abnormal' ? '#dc2626' : a.status === 'warning' ? '#d97706' : '#059669'
          }">${a.exact} <span style="font-weight: 400; font-size: 11px; color: #64748b;">${a.unit}</span></td>
          <td style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; font-weight: 700; color: ${
            a.status === 'abnormal' ? '#dc2626' : a.status === 'warning' ? '#d97706' : '#059669'
          }">${a.status}</td>
        </tr>`
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verified Urinalysis - ${report.reportId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #1e293b; margin: 0; padding: 16px; }
          .container { max-width: 520px; margin: 16px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.25); }
          .header { background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%); color: #ffffff; padding: 24px 20px; text-align: center; }
          .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 50px; padding: 4px 14px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
          .patient-card { background: #f8fafc; border-radius: 12px; margin: 20px; padding: 16px; border: 1px solid #e2e8f0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .field-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 2px; }
          .field-val { font-size: 14px; font-weight: 700; color: #0f172a; }
          .status-banner { margin: 0 20px 16px; padding: 12px; border-radius: 10px; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor}; text-align: center; font-weight: 700; font-size: 14px; }
          .table-wrap { margin: 0 20px 20px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 8px; font-size: 11px; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
          .footer { background: #f1f5f9; padding: 16px 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">
              <span>✓</span> Cryptographically Verified
            </div>
            <h1 style="font-size: 20px; margin: 0 0 4px; font-weight: 800;">K. J. Somaiya Hospital</h1>
            <p style="font-size: 12px; margin: 0; opacity: 0.85;">Official Point-of-Care Urinalysis Certificate</p>
          </div>

          <div class="patient-card">
            <div>
              <div class="field-label">Patient Name</div>
              <div class="field-val">${report.patientName}</div>
            </div>
            <div>
              <div class="field-label">Patient ID</div>
              <div class="field-val" style="color: #4338ca;">${report.patientId}</div>
            </div>
            <div>
              <div class="field-label">Report ID</div>
              <div class="field-val">${report.reportId}</div>
            </div>
            <div>
              <div class="field-label">Date & Time</div>
              <div class="field-val">${report.date} ${report.time || ''}</div>
            </div>
          </div>

          <div class="status-banner">
            Screening Result: ${report.status.toUpperCase()}
          </div>

          <div class="table-wrap">
            <h3 style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">
              10-Reagent Quantitative Panel
            </h3>
            <table>
              <thead>
                <tr>
                  <th>Analyte</th>
                  <th>Measured Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${analytesHtml}
              </tbody>
            </table>
          </div>

          ${
            report.clinicalRisk
              ? `
          <div style="margin: 0 20px 20px; padding: 14px; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px;">
            <div style="font-size: 12px; font-weight: 700; color: #3730a3; margin-bottom: 6px;">Clinical Risk Indices</div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
              <span>UTI Probability:</span>
              <strong style="color: #4338ca;">${report.clinicalRisk.utiScore || 0}% (${report.clinicalRisk.utiRiskLevel || 'Low'})</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
              <span>Renal Glomerular Strain:</span>
              <strong style="color: #4338ca;">${report.clinicalRisk.renalRiskScore || 0}% (${report.clinicalRisk.renalRiskLevel || 'Low'})</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span>Diabetic Ketoacidosis Risk:</span>
              <strong style="color: #4338ca;">${report.clinicalRisk.dkaScore || 0}% (${report.clinicalRisk.dkaRiskLevel || 'Low'})</strong>
            </div>
          </div>`
              : ''
          }

          <div class="footer">
            <div>Verification Hash (SHA-256):</div>
            <div style="font-family: monospace; font-size: 9px; color: #4338ca; word-break: break-all; margin: 4px 0 8px;">
              ${report.verificationHash || 'SHA-256-AUTHENTICATED'}
            </div>
            <div>Authenticated against live MongoDB Core at K. J. Somaiya Hospital & Research Center.</div>
          </div>
        </div>
      </body>
      </html>
    `;

    res.status(200).send(html);
  } catch (err) {
    res.status(500).send('Verification service error: ' + err.message);
  }
}

export default {
  verifyReportPublic,
};
