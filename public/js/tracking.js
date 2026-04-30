(function () {
  'use strict';

  const C = window.HELIX || {};
  const TRACKING = {
    pixelId: C.pixelId || '',
    enabled: !!C.trackingEnabled,
    currency: C.currency || 'USD',
  };

  function getCookie(name) {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  function setCookie(name, value, days) {
    const d = new Date(); d.setTime(d.getTime() + days * 86400000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
  }

  function captureClickIds() {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get('fbclid');
    if (fbclid) {
      const fbcVal = `fb.1.${Date.now()}.${fbclid}`;
      setCookie('_fbc', fbcVal, 90);
      setCookie('_fbclid', fbclid, 90);
    }
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((k) => {
      const v = params.get(k);
      if (v) setCookie(`_${k}`, v, 90);
    });
  }

  function generateEventId(eventName) {
    const ts = Date.now();
    const rnd = Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 9);
    return `${eventName}_${ts}_${rnd}`;
  }

  function sha256Hex(text) {
    if (!text) return '';
    const buf = new TextEncoder().encode(String(text).trim().toLowerCase());
    return crypto.subtle.digest('SHA-256', buf).then((hashBuf) => {
      const arr = Array.from(new Uint8Array(hashBuf));
      return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
    });
  }

  function getCookies() {
    return {
      fbp: getCookie('_fbp'),
      fbc: getCookie('_fbc'),
      fbclid: getCookie('_fbclid'),
    };
  }

  function getUTM() {
    return ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
      .reduce((acc, k) => { const v = getCookie(`_${k}`); if (v) acc[k] = v; return acc; }, {});
  }

  function fireBrowserPixel(name, data, eventID) {
    if (!TRACKING.enabled || typeof window.fbq !== 'function') return;
    const opts = eventID ? { eventID } : undefined;
    if (data) window.fbq('track', name, data, opts);
    else window.fbq('track', name, undefined, opts);
  }

  async function fireServerCAPI(name, data, eventID, user) {
    try {
      const resp = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          event: name,
          eventId: eventID,
          sourceUrl: window.location.href,
          data: data || {},
          user: user || {},
          cookies: getCookies(),
          utm: getUTM(),
        }),
      });
      return await resp.json().catch(() => ({}));
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  async function track(eventName, data, opts) {
    const eventID = (opts && opts.eventId) || generateEventId(eventName);
    fireBrowserPixel(eventName, data, eventID);
    const user = (opts && opts.user) || {};
    fireServerCAPI(eventName, data, eventID, user);
    return eventID;
  }

  async function trackPurchase(data, eventID) {
    fireBrowserPixel('Purchase', data, eventID);
    return eventID;
  }

  function init() {
    captureClickIds();
    const ctx = (window.HELIX && window.HELIX.pageContext) || '';
    if (ctx === 'product') {
      const main = document.querySelector('[data-product-id]') || document.getElementById('pdp-add-to-cart');
      const data = main ? {
        content_ids: [main.dataset.productId],
        content_name: main.dataset.productName,
        content_type: 'product',
        currency: TRACKING.currency,
        value: parseFloat(main.dataset.productPrice) || undefined,
        content_category: main.dataset.productCategory,
      } : {};
      track('ViewContent', data);
    } else {
      track('PageView');
    }
  }

  window.HELIX_TRACK = {
    track, trackPurchase, generateEventId,
    enabled: TRACKING.enabled,
    pixelId: TRACKING.pixelId,
    currency: TRACKING.currency,
    sha256Hex,
    getCookies,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
