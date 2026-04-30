const { Log } = require('./logger');
const orders = require('./orders');
const plisio = require('./plisio');
const tracking = require('./tracking');
const { eventId } = require('./id');
const shippingCfg = require('../data/shipping');

function publicBaseUrl(req) {
  const fromEnv = process.env.PLISIO_PUBLIC_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const proto = req.protocol;
  const host = req.get('host');
  return `${proto}://${host}`;
}

function buildLineItems(catalog, items) {
  if (!Array.isArray(items)) return [];
  return items.map((it) => {
    const product = catalog.getProduct(it.id);
    if (!product) return null;
    const qty = Math.max(1, Math.min(10, parseInt(it.qty || 1, 10)));
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      qty,
      lineTotal: +(product.price * qty).toFixed(2),
    };
  }).filter(Boolean);
}

function shippingFeeFor(method, country, subtotalUsd) {
  const resolved = shippingCfg.resolveShipping(country, method, subtotalUsd);
  return resolved.price;
}

function resolveShippingDetail(method, country, subtotalUsd) {
  return shippingCfg.resolveShipping(country, method, subtotalUsd);
}

function buildOrderRecord({ orderIdValue, lineItems, customer, shipping, sessionId, sessionRef }) {
  const subtotal = +lineItems.reduce((s, i) => s + i.lineTotal, 0).toFixed(2);
  const detail = shippingCfg.resolveShipping(shipping.country, shipping.method, subtotal);
  const shippingUsd = +detail.price.toFixed(2);
  const total = +(subtotal + shippingUsd).toFixed(2);
  return {
    id: orderIdValue,
    items: lineItems,
    subtotalUsd: subtotal,
    shippingUsd,
    totalUsd: total,
    customer: {
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone || '',
      institution: customer.institution || '',
    },
    shipping: {
      method: detail.id,
      label: detail.label,
      eta: detail.eta,
      zone: detail.zone?.id || 'INTL',
      zoneLabel: detail.zone?.label || 'International',
      freeShipping: !!detail.freeShipping,
      address: shipping.address,
      city: shipping.city,
      zip: shipping.zip,
      country: shipping.country,
    },
    tracking: {
      sessionId,
      sessionRef,
      eventIds: {
        initiateCheckout: eventId('InitiateCheckout'),
        addPaymentInfo: eventId('AddPaymentInfo'),
        purchase: eventId('Purchase'),
      },
    },
  };
}

async function createInvoiceForOrder(order, req) {
  const base = publicBaseUrl(req);
  const callback = `${base}/api/plisio/webhook`;
  const successUrl = `${base}/order/success/${encodeURIComponent(order.id)}`;
  const failUrl = `${base}/order/cancelled/${encodeURIComponent(order.id)}`;
  const expireMin = parseInt(process.env.PLISIO_INVOICE_EXPIRE_MIN || '30', 10);

  const json = await plisio.createInvoice({
    orderNumber: order.id,
    orderName: `Helix Research order ${order.id} — ${order.items.length} item${order.items.length === 1 ? '' : 's'}`,
    sourceAmountUsd: order.totalUsd,
    email: order.customer?.email,
    callbackUrl: callback,
    successInvoiceUrl: successUrl,
    failInvoiceUrl: failUrl,
    expireMin,
    sessionRef: req.sessionRef,
  });

  if (!json || json.status !== 'success' || !json.data?.txn_id) {
    return { ok: false, error: json?.data?.message || 'plisio_create_failed', code: json?.data?.code };
  }
  return { ok: true, txnId: json.data.txn_id, invoiceUrl: json.data.invoice_url };
}

async function refreshOrderFromPlisio(order, sessionRef) {
  if (!order || !order.payment.txnId) return order;
  if (!plisio.isConfigured()) return order;
  const json = await plisio.getOperation(order.payment.txnId, sessionRef);
  if (!json || json.status !== 'success' || !json.data) return order;
  return applyPlisioStatus(order, json.data, 'poll');
}

function applyPlisioStatus(order, data, source) {
  const plisioStatus = data.status;
  const newStatus = plisio.mapPlisioStatus(plisioStatus);
  const patch = {
    payment: {
      lastPlisioStatus: plisioStatus,
      lastCheckedAt: new Date().toISOString(),
      cryptoCurrency: data.currency || order.payment.cryptoCurrency,
      cryptoAmount: data.amount ? String(data.amount) : order.payment.cryptoAmount,
      walletHash: data.wallet_hash || order.payment.walletHash,
      expireUtc: data.expire_at_utc || data.expire_utc || order.payment.expireUtc,
    },
  };
  if (plisioStatus === 'cancelled duplicate' && Array.isArray(data.child_ids)) {
    patch.payment.childTxnIds = Array.from(new Set([...(order.payment.childTxnIds || []), ...data.child_ids]));
  }
  if (newStatus !== order.status) {
    patch.status = newStatus;
  }
  return orders.updateOrder(order.id, patch, `plisio_${source}_${plisioStatus}`);
}

async function firePurchaseCAPI(order, req) {
  if (!order || order.status !== 'paid') return;
  const eid = order.tracking?.eventIds?.purchase;
  if (!eid) return;
  const client = tracking.getClientInfo(req || { headers: {}, cookies: {}, ip: undefined });
  const userData = tracking.buildUserData({
    ...client,
    email: order.customer.email,
    firstName: order.customer.firstName,
    lastName: order.customer.lastName,
    city: order.shipping.city,
    country: order.shipping.country,
    zip: order.shipping.zip,
    externalId: order.id,
  });
  const customData = {
    currency: order.payment.sourceCurrency || 'USD',
    value: order.totalUsd,
    content_ids: order.items.map((i) => i.id),
    content_type: 'product',
    contents: order.items.map((i) => ({ id: i.id, quantity: i.qty, item_price: i.price })),
    num_items: order.items.reduce((s, i) => s + i.qty, 0),
    order_id: order.id,
  };
  const result = await tracking.sendMetaEvent({
    eventName: 'Purchase',
    eventId: eid,
    sourceUrl: `${publicBaseUrl(req)}/order/success/${order.id}`,
    userData,
    customData,
    sessionRef: order.tracking?.sessionRef,
  });
  Log.event('purchase_capi', order.tracking?.sessionRef, `${order.id} — CAPI ${result.ok ? 'OK' : 'SKIPPED'}`);
}

module.exports = {
  publicBaseUrl,
  buildLineItems,
  shippingFeeFor,
  resolveShippingDetail,
  buildOrderRecord,
  createInvoiceForOrder,
  refreshOrderFromPlisio,
  applyPlisioStatus,
  firePurchaseCAPI,
};
