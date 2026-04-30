const crypto = require('crypto');

function randomId(len = 12) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}

function eventId(eventName) {
  const ts = Date.now();
  const rnd = randomId(9);
  return `${eventName}_${ts}_${rnd}`;
}

function orderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = randomId(6).toUpperCase();
  return `HX-${ts}-${rnd}`;
}

function ensureSessionId(req, res) {
  let sid = req.cookies && req.cookies._hx_sid;
  if (!sid || !/^[a-f0-9]{16}$/.test(sid)) {
    sid = randomId(16);
    res.cookie('_hx_sid', sid, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 365,
      path: '/',
    });
  }
  return sid;
}

function sha256(value) {
  if (value === undefined || value === null) return undefined;
  return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

module.exports = { randomId, eventId, orderId, ensureSessionId, sha256 };
