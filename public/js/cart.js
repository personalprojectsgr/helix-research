(function () {
  'use strict';

  const KEY = 'helix_cart_v1';
  const FORMATTER = new Intl.NumberFormat('en-US', { style: 'currency', currency: (window.HELIX && window.HELIX.currency) || 'USD' });

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('helix:cart:change', { detail: items }));
  }

  function add(productData, qty) {
    qty = Math.max(1, Math.min(10, parseInt(qty || 1, 10)));
    const items = read();
    const existing = items.find((i) => i.id === productData.id);
    if (existing) existing.qty = Math.min(10, existing.qty + qty);
    else items.push({ id: productData.id, name: productData.name, price: parseFloat(productData.price), category: productData.category, qty });
    write(items);
    return items;
  }
  function update(id, qty) {
    qty = Math.max(0, Math.min(10, parseInt(qty || 0, 10)));
    const items = read().map((i) => (i.id === id ? { ...i, qty } : i)).filter((i) => i.qty > 0);
    write(items);
    return items;
  }
  function remove(id) {
    const items = read().filter((i) => i.id !== id);
    write(items);
    return items;
  }
  function clear() { write([]); }
  function totals(items) {
    items = items || read();
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const count = items.reduce((s, i) => s + i.qty, 0);
    return { subtotal, count, total: subtotal };
  }

  function renderBadge() {
    const badge = document.getElementById('cart-count-badge');
    if (!badge) return;
    const { count } = totals();
    if (count > 0) { badge.textContent = String(count); badge.classList.remove('hidden'); }
    else { badge.classList.add('hidden'); }
  }

  function lineItemHTML(item, ctx) {
    const py = ctx === 'page' ? 'py-5' : 'py-4';
    const code = (item.name || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
    return `
      <article class="${py} grid grid-cols-[44px_1fr_auto] gap-4 items-start border-t border-rule" data-item-id="${item.id}">
        <a href="/p/${item.id}" class="aspect-[4/5] grid place-items-center bg-paper-2 border border-rule font-mono text-[10px] font-medium text-ink-3 leading-none">${code}</a>
        <div class="min-w-0">
          <a href="/p/${item.id}" class="block font-display text-[1.05rem] font-medium leading-snug">${escapeHTML(item.name)}</a>
          <p class="font-mono text-[0.7rem] uppercase tracking-wider text-ink-4 mt-1">${FORMATTER.format(item.price)} ea</p>
          <div class="mt-3 flex items-center gap-3">
            <div class="flex items-center border border-rule-2">
              <button type="button" class="w-7 h-7 grid place-items-center text-ink-3 hover:bg-paper-2" data-cart-action="dec" data-id="${item.id}" aria-label="Decrease">−</button>
              <span class="w-8 text-center text-[0.78rem] font-mono">${item.qty}</span>
              <button type="button" class="w-7 h-7 grid place-items-center text-ink-3 hover:bg-paper-2" data-cart-action="inc" data-id="${item.id}" aria-label="Increase">+</button>
            </div>
            <button type="button" class="font-mono text-[0.65rem] uppercase tracking-wider text-ink-4 hover:text-rose" data-cart-action="remove" data-id="${item.id}">Remove</button>
          </div>
        </div>
        <p class="font-mono text-[0.95rem] font-medium whitespace-nowrap pt-0.5">${FORMATTER.format(item.price * item.qty)}</p>
      </article>`;
  }

  function escapeHTML(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderDrawer() {
    const items = read();
    const list = document.getElementById('cart-items');
    const empty = document.getElementById('cart-empty');
    const footer = document.getElementById('cart-footer');
    const countInline = document.getElementById('cart-count-inline');
    if (!list || !empty || !footer) return;
    if (items.length === 0) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
      footer.classList.add('hidden');
    } else {
      list.innerHTML = items.map((i) => lineItemHTML(i, 'drawer')).join('');
      empty.classList.add('hidden');
      footer.classList.remove('hidden');
      const t = totals(items);
      const sub = document.getElementById('cart-subtotal');
      const tot = document.getElementById('cart-total');
      if (sub) sub.textContent = FORMATTER.format(t.subtotal);
      if (tot) tot.textContent = FORMATTER.format(t.total);
    }
    if (countInline) countInline.textContent = `(${totals(items).count})`;
  }

  function renderPage() {
    const list = document.getElementById('cart-page-items');
    const empty = document.getElementById('cart-page-empty');
    if (!list || !empty) return;
    const items = read();
    if (items.length === 0) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
    } else {
      list.innerHTML = items.map((i) => lineItemHTML(i, 'page')).join('');
      empty.classList.add('hidden');
    }
    const t = totals(items);
    const sub = document.getElementById('cart-page-subtotal');
    const tot = document.getElementById('cart-page-total');
    if (sub) sub.textContent = FORMATTER.format(t.subtotal);
    if (tot) tot.textContent = FORMATTER.format(t.total);
  }

  function renderAll() {
    renderBadge();
    renderDrawer();
    renderPage();
    if (window.HELIX_UI) window.HELIX_UI.refreshIcons();
  }

  function bindAddButtons() {
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.js-add-to-cart');
      if (!addBtn) return;
      e.preventDefault();
      e.stopPropagation();
      const card = addBtn.closest('.product-card, [data-product-card]') || addBtn.parentElement?.closest('[data-product-id]') || addBtn;
      const pick = (key) => card.dataset[key] || addBtn.dataset[key];
      const data = {
        id: pick('productId'),
        name: pick('productName'),
        price: parseFloat(pick('productPrice')),
        category: pick('productCategory'),
      };
      if (!data.id || isNaN(data.price)) return;
      add(data, 1);
      if (window.HELIX_UI) {
        window.HELIX_UI.toast(`Added ${data.name} to cart`, 'success');
        window.HELIX_UI.openDrawer();
      }
      if (window.HELIX_TRACK) {
        window.HELIX_TRACK.track('AddToCart', {
          content_ids: [data.id],
          content_name: data.name,
          content_type: 'product',
          content_category: data.category,
          currency: window.HELIX.currency || 'USD',
          value: data.price,
        });
      }
    });
  }

  function bindActions() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cart-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const items = read();
      const item = items.find((i) => i.id === id);
      if (!item) return;
      if (btn.dataset.cartAction === 'inc') update(id, item.qty + 1);
      else if (btn.dataset.cartAction === 'dec') update(id, item.qty - 1);
      else if (btn.dataset.cartAction === 'remove') remove(id);
    });
  }

  document.addEventListener('helix:cart:change', renderAll);

  document.addEventListener('DOMContentLoaded', () => {
    bindAddButtons();
    bindActions();
    renderAll();
  });

  window.HELIX_CART = { read, add, update, remove, clear, totals, render: renderAll };
})();
