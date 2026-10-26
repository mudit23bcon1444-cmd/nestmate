// utils/sessionHelper.js — User Agent device parsing and IP address masking
const { UAParser } = require('ua-parser-js');

/**
 * Format user agent string into friendly human-readable device description
 */
function parseDevice(userAgentString) {
  if (!userAgentString) return 'Unknown Device';

  try {
    const parser = new UAParser(userAgentString);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    const browserPart = browser.name ? `${browser.name}${browser.major ? ' ' + browser.major : ''}` : '';
    const osPart = os.name ? `${os.name}${os.version ? ' ' + os.version : ''}` : '';
    const devicePart = device.model || device.type || '';

    const parts = [devicePart, browserPart, osPart].filter(Boolean);
    return parts.length > 0 ? parts.join(' on ') : 'Unknown Device';
  } catch (_) {
    return 'Web Browser';
  }
}

/**
 * Masks IP address to preserve privacy while allowing user to identify network
 * IPv4: 192.168.1.42 -> 192.168.1.***
 * IPv6: 2001:db8:85a3::8a2e:370:7334 -> 2001:db8:85a3:****
 */
function maskIp(ip) {
  if (!ip) return 'Unknown IP';
  const clean = String(ip).replace(/^::ffff:/, '').trim();

  // IPv4
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
    }
  }

  // IPv6
  if (clean.includes(':')) {
    const parts = clean.split(':');
    if (parts.length >= 3) {
      return `${parts[0]}:${parts[1]}:${parts[2]}:****`;
    }
  }

  return 'Local Network';
}

module.exports = {
  parseDevice,
  maskIp
};
