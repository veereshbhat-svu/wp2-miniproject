import QRCode from 'qrcode';
import os from 'os';

/**
 * Discovers the machine's primary local IPv4 address
 */
export function getLocalIpAddress() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

/**
 * Generates a high-contrast QR code data URL for mobile verification
 * @param {string} reportId - The unique report ID (e.g. KJS-8219)
 * @param {string} [baseUrl] - Custom base host URL
 * @returns {Promise<{ qrDataUrl: string, verifyUrl: string }>}
 */
export async function generateReportQrCode(reportId, baseUrl = null) {
  const host = baseUrl || `http://${getLocalIpAddress()}:${process.env.PORT || 5000}`;
  const verifyUrl = `${host}/verify/${reportId}`;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 1,
    color: {
      dark: '#1e1b4b',
      light: '#ffffff',
    },
    width: 256,
  });

  return { qrDataUrl, verifyUrl };
}

export default {
  getLocalIpAddress,
  generateReportQrCode,
};
