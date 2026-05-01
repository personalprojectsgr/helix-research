const visitors = require('./visitors');

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', gray: '\x1b[90m',
};

const useColor = process.env.LOG_COLOR !== 'off';
const c = (col, s) => (useColor ? `${col}${s}${C.reset}` : String(s));
const SEP = useColor ? c(C.dim, '|') : '|';
const TZ = process.env.LOG_TZ || 'Europe/Athens';

function ts() {
  const d = new Date();
  const t = d.toLocaleTimeString('en-GB', { hour12: false, timeZone: TZ });
  const ms = String(d.getUTCMilliseconds()).padStart(3, '0');
  return `${t}.${ms}`;
}

const pad = (s, n) => String(s == null ? '' : s).padEnd(n);

const TAG_W = 20;
const REF_W = 8;
const LOC_W = 16;

const EVENTS = {
  pageview:                    { col: C.gray,    tag: 'PAGEVIEW' },
  view_content:                { col: C.cyan,    tag: 'VIEW_CONTENT' },
  search:                      { col: C.cyan,    tag: 'SEARCH' },
  add_to_cart:                 { col: C.blue,    tag: 'ADD_TO_CART' },
  remove_cart:                 { col: C.gray,    tag: 'REMOVE_CART' },
  checkout_start:              { col: C.magenta, tag: 'CHECKOUT' },
  payment_info:                { col: C.magenta, tag: 'PAYMENT_INFO' },
  order_created:               { col: C.green,   tag: 'ORDER_CREATED' },
  purchase_capi:               { col: C.green,   tag: 'PURCHASE_CAPI' },
  capi_meta_ok:                { col: C.green,   tag: 'CAPI_META_OK' },
  capi_meta_fail:              { col: C.red,     tag: 'CAPI_META_FAIL' },
  track_received:              { col: C.gray,    tag: 'TRACK_RECEIVED' },
  track_skipped:               { col: C.gray,    tag: 'TRACK_SKIPPED' },
  plisio_webhook_invalid:      { col: C.red,     tag: 'WEBHOOK_INVALID' },
  plisio_webhook_unknown_order:{ col: C.yellow,  tag: 'WEBHOOK_UNKNOWN' },
  plisio_webhook_txn_mismatch: { col: C.yellow,  tag: 'WEBHOOK_TXN_BAD' },
  plisio_webhook_child_inferred:{ col: C.cyan,   tag: 'WEBHOOK_CHILD' },
  plisio_create_failed:        { col: C.red,     tag: 'PLISIO_CREATE_FAIL' },
  plisio_api_fail:             { col: C.red,     tag: 'PLISIO_API_FAIL' },
  order_invalid_transition:    { col: C.yellow,  tag: 'ORDER_BAD_TRANS' },
  server_error:                { col: C.red,     tag: 'SERVER_ERROR' },
  unhandled_rejection:         { col: C.red,     tag: 'UNHANDLED_REJ' },
  uncaught_exception:          { col: C.red,     tag: 'UNCAUGHT_EXC' },
  orders_init_fail:            { col: C.red,     tag: 'ORDERS_INIT_FAIL' },
  orders_write_fail:           { col: C.red,     tag: 'ORDERS_WRITE_FAIL' },
};

function locStr(sessionRef) {
  const v = visitors.getBySessionRef(sessionRef);
  return pad(visitors.formatLocation(v), LOC_W);
}

function row(level, color, tag, sessionRef, message, extra) {
  const ref = pad(sessionRef || '--------', REF_W);
  const loc = locStr(sessionRef);
  const head =
    `${c(C.dim, ts())}  ` +
    `${c(color, pad(level, 4))}  ` +
    `${c(color, pad(tag, TAG_W))} ` +
    `${SEP} ${c(C.dim, ref)} ` +
    `${SEP} ${c(C.dim, loc)} ` +
    `${SEP}`;
  const body = extra ? `${message} ${c(C.dim, JSON.stringify(extra))}` : message;
  return `${head} ${body}`;
}

const Log = {
  event(key, sessionRef, message, extra) {
    const e = EVENTS[key] || { col: C.gray, tag: key.toUpperCase() };
    const level = key.includes('capi') ? 'CAPI' : 'EVT ';
    console.log(row(level, e.col, e.tag, sessionRef, message, extra));
  },

  error(key, sessionRef, message, extra) {
    const e = EVENTS[key] || { col: C.red, tag: key.toUpperCase() };
    console.error(row('ERR ', C.red, e.tag, sessionRef, message, extra));
  },

  http(method, url, status, ms, sessionRef) {
    const lvl = status >= 500 ? 'ERR ' : status >= 400 ? 'WARN' : 'HTTP';
    const col = status >= 500 ? C.red : status >= 400 ? C.yellow : C.green;
    const ref = pad(sessionRef || '--------', REF_W);
    const loc = locStr(sessionRef);
    const line =
      `${c(C.dim, ts())}  ` +
      `${c(col, lvl)}  ` +
      `${c(col, pad(String(status), 3))} ` +
      `${c(C.bold, pad(method, 4))} ` +
      `${url} ${c(C.dim, `${ms}ms`)} ` +
      `${SEP} ${c(C.dim, ref)} ` +
      `${SEP} ${c(C.dim, loc)}`;
    if (status >= 500) console.error(line);
    else console.log(line);
  },

  system(message, tag) {
    console.log(row('SYS ', C.cyan, (tag || 'system').toUpperCase(), null, message));
  },

  warn(message, tag) {
    console.warn(row('WARN', C.yellow, (tag || 'system').toUpperCase(), null, message));
  },

  ok(message, tag) {
    console.log(row('OK  ', C.green, (tag || 'system').toUpperCase(), null, message));
  },

  startup(port, storeName, trackingEnabled, productCount, categoryCount) {
    const w = 78;
    const bar = '='.repeat(w);
    const sep = '-'.repeat(w);
    const padR = (s, n) => String(s).padEnd(n);
    const geo = visitors.geoipReady() ? 'enabled (geoip-lite)' : 'disabled (no geoip-lite)';
    console.log('');
    console.log(c(C.cyan, bar));
    console.log('  ' + c(C.bold, storeName) + c(C.dim, ' - research peptides'));
    console.log(c(C.cyan, sep));
    console.log('  ' + c(C.dim, 'Server   ') + ' http://localhost:' + port);
    console.log('  ' + c(C.dim, 'Catalog  ') + ' ' + productCount + ' peptides x ' + categoryCount + ' categories');
    console.log('  ' + c(C.dim, 'Tracking ') + ' ' + (trackingEnabled
      ? c(C.green, 'ENABLED') + c(C.dim, ' (Meta Pixel + CAPI)')
      : c(C.dim, 'disabled (no FB_PIXEL_ID)')));
    console.log('  ' + c(C.dim, 'Geo IP   ') + ' ' + c(C.dim, geo));
    console.log('  ' + c(C.dim, 'Mode     ') + ' ' + (process.env.NODE_ENV || 'development'));
    console.log(c(C.cyan, sep));
    console.log('  ' + c(C.dim, padR('Log: TIMESTAMP LEVEL  TAG', 38)) + c(C.dim, '| SESSION  | LOCATION         | MESSAGE'));
    console.log(c(C.cyan, bar));
    console.log('');
  },
};

module.exports = { Log };
