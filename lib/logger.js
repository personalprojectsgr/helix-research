const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', gray: '\x1b[90m',
};

const useColor = process.env.LOG_COLOR !== 'off';
const c = (col, s) => (useColor ? `${col}${s}${C.reset}` : String(s));
const ts = () => new Date().toISOString().slice(11, 23);
const pad = (s, n) => String(s).padEnd(n);

const EVENTS = {
  pageview:        { lvl: 'EVT ', col: C.gray },
  view_content:    { lvl: 'EVT ', col: C.cyan },
  search:          { lvl: 'EVT ', col: C.cyan },
  add_to_cart:     { lvl: 'EVT ', col: C.blue },
  remove_cart:     { lvl: 'EVT ', col: C.gray },
  checkout_start:  { lvl: 'EVT ', col: C.magenta },
  payment_info:    { lvl: 'EVT ', col: C.magenta },
  order_created:   { lvl: 'EVT ', col: C.green },
  purchase_capi:   { lvl: 'CAPI', col: C.green },
  capi_meta_ok:    { lvl: 'CAPI', col: C.green },
  capi_meta_fail:  { lvl: 'ERR ', col: C.red },
  track_received:  { lvl: 'EVT ', col: C.gray },
  track_skipped:   { lvl: 'EVT ', col: C.gray },
};

function row(level, color, tag, sessionRef, message, extra) {
  const ref = pad(sessionRef || '--------', 8);
  const head =
    `${c(C.dim, ts())}  ` +
    `${c(color, pad(level, 4))}  ` +
    `${c(color, pad(tag, 20))} ` +
    `${c(C.dim, '|')} ${c(C.dim, ref)} ${c(C.dim, '|')}`;
  const body = extra ? `${message} ${c(C.dim, JSON.stringify(extra))}` : message;
  return `${head} ${body}`;
}

const Log = {
  event(key, sessionRef, message, extra) {
    const e = EVENTS[key] || { lvl: 'EVT ', col: C.gray };
    console.log(row(e.lvl, e.col, key, sessionRef, message, extra));
  },

  error(key, sessionRef, message, extra) {
    console.error(row('ERR ', C.red, key, sessionRef, message, extra));
  },

  http(method, url, status, ms, sessionRef) {
    const lvl = status >= 500 ? 'ERR ' : status >= 400 ? 'WARN' : 'HTTP';
    const col = status >= 500 ? C.red : status >= 400 ? C.yellow : C.green;
    const ref = pad(sessionRef || '--------', 8);
    const head =
      `${c(C.dim, ts())}  ` +
      `${c(col, lvl)}  ` +
      `${c(col, pad(String(status), 3))} ` +
      `${c(C.bold, pad(method, 4))} ` +
      `${url} ${c(C.dim, `${ms}ms`)} ` +
      `${c(C.dim, '|')} ${c(C.dim, ref)}`;
    if (status >= 500) console.error(head);
    else console.log(head);
  },

  system(message, tag) {
    console.log(row('SYS ', C.cyan, tag || 'system', null, message));
  },

  warn(message, tag) {
    console.warn(row('WARN', C.yellow, tag || 'system', null, message));
  },

  ok(message, tag) {
    console.log(row('OK  ', C.green, tag || 'system', null, message));
  },

  startup(port, storeName, trackingEnabled, productCount, categoryCount) {
    const bar = '='.repeat(66);
    const sep = '-'.repeat(66);
    console.log('');
    console.log(c(C.cyan, bar));
    console.log('  ' + c(C.bold, storeName) + c(C.dim, ' - research peptides'));
    console.log(c(C.cyan, sep));
    console.log('  ' + c(C.dim, 'Server   ') + ' http://localhost:' + port);
    console.log('  ' + c(C.dim, 'Catalog  ') + ' ' + productCount + ' peptides x ' + categoryCount + ' categories');
    console.log('  ' + c(C.dim, 'Tracking ') + ' ' + (trackingEnabled
      ? c(C.green, 'ENABLED') + c(C.dim, ' (Meta Pixel + CAPI)')
      : c(C.dim, 'disabled (no FB_PIXEL_ID)')));
    console.log('  ' + c(C.dim, 'Mode     ') + ' ' + (process.env.NODE_ENV || 'development'));
    console.log(c(C.cyan, bar));
    console.log('');
  },
};

module.exports = { Log };
