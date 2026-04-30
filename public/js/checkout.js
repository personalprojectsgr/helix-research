(function () {
  'use strict';

  const FORMATTER = new Intl.NumberFormat('en-US', { style: 'currency', currency: (window.HELIX && window.HELIX.currency) || 'USD' });
  let SHIPPING = null;

  function loadShippingData() {
    const node = document.getElementById('shipping-data');
    if (!node) return;
    try { SHIPPING = JSON.parse(node.textContent || '{}'); } catch (_) { SHIPPING = null; }
  }

  function escapeHTML(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function lineItemHTML(item) {
    const code = (item.name || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
    return `
      <div class="grid grid-cols-[40px_1fr_auto] gap-3 items-start py-3 border-t border-rule first:border-t-0">
        <div class="relative aspect-[4/5] grid place-items-center bg-paper-2 border border-rule font-mono text-[9px] font-medium text-ink-3">
          ${escapeHTML(code)}
          <span class="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 bg-ink text-paper text-[10px] font-mono leading-[16px] text-center">${item.qty}</span>
        </div>
        <div class="min-w-0">
          <p class="font-display text-[0.95rem] font-medium leading-tight">${escapeHTML(item.name)}</p>
          <p class="font-mono text-[0.65rem] uppercase tracking-wider text-ink-4 mt-1">${FORMATTER.format(item.price)} ea</p>
        </div>
        <p class="font-mono text-[0.85rem] font-medium whitespace-nowrap pt-0.5">${FORMATTER.format(item.price * item.qty)}</p>
      </div>`;
  }

  function getZoneIdForCountry(code) {
    if (!SHIPPING || !code) return null;
    const select = document.getElementById('country-select');
    if (!select) return null;
    const opt = select.querySelector(`option[value="${code}"]`);
    if (!opt || !opt.parentElement) return null;
    const groupLabel = opt.parentElement.label || '';
    if (groupLabel.includes('Priority')) return 'EU_PRIORITY';
    if (groupLabel.includes('Standard')) return 'EU_STANDARD';
    if (groupLabel.includes('Nordics')) return 'EU_NORDIC';
    if (groupLabel.includes('UK')) return 'UK_CH_NO';
    return 'INTL';
  }

  function getOptionsForCountry(code) {
    const zoneId = getZoneIdForCountry(code);
    if (!SHIPPING || !zoneId) return null;
    return { zoneId, zone: SHIPPING.zones[zoneId], options: SHIPPING.options[zoneId] };
  }

  function renderShippingOptions(code) {
    const mount = document.getElementById('shipping-options-mount');
    if (!mount) return;
    const data = getOptionsForCountry(code);
    if (!data) {
      mount.innerHTML = '<p class="text-[0.85rem] text-ink-4 italic">Select a country above to see delivery options.</p>';
      return;
    }
    const subtotal = currentSubtotal();
    const html = data.options.map((opt, i) => {
      const free = opt.id === 'standard' && subtotal >= (SHIPPING.freeShippingThreshold || 0);
      const priceText = free ? '<span class="text-emerald font-medium">FREE</span>' : `$${opt.price.toFixed(2)}`;
      return `
        <label class="option-card">
          <input type="radio" name="shipping" value="${opt.id}" ${i === 0 ? 'checked' : ''} class="text-ink focus:ring-ink" />
          <span class="flex-1 min-w-0">
            <span class="block font-display text-[1.05rem] font-medium leading-tight">${escapeHTML(opt.label)}</span>
            <span class="block font-mono text-[0.7rem] uppercase tracking-wider text-ink-4 mt-1">${escapeHTML(opt.eta)} · ${escapeHTML(opt.blurb)}</span>
          </span>
          <span class="font-mono text-[0.95rem] font-medium whitespace-nowrap">${priceText}</span>
        </label>`;
    }).join('');
    mount.innerHTML = html;
    bindShippingRadios();
  }

  function renderETAPill(code) {
    const mount = document.getElementById('eta-pill-mount');
    if (!mount) return;
    const data = getOptionsForCountry(code);
    if (!data) { mount.innerHTML = ''; return; }
    mount.innerHTML = `<span class="eta-pill"><span class="dot"></span>${escapeHTML(data.zone.etaShort)}</span>`;
  }

  function currentSubtotal() {
    const items = (window.HELIX_CART && window.HELIX_CART.read()) || [];
    return items.reduce((s, i) => s + i.price * i.qty, 0);
  }

  function currentShippingFee() {
    const code = document.querySelector('select[name="country"]')?.value;
    const methodId = document.querySelector('input[name="shipping"]:checked')?.value;
    const data = getOptionsForCountry(code);
    if (!data || !methodId) return null;
    const opt = data.options.find((o) => o.id === methodId) || data.options[0];
    const free = opt.id === 'standard' && currentSubtotal() >= (SHIPPING.freeShippingThreshold || 0);
    return free ? 0 : opt.price;
  }

  function renderFreeBar(subtotal) {
    const mount = document.getElementById('free-shipping-mount');
    if (!mount || !SHIPPING) return;
    const threshold = SHIPPING.freeShippingThreshold || 0;
    if (!threshold) { mount.innerHTML = ''; return; }
    if (subtotal >= threshold) {
      mount.innerHTML = `<p class="text-[0.78rem] text-emerald font-medium flex items-center gap-2"><span class="dot dot-emerald"></span> Free standard shipping unlocked</p>`;
      return;
    }
    const remaining = threshold - subtotal;
    const pct = Math.min(100, Math.max(0, (subtotal / threshold) * 100));
    mount.innerHTML = `
      <p class="text-[0.78rem] text-ink-3 mb-2">Add <strong class="text-ink font-mono">${FORMATTER.format(remaining)}</strong> for free standard shipping</p>
      <div class="free-bar"><span style="width:${pct}%"></span></div>`;
  }

  function renderSummary() {
    const items = (window.HELIX_CART && window.HELIX_CART.read()) || [];
    const list = document.getElementById('checkout-line-items');
    if (!list) return false;
    if (items.length === 0) {
      list.innerHTML = '<p class="text-[0.9rem] text-ink-3">Your cart is empty. <a href="/shop" class="link-underline">Browse the catalog</a>.</p>';
      const placeBtn = document.getElementById('place-order-btn');
      if (placeBtn) placeBtn.disabled = true;
      return false;
    }
    list.innerHTML = items.map(lineItemHTML).join('');

    const subtotal = currentSubtotal();
    const shipping = currentShippingFee();
    const total = subtotal + (shipping == null ? 0 : shipping);

    document.getElementById('checkout-subtotal').textContent = FORMATTER.format(subtotal);
    const shipEl = document.getElementById('checkout-shipping');
    const shipLabel = document.getElementById('checkout-shipping-label');
    if (shipping == null) {
      shipEl.textContent = '—';
      shipEl.className = 'font-mono text-ink-4';
      if (shipLabel) shipLabel.textContent = 'Shipping';
    } else if (shipping === 0) {
      shipEl.textContent = 'FREE';
      shipEl.className = 'font-mono text-emerald font-medium';
      if (shipLabel) shipLabel.textContent = 'Shipping';
    } else {
      shipEl.textContent = FORMATTER.format(shipping);
      shipEl.className = 'font-mono';
      if (shipLabel) shipLabel.textContent = 'Shipping';
    }
    document.getElementById('checkout-total').textContent = FORMATTER.format(total);
    document.getElementById('checkout-grand-total').textContent = FORMATTER.format(total);
    const mt = document.getElementById('mobile-total');
    if (mt) mt.textContent = FORMATTER.format(total);
    const mobileBar = document.getElementById('mobile-cta-bar');
    if (mobileBar) mobileBar.classList.remove('hidden');

    renderFreeBar(subtotal);
    return true;
  }

  function bindShippingRadios() {
    document.querySelectorAll('input[name="shipping"]').forEach((r) => {
      r.removeEventListener('change', renderSummary);
      r.addEventListener('change', renderSummary);
    });
  }

  function bindCountry() {
    const select = document.getElementById('country-select');
    if (!select) return;
    select.addEventListener('change', (e) => {
      const code = e.target.value;
      renderShippingOptions(code);
      renderETAPill(code);
      renderSummary();
    });
  }

  function bindSummaryToggle() {
    const btn = document.getElementById('summary-toggle');
    const target = document.getElementById('summary-collapsible');
    if (!btn || !target) return;
    btn.addEventListener('click', () => {
      const hidden = target.classList.toggle('hidden');
      btn.textContent = hidden ? 'Show' : 'Hide';
    });
  }

  function bindMobileTrigger() {
    const btn = document.getElementById('mobile-place-trigger');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const main = document.getElementById('place-order-btn');
      if (main) main.click();
    });
  }

  function fireInitiateCheckout() {
    const items = (window.HELIX_CART && window.HELIX_CART.read()) || [];
    if (items.length === 0 || !window.HELIX_TRACK) return;
    const value = items.reduce((s, i) => s + i.price * i.qty, 0);
    window.HELIX_TRACK.track('InitiateCheckout', {
      content_ids: items.map((i) => i.id),
      contents: items.map((i) => ({ id: i.id, quantity: i.qty, item_price: i.price })),
      content_type: 'product',
      num_items: items.reduce((s, i) => s + i.qty, 0),
      currency: window.HELIX.currency || 'USD',
      value,
    });
  }

  function readCheckoutFormUser() {
    const form = document.getElementById('checkout-form');
    if (!form) return {};
    const fd = new FormData(form);
    const u = {
      email: fd.get('email') || undefined,
      firstName: fd.get('firstName') || undefined,
      lastName: fd.get('lastName') || undefined,
      phone: fd.get('phone') || undefined,
      city: fd.get('city') || undefined,
      zip: fd.get('zip') || undefined,
      country: fd.get('country') || undefined,
    };
    Object.keys(u).forEach((k) => { if (!u[k]) delete u[k]; });
    return u;
  }

  function fireAddPaymentInfo() {
    const items = (window.HELIX_CART && window.HELIX_CART.read()) || [];
    if (items.length === 0 || !window.HELIX_TRACK) return;
    const value = items.reduce((s, i) => s + i.price * i.qty, 0);
    window.HELIX_TRACK.track('AddPaymentInfo', {
      content_ids: items.map((i) => i.id),
      content_type: 'product',
      currency: window.HELIX.currency || 'USD',
      value,
    }, { user: readCheckoutFormUser() });
  }

  function placeOrder(e) {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const items = (window.HELIX_CART && window.HELIX_CART.read()) || [];
    if (items.length === 0) return;

    const fd = new FormData(form);
    if (!fd.get('country') || !fd.get('shipping')) {
      const errorEl = document.getElementById('checkout-error');
      if (errorEl) {
        errorEl.textContent = 'Please select a country and shipping method.';
        errorEl.classList.remove('hidden');
      }
      return;
    }
    const customer = {
      email: fd.get('email'), firstName: fd.get('firstName'), lastName: fd.get('lastName'),
      phone: fd.get('phone'), institution: fd.get('institution'),
    };
    const shipping = {
      method: fd.get('shipping'), address: fd.get('address'), city: fd.get('city'),
      zip: fd.get('zip'), country: fd.get('country'),
    };

    const btn = document.getElementById('place-order-btn');
    const label = document.getElementById('place-order-label');
    const loading = document.getElementById('place-order-loading');
    const errorEl = document.getElementById('checkout-error');
    if (btn) btn.disabled = true;
    if (label) label.classList.add('hidden');
    if (loading) loading.classList.remove('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (window.HELIX_UI) window.HELIX_UI.refreshIcons();

    fireAddPaymentInfo();

    fetch('/api/checkout/plisio', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
      body: JSON.stringify({ items: items.map((i) => ({ id: i.id, qty: i.qty })), customer, shipping }),
    })
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok || !json.ok) throw new Error(json.detail || json.error || `HTTP ${r.status}`);
        return json;
      })
      .then((data) => {
        try {
          sessionStorage.setItem('_helix_purchase', JSON.stringify({
            order: data.orderId, total: data.total, currency: data.currency,
            eventId: data.eventIds?.purchase,
            items: items.map((i) => ({ id: i.id, qty: i.qty, price: i.price, name: i.name })),
          }));
        } catch (_) {}
        window.location.href = data.invoiceUrl;
      })
      .catch((err) => {
        if (errorEl) {
          errorEl.textContent = `Couldn't generate invoice: ${err.message}. Please try again.`;
          errorEl.classList.remove('hidden');
        }
        if (btn) btn.disabled = false;
        if (label) label.classList.remove('hidden');
        if (loading) loading.classList.add('hidden');
      });
  }

  function init() {
    loadShippingData();
    const ok = renderSummary();
    bindCountry();
    bindSummaryToggle();
    bindMobileTrigger();
    if (ok) fireInitiateCheckout();
    const form = document.getElementById('checkout-form');
    if (form) form.addEventListener('submit', placeOrder);
    document.addEventListener('helix:cart:change', renderSummary);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
