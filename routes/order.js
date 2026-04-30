const express = require('express');
const { Log } = require('../lib/logger');
const orders = require('../lib/orders');
const plisio = require('../lib/plisio');
const helpers = require('../lib/payment-helpers');

module.exports = function buildOrderRouter() {
  const router = express.Router();

  router.get('/order/success/:id', async (req, res) => {
    const order = orders.getOrder(req.params.id);
    if (!order) {
      return res.status(404).render('error', { title: 'Order not found', code: 404, message: 'No such order.', pageContext: 'error' });
    }
    let current = order;
    if (current.status === 'awaiting_payment' && orders.isStale(current, 5000) && plisio.isConfigured() && current.payment.txnId) {
      try { current = await helpers.refreshOrderFromPlisio(current, req.sessionRef); } catch (_) {}
    }
    if (current.status === 'expired' || current.status === 'cancelled') {
      return res.redirect(`/order/cancelled/${encodeURIComponent(current.id)}`);
    }
    Log.event('pageview', req.sessionRef, `/order/success/${current.id} (${current.status})`);
    res.render('order-success', {
      title: current.status === 'paid' ? 'Order confirmed — Helix Research' : 'Confirming payment — Helix Research',
      order: orders.publicView(current),
      pageContext: 'order-success',
    });
  });

  router.get('/order/cancelled/:id', async (req, res) => {
    const order = orders.getOrder(req.params.id);
    if (!order) {
      return res.status(404).render('error', { title: 'Order not found', code: 404, message: 'No such order.', pageContext: 'error' });
    }
    let current = order;
    if (current.status === 'awaiting_payment' && plisio.isConfigured() && current.payment.txnId) {
      try { current = await helpers.refreshOrderFromPlisio(current, req.sessionRef); } catch (_) {}
    }
    if (current.status === 'paid') {
      return res.redirect(`/order/success/${encodeURIComponent(current.id)}`);
    }
    Log.event('pageview', req.sessionRef, `/order/cancelled/${current.id} (${current.status})`);
    res.render('order-cancelled', {
      title: 'Payment not completed — Helix Research',
      order: orders.publicView(current),
      pageContext: 'order-cancelled',
    });
  });

  return router;
};
