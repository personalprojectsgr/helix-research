const fs = require('fs');
const path = require('path');
const { Log } = require('./logger');

const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');

const VALID_STATUSES = ['awaiting_payment', 'paid', 'expired', 'superseded', 'error', 'cancelled'];

const TRANSITIONS = {
  awaiting_payment: new Set(['paid', 'expired', 'superseded', 'error', 'cancelled', 'awaiting_payment']),
  paid: new Set(['paid']),
  expired: new Set(['paid', 'awaiting_payment', 'expired']),
  superseded: new Set(['paid', 'expired', 'cancelled', 'superseded']),
  error: new Set(['paid', 'awaiting_payment', 'expired', 'error']),
  cancelled: new Set(['cancelled']),
};

const orders = new Map();
let writeQueue = Promise.resolve();
let initialized = false;

async function init() {
  if (initialized) return;
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.orders)) {
        for (const o of parsed.orders) orders.set(o.id, o);
      }
      Log.system(`Loaded ${orders.size} orders from data/orders.json`, 'orders');
    } else {
      const dir = path.dirname(ORDERS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(ORDERS_FILE, JSON.stringify({ orders: [] }, null, 2));
      Log.system('Created data/orders.json', 'orders');
    }
  } catch (err) {
    Log.error('orders_init_fail', null, `${err.message}`);
  }
  initialized = true;
}

function flush() {
  writeQueue = writeQueue.then(() => new Promise((resolve) => {
    const arr = Array.from(orders.values());
    const tmp = ORDERS_FILE + '.tmp';
    fs.writeFile(tmp, JSON.stringify({ orders: arr }, null, 2), (err) => {
      if (err) {
        Log.error('orders_write_fail', null, err.message);
        resolve();
        return;
      }
      fs.rename(tmp, ORDERS_FILE, (err2) => {
        if (err2) Log.error('orders_rename_fail', null, err2.message);
        resolve();
      });
    });
  }));
  return writeQueue;
}

function createOrder(data) {
  const now = new Date().toISOString();
  const order = {
    id: data.id,
    status: 'awaiting_payment',
    items: data.items || [],
    subtotalUsd: data.subtotalUsd || 0,
    shippingUsd: data.shippingUsd || 0,
    totalUsd: data.totalUsd || 0,
    customer: data.customer || {},
    shipping: data.shipping || {},
    payment: {
      provider: 'plisio',
      txnId: null,
      parentTxnId: null,
      childTxnIds: [],
      invoiceUrl: null,
      sourceCurrency: 'USD',
      sourceAmount: data.totalUsd || 0,
      cryptoCurrency: null,
      cryptoAmount: null,
      walletHash: null,
      expireUtc: null,
      lastCheckedAt: null,
      lastPlisioStatus: null,
    },
    tracking: data.tracking || { sessionId: null, eventIds: {} },
    events: [{ ts: now, type: 'created', from: null, to: 'awaiting_payment', reason: 'order_created' }],
    createdAt: now,
    updatedAt: now,
  };
  orders.set(order.id, order);
  flush();
  return order;
}

function getOrder(id) {
  return orders.get(id) || null;
}

function findByTxnId(txnId) {
  if (!txnId) return null;
  for (const o of orders.values()) {
    if (o.payment.txnId === txnId) return o;
    if (o.payment.parentTxnId === txnId) return o;
    if (Array.isArray(o.payment.childTxnIds) && o.payment.childTxnIds.includes(txnId)) return o;
  }
  return null;
}

function isValidTransition(from, to) {
  if (!VALID_STATUSES.includes(to)) return false;
  const allowed = TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.has(to);
}

function updateOrder(id, patch, transitionReason) {
  const order = orders.get(id);
  if (!order) return null;
  const fromStatus = order.status;
  const toStatus = patch.status || fromStatus;

  if (toStatus !== fromStatus && !isValidTransition(fromStatus, toStatus)) {
    Log.error('order_invalid_transition', order.tracking?.sessionId, `${id} ${fromStatus} → ${toStatus}`);
    return order;
  }

  if (patch.payment) {
    order.payment = { ...order.payment, ...patch.payment };
  }
  if (patch.status) order.status = patch.status;
  if (patch.tracking) order.tracking = { ...order.tracking, ...patch.tracking };
  if (patch.customer) order.customer = { ...order.customer, ...patch.customer };

  const now = new Date().toISOString();
  if (toStatus !== fromStatus || transitionReason) {
    order.events.push({ ts: now, type: 'transition', from: fromStatus, to: toStatus, reason: transitionReason || 'update' });
  }
  order.updatedAt = now;
  flush();
  return order;
}

function isTerminal(status) {
  return status === 'paid' || status === 'cancelled';
}

function isStale(order, ttlMs = 10000) {
  if (!order || !order.payment.lastCheckedAt) return true;
  return (Date.now() - new Date(order.payment.lastCheckedAt).getTime()) > ttlMs;
}

function isExpiredByTime(order) {
  if (!order || !order.payment.expireUtc) return false;
  if (order.status !== 'awaiting_payment') return false;
  return Date.now() > Number(order.payment.expireUtc) * 1000;
}

function publicView(order) {
  if (!order) return null;
  return {
    id: order.id,
    status: order.status,
    items: order.items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price, lineTotal: i.lineTotal })),
    subtotalUsd: order.subtotalUsd,
    shippingUsd: order.shippingUsd,
    totalUsd: order.totalUsd,
    customer: { email: order.customer.email },
    payment: {
      provider: order.payment.provider,
      invoiceUrl: order.payment.invoiceUrl,
      cryptoCurrency: order.payment.cryptoCurrency,
      cryptoAmount: order.payment.cryptoAmount,
      sourceAmount: order.payment.sourceAmount,
      sourceCurrency: order.payment.sourceCurrency,
      expireUtc: order.payment.expireUtc,
      lastPlisioStatus: order.payment.lastPlisioStatus,
    },
    tracking: { eventIds: order.tracking?.eventIds || {} },
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

module.exports = {
  init,
  createOrder,
  getOrder,
  findByTxnId,
  updateOrder,
  isTerminal,
  isStale,
  isExpiredByTime,
  publicView,
  VALID_STATUSES,
};
