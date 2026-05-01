const crypto = require('crypto');

let geoip = null;
try {
  geoip = require('geoip-lite');
} catch (_) {
  geoip = null;
}

const MAX_VISITORS = 5000;
const visitorsByIp = new Map();
const visitorsBySessionRef = new Map();

function isLocalIP(ip) {
  if (!ip || ip === 'unknown') return true;
  if (ip === '::1' || ip === '127.0.0.1') return true;
  if (ip.startsWith('192.168.') || ip.startsWith('10.')) return true;
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) return true;
  return false;
}

function extractIp(req) {
  if (!req || !req.headers) return 'unknown';
  const fwd = req.headers['x-forwarded-for'];
  let raw = '';
  if (Array.isArray(fwd)) raw = fwd[0];
  else if (typeof fwd === 'string') raw = fwd.split(',')[0];
  if (!raw) raw = req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || '';
  if (!raw) raw = req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
  return String(raw || 'unknown').trim().replace(/^::ffff:/, '');
}

function lookupLocation(ip) {
  if (isLocalIP(ip)) return { city: 'Local', country: 'DEV' };
  if (!geoip) return { city: null, country: '??' };
  try {
    const geo = geoip.lookup(ip);
    if (!geo) return { city: null, country: '??' };
    return { city: geo.city || null, country: geo.country || '??' };
  } catch (_) {
    return { city: null, country: '??' };
  }
}

function generateVisitorId(ip) {
  const hash = crypto.createHash('md5').update(String(ip)).digest('hex');
  return `v-${hash.substring(0, 6)}`;
}

function evictOldestIfNeeded() {
  if (visitorsByIp.size <= MAX_VISITORS) return;
  let oldestIp = null;
  let oldestTs = Infinity;
  for (const [ip, v] of visitorsByIp.entries()) {
    if (v.firstSeen < oldestTs) {
      oldestTs = v.firstSeen;
      oldestIp = ip;
    }
  }
  if (oldestIp) visitorsByIp.delete(oldestIp);
}

function getOrCreateVisitor(req, sessionRef) {
  const ip = extractIp(req);
  let visitor = visitorsByIp.get(ip);
  if (!visitor) {
    const loc = lookupLocation(ip);
    visitor = {
      id: generateVisitorId(ip),
      ip,
      city: loc.city,
      country: loc.country,
      firstSeen: Date.now(),
      eventCount: 0,
    };
    visitorsByIp.set(ip, visitor);
    evictOldestIfNeeded();
  }
  visitor.eventCount += 1;
  visitor.lastSeen = Date.now();
  if (sessionRef) visitorsBySessionRef.set(sessionRef, visitor);
  return visitor;
}

function getBySessionRef(sessionRef) {
  if (!sessionRef) return null;
  return visitorsBySessionRef.get(sessionRef) || null;
}

function formatLocation(visitor) {
  if (!visitor) return '';
  if (visitor.country === 'DEV') return 'Local';
  if (visitor.city && visitor.city !== 'Unknown') {
    return `${visitor.city}, ${visitor.country}`;
  }
  if (visitor.country && visitor.country !== '??') return visitor.country;
  return '?';
}

function geoipReady() {
  return Boolean(geoip);
}

module.exports = {
  getOrCreateVisitor,
  getBySessionRef,
  formatLocation,
  extractIp,
  isLocalIP,
  geoipReady,
};
