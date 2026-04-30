const { Log } = require('./logger');
const { sha256 } = require('./id');

const META_API_VERSION = 'v20.0';
const META_ENDPOINT = (pixelId) =>
  `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events`;

function isEnabled() {
  return process.env.TRACKING_ENABLED === 'true' && !!process.env.FB_PIXEL_ID && !!process.env.FB_ACCESS_TOKEN;
}

function normalizePhone(raw) {
  if (!raw) return undefined;
  const digits = String(raw).replace(/\D+/g, '');
  return digits || undefined;
}

function buildUserData({ ip, userAgent, fbp, fbc, fbclid, email, firstName, lastName, phone, country, city, zip, state, externalId }) {
  const ud = {};
  if (email) ud.em = [sha256(email)];
  if (firstName) ud.fn = [sha256(firstName)];
  if (lastName) ud.ln = [sha256(lastName)];
  const ph = normalizePhone(phone);
  if (ph) ud.ph = [sha256(ph)];
  if (city) ud.ct = [sha256(city)];
  if (state) ud.st = [sha256(state)];
  if (country) ud.country = [sha256(country)];
  if (zip) ud.zp = [sha256(zip)];
  if (externalId) ud.external_id = [sha256(externalId)];
  if (ip) ud.client_ip_address = ip;
  if (userAgent) ud.client_user_agent = userAgent;
  if (fbp) ud.fbp = fbp;
  if (fbc) ud.fbc = fbc;
  if (!fbc && fbclid) {
    ud.fbc = `fb.1.${Date.now()}.${fbclid}`;
  }
  return ud;
}

async function sendMetaEvent({ eventName, eventId, eventTime, sourceUrl, userData, customData, sessionRef }) {
  if (!isEnabled()) {
    Log.event('track_skipped', sessionRef, `Meta CAPI off — ${eventName}`);
    return { ok: false, skipped: true };
  }
  const payload = {
    data: [{
      event_name: eventName,
      event_time: eventTime || Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: sourceUrl,
      action_source: 'website',
      user_data: userData || {},
      custom_data: customData || {},
    }],
  };
  if (process.env.FB_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.FB_TEST_EVENT_CODE;
  }
  const url = `${META_ENDPOINT(process.env.FB_PIXEL_ID)}?access_token=${encodeURIComponent(process.env.FB_ACCESS_TOKEN)}`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      Log.error('capi_meta_fail', sessionRef, `${eventName} HTTP ${resp.status}`, { error: json.error?.message });
      return { ok: false, status: resp.status, error: json.error };
    }
    Log.event('capi_meta_ok', sessionRef, `${eventName} → fbtrace=${json.fbtrace_id || '-'}`, { event_id: eventId });
    return { ok: true, fbtrace: json.fbtrace_id };
  } catch (err) {
    Log.error('capi_meta_fail', sessionRef, `${eventName} fetch error: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

function getClientInfo(req) {
  const fwd = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(fwd) ? fwd[0] : (fwd || '').split(',')[0].trim()) || req.ip || req.connection?.remoteAddress;
  return {
    ip: ip && ip !== '::1' ? ip : undefined,
    userAgent: req.headers['user-agent'],
    fbp: req.cookies?._fbp,
    fbc: req.cookies?._fbc,
  };
}

function getTrackingConfig() {
  return {
    enabled: isEnabled(),
    fbPixelId: process.env.FB_PIXEL_ID || '',
    testEventCode: process.env.FB_TEST_EVENT_CODE || '',
  };
}

module.exports = { sendMetaEvent, buildUserData, getClientInfo, getTrackingConfig, isEnabled };
