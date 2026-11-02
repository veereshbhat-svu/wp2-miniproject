import QRCode from 'qrcode';
import os from 'os';

/**
 * Returns all non-internal IPv4 addresses, prioritizing Wi-Fi
 */
export function getAllLocalIpAddresses() {
  const nets = os.networkInterfaces();
  const list = [];

  for (const [name, addrs] of Object.entries(nets)) {
    for (const a of addrs) {
      if (a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.')) {
        list.push({
          name,
          address: a.address,
          isWifi: /wi-fi|wlan|wireless/i.test(name),
        });
      }
    }
  }

  // Sort Wi-Fi first, then Ethernet
  list.sort((a, b) => (b.isWifi ? 1 : 0) - (a.isWifi ? 1 : 0));
  return list;
}

/**
 * Discovers the machine's primary local IPv4 address (Wi-Fi preferred)
 */
export function getLocalIpAddress() {
  const ips = getAllLocalIpAddresses();
  if (ips.length > 0) {
    return ips[0].address;
  }
  return 'localhost';
}

/**
 * Generates a high-contrast QR code data URL for mobile verification
 * @param {string} reportId - The unique report ID (e.g. KJS-8219)
 * @param {string} [baseUrl] - Custom base host URL or custom IP
 * @returns {Promise<{ qrDataUrl: string, verifyUrl: string, ip: string }>}
 */
export async function generateReportQrCode(reportId, baseUrl = null) {
  let host = baseUrl;
  const primaryIp = getLocalIpAddress();

  if (!host) {
    host = `http://${primaryIp}:${process.env.PORT || 5000}`;
  } else if (!host.startsWith('http://') && !host.startsWith('https://')) {
    // If just an IP was passed
    host = `http://${host}:${process.env.PORT || 5000}`;
  }

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

  return { qrDataUrl, verifyUrl, ip: primaryIp };
}

export default {
  getAllLocalIpAddresses,
  getLocalIpAddress,
  generateReportQrCode,
};
