const ts = () => new Date().toISOString().slice(11, 23);

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', gray: '\x1b[90m',
};

const EVENTS = {
  pageview:        { e: '👁️ ', t: 'PAGEVIEW',         c: C.gray   },
  view_content:    { e: '🔬', t: 'VIEW_CONTENT',     c: C.cyan   },
  search:          { e: '🔎', t: 'SEARCH',           c: C.cyan   },
  add_to_cart:     { e: '🛒', t: 'ADD_TO_CART',      c: C.blue   },
  remove_cart:     { e: '🗑 ', t: 'REMOVE_CART',      c: C.gray   },
  checkout_start:  { e: '🚀', t: 'CHECKOUT_START',   c: C.magenta },
  payment_info:    { e: '💳', t: 'PAYMENT_INFO',     c: C.magenta },
  order_created:   { e: '📦', t: 'ORDER_CREATED',    c: C.green  },
  purchase_capi:   { e: '✅', t: 'PURCHASE_CAPI',    c: C.green  },
  capi_meta_ok:    { e: '🟢', t: 'CAPI_META_OK',     c: C.green  },
  capi_meta_fail:  { e: '🔴', t: 'CAPI_META_FAIL',   c: C.red    },
  track_received:  { e: '📨', t: 'TRACK_RECEIVED',   c: C.dim    },
  track_skipped:   { e: '🚫', t: 'TRACK_SKIPPED',    c: C.gray   },
};

function fmt(level, eventKey, sessionRef, message, extra) {
  const ev = EVENTS[eventKey] || { e: 'ℹ️ ', t: eventKey.toUpperCase(), c: C.dim };
  const ref = (sessionRef || '--------').padEnd(8);
  const tag = ev.t.padEnd(15);
  const head = `${C.dim}[${ts()}]${C.reset} ${ev.e} ${ev.c}${tag}${C.reset} ${C.dim}│${C.reset} ${ref} ${C.dim}│${C.reset}`;
  const body = extra ? `${message} ${C.dim}${JSON.stringify(extra)}${C.reset}` : message;
  return `${head} ${body}`;
}

const Log = {
  event(key, sessionRef, message, extra) {
    console.log(fmt('info', key, sessionRef, message, extra));
  },
  error(key, sessionRef, message, extra) {
    console.error(fmt('error', key, sessionRef, message, extra));
  },
  http(method, url, status, ms, sessionRef) {
    const color = status >= 500 ? C.red : status >= 400 ? C.yellow : C.green;
    const ref = (sessionRef || '--------').padEnd(8);
    console.log(
      `${C.dim}[${ts()}]${C.reset} 🌐 ${color}${String(status)}${C.reset} ${C.bold}${method.padEnd(5)}${C.reset} ${url} ${C.dim}${ms}ms${C.reset} ${C.dim}│${C.reset} ${ref}`
    );
  },
  system(emoji, message) {
    console.log(`${C.dim}[${ts()}]${C.reset} ${emoji} ${message}`);
  },
  startup(port, storeName, trackingEnabled, productCount, categoryCount) {
    const w = 72;
    const line = (s) => `${C.cyan}║${C.reset} ${String(s).padEnd(w - 2)} ${C.cyan}║${C.reset}`;
    console.log('');
    console.log(`${C.cyan}╔${'═'.repeat(w)}╗${C.reset}`);
    console.log(line(` ${C.bold}🧬 ${storeName}${C.reset}${C.dim} — research peptides${C.reset}`));
    console.log(`${C.cyan}╠${'═'.repeat(w)}╣${C.reset}`);
    console.log(line(`  Server     http://localhost:${port}`));
    console.log(line(`  Catalog    ${productCount} peptides across ${categoryCount} categories`));
    console.log(line(`  Tracking   ${trackingEnabled ? `${C.green}ENABLED${C.reset} (Meta Pixel + CAPI)` : `${C.dim}disabled (no FB_PIXEL_ID)${C.reset}`}`));
    console.log(line(`  Mode       ${process.env.NODE_ENV || 'development'}`));
    console.log(`${C.cyan}╚${'═'.repeat(w)}╝${C.reset}`);
    console.log('');
  },
};

module.exports = { Log };
