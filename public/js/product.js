(function () {
  'use strict';

  function init() {
    const qtyInput = document.getElementById('qty-input');
    if (qtyInput) {
      document.querySelectorAll('[data-qty]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const delta = btn.dataset.qty === '-1' ? -1 : 1;
          const cur = Math.max(1, Math.min(10, parseInt(qtyInput.value || '1', 10) + delta));
          qtyInput.value = String(cur);
        });
      });
    }

    const pdpBtn = document.getElementById('pdp-add-to-cart');
    if (pdpBtn) {
      pdpBtn.addEventListener('click', () => {
        const data = {
          id: pdpBtn.dataset.productId,
          name: pdpBtn.dataset.productName,
          price: parseFloat(pdpBtn.dataset.productPrice),
          category: pdpBtn.dataset.productCategory,
        };
        const qty = qtyInput ? parseInt(qtyInput.value || '1', 10) : 1;
        if (!data.id || !window.HELIX_CART) return;
        window.HELIX_CART.add(data, qty);
        if (window.HELIX_UI) {
          window.HELIX_UI.toast(`Added ${qty} \u00d7 ${data.name} to cart`, 'success');
          window.HELIX_UI.openDrawer();
        }
        if (window.HELIX_TRACK) {
          window.HELIX_TRACK.track('AddToCart', {
            content_ids: [data.id],
            content_name: data.name,
            content_type: 'product',
            content_category: data.category,
            currency: window.HELIX.currency || 'USD',
            value: data.price * qty,
            quantity: qty,
          });
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
