const https = require('https');
const crypto = require('crypto');
const { Log } = require('./logger');

const PLISIO_API_BASE = 'https://api.plisio.net/api/v1';

function isConfigured() {
  return Boolean(process.env.PLISIO_API_KEY);
}

function getApiKey() {
  return process.env.PLISIO_API_KEY || '';
}

function getSecretKey() {
  return process.env.PLISIO_SECRET_KEY || process.env.PLISIO_API_KEY || '';
}

function plisioGet(pathWithQuery, sessionRef) {
  return new Promise((resolve, reject) => {
    const url = `${PLISIO_API_BASE}${pathWithQuery}`;
    const opts = {
      method: 'GET',
      timeout: 30000,
      headers: {
        'User-Agent': 'helix-research/1.0 (+node)',
        'Accept': 'application/json',
      },
    };
    const req = https.request(url, opts, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) { json = { status: 'error', data: { message: 'invalid_json', raw: body.slice(0, 200) } }; }
        if (res.statusCode >= 400 || json.status === 'error') {
          Log.error('plisio_api_fail', sessionRef, `${pathWithQuery.split('?')[0]} HTTP ${res.statusCode}`, {
            code: json?.data?.code, msg: json?.data?.message, raw: body.slice(0, 400),
          });
        }
        resolve({ httpStatus: res.statusCode, json });
      });
    });
    req.on('timeout', () => { req.destroy(new Error('plisio_timeout')); });
    req.on('error', (err) => {
      Log.error('plisio_api_fail', sessionRef, `network error: ${err.message}`);
      reject(err);
    });
    req.end();
  });
}

function buildQuery(params) {
  return Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

async function createInvoice({ orderNumber, orderName, sourceAmountUsd, email, callbackUrl, successInvoiceUrl, failInvoiceUrl, expireMin, allowedPsysCids, sessionRef }) {
  if (!isConfigured()) throw new Error('plisio_not_configured');
  const callback = appendJsonTrue(callbackUrl);
  const params = {
    source_currency: 'USD',
    source_amount: Number(sourceAmountUsd).toFixed(2),
    order_number: orderNumber,
    order_name: orderName.slice(0, 250),
    callback_url: callback,
    success_invoice_url: successInvoiceUrl,
    fail_invoice_url: failInvoiceUrl,
    expire_min: expireMin || 30,
    allowed_psys_cids: allowedPsysCids || undefined,
    email: email || undefined,
    plugin: 'helix-research',
    version: '1.0.0',
    api_key: getApiKey(),
  };
  const query = buildQuery(params);
  const { json } = await plisioGet(`/invoices/new?${query}`, sessionRef);
  return json;
}

async function getOperation(txnId, sessionRef) {
  if (!isConfigured()) throw new Error('plisio_not_configured');
  const query = buildQuery({ api_key: getApiKey() });
  const { json } = await plisioGet(`/operations/${encodeURIComponent(txnId)}?${query}`, sessionRef);
  return json;
}

async function getCurrencies(sessionRef) {
  if (!isConfigured()) throw new Error('plisio_not_configured');
  const query = buildQuery({ api_key: getApiKey() });
  const { json } = await plisioGet(`/currencies?${query}`, sessionRef);
  return json;
}

function appendJsonTrue(url) {
  if (!url) return url;
  return url + (url.includes('?') ? '&' : '?') + 'json=true';
}

function verifyWebhookSignature(rawBuffer, secretKey) {
  if (!Buffer.isBuffer(rawBuffer) || !secretKey) return { ok: false, reason: 'bad_input' };
  let data;
  try { data = JSON.parse(rawBuffer.toString('utf8')); } catch (_) { return { ok: false, reason: 'invalid_json' }; }
  if (!data || typeof data !== 'object' || !data.verify_hash) return { ok: false, reason: 'no_hash' };
  const provided = String(data.verify_hash);
  const ordered = { ...data };
  delete ordered.verify_hash;
  const string = JSON.stringify(ordered);
  const expected = crypto.createHmac('sha1', secretKey).update(string).digest('hex');
  let providedBuf, expectedBuf;
  try {
    providedBuf = Buffer.from(provided, 'hex');
    expectedBuf = Buffer.from(expected, 'hex');
  } catch (_) { return { ok: false, reason: 'hex_decode' }; }
  if (providedBuf.length !== expectedBuf.length) return { ok: false, reason: 'length_mismatch', data };
  const match = crypto.timingSafeEqual(providedBuf, expectedBuf);
  return { ok: match, reason: match ? 'ok' : 'mismatch', data };
}

function mapPlisioStatus(plisioStatus) {
  switch (plisioStatus) {
    case 'completed':
    case 'mismatch':
      return 'paid';
    case 'pending internal':
    case 'pending':
    case 'new':
      return 'awaiting_payment';
    case 'cancelled duplicate':
      return 'superseded';
    case 'expired':
    case 'cancelled':
      return 'expired';
    case 'error':
      return 'error';
    default:
      return 'awaiting_payment';
  }
}

module.exports = {
  isConfigured,
  createInvoice,
  getOperation,
  getCurrencies,
  verifyWebhookSignature,
  mapPlisioStatus,
};
