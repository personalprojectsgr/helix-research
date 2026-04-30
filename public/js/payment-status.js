(function () {
  'use strict';

  function init() {
    const main = document.querySelector('main[data-order-id]');
    if (!main) return;
    const orderId = main.dataset.orderId;
    const ctx = (window.HELIX && window.HELIX.pageContext) || '';

    if (ctx === 'order-success') initSuccess(main, orderId);
    if (ctx === 'order-cancelled') initCancelled(main, orderId);
  }

  function initSuccess(main, orderId) {
    const initialStatus = main.dataset.orderStatus;
    if (initialStatus === 'paid') {
      firePurchasePixel(main);
      try { sessionStorage.removeItem('_helix_purchase'); } catch (_) {}
      if (window.HELIX_CART) window.HELIX_CART.clear();
      return;
    }

    let attempts = 0;
    const maxAttempts = 600;
    let timer = null;

    async function poll() {
      attempts++;
      if (attempts > maxAttempts) return;
      try {
        const resp = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
          headers: { 'Cache-Control': 'no-store' },
          credentials: 'same-origin',
        });
        const json = await resp.json();
        if (!json || !json.ok || !json.order) {
          schedule();
          return;
        }
        const o = json.order;
        if (o.status === 'paid') {
          applyPaidUI(o);
          firePurchasePixel(main, o);
          if (window.HELIX_CART) window.HELIX_CART.clear();
          return;
        }
        if (o.status === 'expired' || o.status === 'cancelled') {
          window.location.href = `/order/cancelled/${encodeURIComponent(orderId)}`;
          return;
        }
        if (o.status === 'superseded') {
          schedule();
          return;
        }
        schedule();
      } catch (_) {
        schedule();
      }
    }

    function schedule() {
      const delay = Math.min(8000, 3000 + attempts * 200);
      timer = setTimeout(poll, delay);
    }

    timer = setTimeout(poll, 3000);
    window.addEventListener('beforeunload', () => { if (timer) clearTimeout(timer); });
  }

  function applyPaidUI(order) {
    const headline = document.getElementById('success-headline');
    const lede = document.getElementById('success-lede');
    const chip = document.getElementById('status-chip');
    const kicker = document.getElementById('kicker-status');
    const paidActions = document.getElementById('paid-actions');
    const pendingActions = document.getElementById('pending-actions');
    if (headline) {
      headline.innerHTML = 'Thank you<span class="font-display-italic text-ink-3">,</span><br>your order is in.';
    }
    if (lede) lede.textContent = 'A confirmation email is on its way. The Certificate of Analysis ships with your order.';
    if (chip) {
      chip.textContent = 'Paid';
      chip.classList.remove('evidence-mech');
      chip.classList.add('evidence-fda');
    }
    if (kicker) {
      kicker.textContent = '§ Confirmed';
      kicker.classList.remove('text-ink-3');
      kicker.classList.add('text-emerald');
    }
    if (paidActions) paidActions.removeAttribute('hidden');
    if (pendingActions) pendingActions.style.display = 'none';
    if (window.HELIX_UI && typeof window.HELIX_UI.refreshIcons === 'function') window.HELIX_UI.refreshIcons();
  }

  function firePurchasePixel(main, order) {
    if (!window.HELIX_TRACK) return;
    const eventId = main.dataset.purchaseEventId;
    if (!eventId) return;
    if (firePurchasePixel._fired) return;
    firePurchasePixel._fired = true;
    const total = parseFloat(main.dataset.orderTotal) || (order && order.totalUsd) || 0;
    const currency = main.dataset.orderCurrency || (order && order.payment?.sourceCurrency) || 'USD';
    const items = (order && order.items) || [];
    window.HELIX_TRACK.trackPurchase({
      content_ids: items.map((i) => i.id),
      contents: items.map((i) => ({ id: i.id, quantity: i.qty, item_price: i.price })),
      content_type: 'product',
      num_items: items.reduce((s, i) => s + i.qty, 0),
      currency,
      value: total,
      order_id: main.dataset.orderId,
    }, eventId);
  }

  function initCancelled(main, orderId) {
    const btn = document.getElementById('retry-payment-btn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const label = document.getElementById('retry-label');
      const loading = document.getElementById('retry-loading');
      const errorEl = document.getElementById('retry-error');
      btn.disabled = true;
      if (label) label.classList.add('hidden');
      if (loading) loading.classList.remove('hidden');
      if (errorEl) errorEl.classList.add('hidden');
      if (window.HELIX_UI) window.HELIX_UI.refreshIcons();
      try {
        const resp = await fetch(`/api/orders/${encodeURIComponent(orderId)}/retry`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
        });
        const json = await resp.json();
        if (!json || !json.ok || !json.invoiceUrl) throw new Error(json && json.error ? json.error : 'retry_failed');
        window.location.href = json.invoiceUrl;
      } catch (err) {
        btn.disabled = false;
        if (label) label.classList.remove('hidden');
        if (loading) loading.classList.add('hidden');
        if (errorEl) {
          errorEl.textContent = String(err.message || err);
          errorEl.classList.remove('hidden');
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
