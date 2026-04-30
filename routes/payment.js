const express = require('express');
const { Log } = require('../lib/logger');
const { orderId } = require('../lib/id');
const orders = require('../lib/orders');
const plisio = require('../lib/plisio');
const helpers = require('../lib/payment-helpers');

async function webhookHandler(req, res) {
  const raw = req.body;
  const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(typeof raw === 'string' ? raw : JSON.stringify(raw || {}));
  const secret = process.env.PLISIO_SECRET_KEY || process.env.PLISIO_API_KEY || '';
  const verify = plisio.verifyWebhookSignature(buf, secret);
  if (!verify.ok) {
    Log.error('plisio_webhook_invalid', null, `signature ${verify.reason}`);
    return res.status(422).json({ ok: false, error: `signature_${verify.reason}` });
  }
  const data = verify.data;
  const txnId = data.txn_id;
  const orderNumber = data.order_number;
  const order = orders.getOrder(orderNumber) || orders.findByTxnId(txnId);
  if (!order) {
    Log.error('plisio_webhook_unknown_order', null, `txn=${txnId} order=${orderNumber}`);
    return res.status(200).json({ ok: false, error: 'unknown_order' });
  }
  if (order.payment.txnId && txnId !== order.payment.txnId &&
      !(order.payment.childTxnIds || []).includes(txnId)) {
    if (data.status !== 'cancelled duplicate') {
      Log.error('plisio_webhook_txn_mismatch', null, `${order.id} expected=${order.payment.txnId} got=${txnId}`);
    }
  }
  const lastSeen = `${order.payment.txnId || ''}:${order.payment.lastPlisioStatus || ''}`;
  const incoming = `${txnId}:${data.status}`;
  if (lastSeen === incoming && order.payment.lastCheckedAt) {
    Log.event('track_skipped', order.tracking?.sessionRef, `webhook duplicate ${order.id} ${data.status}`);
    return res.json({ ok: true, duplicate: true });
  }

  Log.event('order_created', order.tracking?.sessionRef, `webhook ${order.id} ${order.status} → plisio:${data.status}`);
  const updated = helpers.applyPlisioStatus(order, data, 'webhook');

  if (updated.status === 'paid') {
    await helpers.firePurchaseCAPI(updated, req).catch((e) => Log.error('purchase_capi', null, e.message));
  }
  res.json({ ok: true });
}

function buildPaymentRouter({ catalog }) {
  const router = express.Router();

  router.post('/checkout/plisio', async (req, res) => {
    if (!plisio.isConfigured()) {
      return res.status(503).json({ ok: false, error: 'plisio_not_configured' });
    }
    const { items = [], customer = {}, shipping = {} } = req.body || {};
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ ok: false, error: 'cart_empty' });
    }
    if (!customer.email || !customer.firstName || !customer.lastName) {
      return res.status(400).json({ ok: false, error: 'missing_contact' });
    }
    const lineItems = helpers.buildLineItems(catalog, items);
    if (!lineItems.length) return res.status(400).json({ ok: false, error: 'no_valid_items' });

    const id = orderId();
    const record = helpers.buildOrderRecord({
      orderIdValue: id,
      lineItems,
      customer,
      shipping,
      sessionId: req.cookies?._hx_sid,
      sessionRef: req.sessionRef,
    });
    const order = orders.createOrder(record);

    Log.event('order_created', req.sessionRef, `${id} — ${lineItems.length} items — $${order.totalUsd.toFixed(2)} — ${order.shipping.country || '??'} ${order.shipping.method}`, {
      items: lineItems.map((i) => `${i.id}x${i.qty}`).join(','),
    });

    let result;
    try {
      result = await helpers.createInvoiceForOrder(order, req);
    } catch (err) {
      orders.updateOrder(id, { status: 'error' }, `plisio_create_threw:${err.message}`);
      Log.error('plisio_create_failed', req.sessionRef, `${id} — threw: ${err.message}`);
      return res.status(502).json({ ok: false, error: 'plisio_invoice_failed', detail: err.message });
    }
    if (!result.ok) {
      orders.updateOrder(id, { status: 'error' }, `plisio_create_failed:${result.error}`);
      Log.error('plisio_create_failed', req.sessionRef, `${id} — ${result.error}`, { code: result.code });
      return res.status(502).json({ ok: false, error: 'plisio_invoice_failed', detail: result.error });
    }

    orders.updateOrder(id, {
      payment: { txnId: result.txnId, invoiceUrl: result.invoiceUrl },
    }, 'invoice_created');

    Log.event('order_created', req.sessionRef, `${id} → Plisio invoice ${result.txnId.slice(-8)}`);

    res.json({
      ok: true,
      orderId: id,
      invoiceUrl: result.invoiceUrl,
      eventIds: order.tracking.eventIds,
      total: order.totalUsd,
      currency: 'USD',
    });
  });

  router.get('/orders/:id/status', async (req, res) => {
    const order = orders.getOrder(req.params.id);
    if (!order) return res.status(404).json({ ok: false, error: 'not_found' });

    if (order.status === 'awaiting_payment' && orders.isExpiredByTime(order)) {
      orders.updateOrder(order.id, { status: 'expired' }, 'expire_by_time');
    }

    let current = orders.getOrder(req.params.id);
    if (current.status === 'awaiting_payment' && orders.isStale(current, 10000) && plisio.isConfigured() && current.payment.txnId) {
      try { current = await helpers.refreshOrderFromPlisio(current, req.sessionRef); } catch (_) {}
    }
    res.json({ ok: true, order: orders.publicView(current) });
  });

  router.post('/orders/:id/retry', async (req, res) => {
    const order = orders.getOrder(req.params.id);
    if (!order) return res.status(404).json({ ok: false, error: 'not_found' });
    if (order.status === 'paid') return res.json({ ok: true, alreadyPaid: true, invoiceUrl: order.payment.invoiceUrl });
    if (order.status !== 'expired' && order.status !== 'error' && order.status !== 'awaiting_payment') {
      return res.status(400).json({ ok: false, error: `cannot_retry_${order.status}` });
    }
    if (!plisio.isConfigured()) return res.status(503).json({ ok: false, error: 'plisio_not_configured' });

    orders.updateOrder(order.id, { status: 'awaiting_payment' }, 'retry');
    let result;
    try {
      result = await helpers.createInvoiceForOrder(orders.getOrder(order.id), req);
    } catch (err) {
      orders.updateOrder(order.id, { status: 'error' }, `retry_threw:${err.message}`);
      return res.status(502).json({ ok: false, error: 'plisio_invoice_failed', detail: err.message });
    }
    if (!result.ok) {
      orders.updateOrder(order.id, { status: 'error' }, `retry_failed:${result.error}`);
      return res.status(502).json({ ok: false, error: 'plisio_invoice_failed', detail: result.error });
    }
    orders.updateOrder(order.id, {
      payment: { txnId: result.txnId, invoiceUrl: result.invoiceUrl, lastPlisioStatus: 'new', lastCheckedAt: null },
    }, 'invoice_created_retry');
    Log.event('order_created', req.sessionRef, `${order.id} retry → Plisio ${result.txnId.slice(-8)}`);
    res.json({ ok: true, invoiceUrl: result.invoiceUrl });
  });

  return router;
}

module.exports = buildPaymentRouter;
module.exports.webhookHandler = webhookHandler;
