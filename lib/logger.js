const visitors = require('./visitors');

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', gray: '\x1b[90m',
};

const useColor = process.env.LOG_COLOR !== 'off';
const c = (col, s) => (useColor ? `${col}${s}${C.reset}` : String(s));
const SEP = '│';
const TZ = process.env.LOG_TZ || 'Europe/Athens';

function ts() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: TZ });
}

const pad = (s, n) => String(s == null ? '' : s).padEnd(n);

const TAG_W = 15;
const VID_W = 8;
const LOC_W = 14;

const EVENTS = {
  pageview:                     { tag: 'PAGEVIEW',        emoji: '👤', col: null },
  view_content:                 { tag: 'VIEW_CONTENT',    emoji: '👀', col: null },
  search:                       { tag: 'SEARCH',          emoji: '🔍', col: null },
  add_to_cart:                  { tag: 'ADD_TO_CART',     emoji: '🛒', col: null },
  remove_cart:                  { tag: 'REMOVE_CART',     emoji: '🗑',  col: null },
  checkout_start:               { tag: 'CHECKOUT',        emoji: '💳', col: null },
  payment_info:                 { tag: 'PAYMENT_INFO',    emoji: '📝', col: null },
  order_created:                { tag: 'ORDER_CREATED',   emoji: '📦', col: null },
  purchase_capi:                { tag: 'PURCHASE',        emoji: '✅', col: null },
  capi_meta_fail:               { tag: 'CAPI_FAIL',       emoji: '⚠',  col: C.yellow },
  track_skipped:                { tag: 'TRACK_SKIPPED',   emoji: '⏸',  col: null },
  plisio_webhook_invalid:       { tag: 'WEBHOOK_INVALID', emoji: '🚫', col: C.red },
  plisio_webhook_unknown_order: { tag: 'WEBHOOK_UNKNOWN', emoji: '❓', col: C.yellow },
  plisio_webhook_txn_mismatch:  { tag: 'WEBHOOK_TXN_BAD', emoji: '⚠',  col: C.yellow },
  plisio_webhook_child_inferred:{ tag: 'WEBHOOK_CHILD',   emoji: '🔗', col: null },
  plisio_create_failed:         { tag: 'PLISIO_CREATE',   emoji: '❌', col: C.red },
  plisio_api_fail:              { tag: 'PLISIO_API',      emoji: '❌', col: C.red },
  order_invalid_transition:     { tag: 'ORDER_BAD_TRANS', emoji: '⚠',  col: C.yellow },
  server_error:                 { tag: 'SERVER_ERROR',    emoji: '💥', col: C.red },
  unhandled_rejection:          { tag: 'UNHANDLED_REJ',   emoji: '💥', col: C.red },
  uncaught_exception:           { tag: 'UNCAUGHT_EXC',    emoji: '💥', col: C.red },
  orders_init_fail:             { tag: 'ORDERS_INIT',     emoji: '❌', col: C.red },
  orders_write_fail:            { tag: 'ORDERS_WRITE',    emoji: '❌', col: C.red },
};

const SUPPRESSED_KEYS = new Set(['track_received', 'capi_meta_ok']);

function visitorIdFromRef(sessionRef) {
  if (!sessionRef) return '--------';
  const v = visitors.getBySessionRef(sessionRef);
  return v && v.id ? v.id : '--------';
}

function locFromRef(sessionRef) {
  if (!sessionRef) return 'Server';
  const v = visitors.getBySessionRef(sessionRef);
  const s = visitors.formatLocation(v);
  return s && s.length ? s : '?';
}

function row(emoji, tagColor, tag, sessionRef, message, extra) {
  const vid = pad(visitorIdFromRef(sessionRef), VID_W);
  const loc = pad(locFromRef(sessionRef).slice(0, LOC_W), LOC_W);
  const tagStr = pad(tag, TAG_W);
  const tagOut = tagColor ? c(tagColor, tagStr) : tagStr;
  const head =
    `[${c(C.dim, ts())}] ` +
    `${emoji} ` +
    `${tagOut} ` +
    `${c(C.dim, SEP)} ${c(C.dim, vid)} ` +
    `${c(C.dim, SEP)} ${c(C.dim, loc)} ` +
    `${c(C.dim, SEP)}`;
  const body = extra ? `${message} ${c(C.dim, JSON.stringify(extra))}` : message;
  return `${head} ${body}`;
}

const Log = {
  event(key, sessionRef, message, extra) {
    if (SUPPRESSED_KEYS.has(key)) return;
    const e = EVENTS[key] || { tag: key.toUpperCase(), emoji: 'ℹ', col: null };
    console.log(row(e.emoji, e.col, e.tag, sessionRef, message, extra));
  },

  error(key, sessionRef, message, extra) {
    const e = EVENTS[key] || { tag: key.toUpperCase(), emoji: '💥', col: C.red };
    console.error(row(e.emoji, C.red, e.tag, sessionRef, message, extra));
  },

  http(method, url, status, ms, sessionRef) {
    if (status < 400) return;
    const col = status >= 500 ? C.red : C.yellow;
    const emoji = status >= 500 ? '💥' : '⚠';
    const tag = `HTTP_${status}`;
    const msg = `${method} ${url} ${c(C.dim, `${ms}ms`)}`;
    const line = row(emoji, col, tag, sessionRef, msg);
    if (status >= 500) console.error(line);
    else console.log(line);
  },

  system(message, tag) {
    const t = (tag || 'system').toUpperCase();
    console.log(row('🔧', C.cyan, t, null, message));
  },

  warn(message, tag) {
    const t = (tag || 'system').toUpperCase();
    console.warn(row('⚠', C.yellow, t, null, message));
  },

  ok(message, tag) {
    const t = (tag || 'system').toUpperCase();
    console.log(row('✅', C.green, t, null, message));
  },

  startup(port, storeName, trackingEnabled, productCount, categoryCount) {
    const padR = (s, n) => String(s).padEnd(n);
    const geo = visitors.geoipReady() ? 'enabled (geoip-lite)' : 'disabled';
    const lines = [
      '',
      c(C.cyan, '════════════════════════════════════════════════════════════════════════════'),
      '  🧬 ' + c(C.bold, `${storeName}`) + c(C.dim, ' — Research Peptides'),
      c(C.cyan, '────────────────────────────────────────────────────────────────────────────'),
      '  ' + c(C.dim, padR('Server',   9)) + ' http://localhost:' + port,
      '  ' + c(C.dim, padR('Catalog',  9)) + ' ' + productCount + ' peptides × ' + categoryCount + ' categories',
      '  ' + c(C.dim, padR('Tracking', 9)) + ' ' + (trackingEnabled
        ? c(C.green, 'ENABLED') + c(C.dim, ' (Meta Pixel + CAPI)')
        : c(C.dim, 'disabled (no FB_PIXEL_ID)')),
      '  ' + c(C.dim, padR('Geo IP',   9)) + ' ' + c(C.dim, geo),
      '  ' + c(C.dim, padR('Mode',     9)) + ' ' + (process.env.NODE_ENV || 'development'),
      c(C.cyan, '────────────────────────────────────────────────────────────────────────────'),
      '  ' + c(C.dim, 'Log: [TIME] EMOJI EVENT │ VISITOR-ID │ LOCATION │ MESSAGE'),
      c(C.cyan, '════════════════════════════════════════════════════════════════════════════'),
      '',
    ];
    for (const ln of lines) console.log(ln);
  },
};

module.exports = { Log };
