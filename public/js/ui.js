(function () {
  'use strict';

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function openDrawer() {
    const mask = document.getElementById('cart-mask');
    const drawer = document.getElementById('cart-drawer');
    if (!mask || !drawer) return;
    mask.classList.add('open');
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    const mask = document.getElementById('cart-mask');
    const drawer = document.getElementById('cart-drawer');
    if (!mask || !drawer) return;
    mask.classList.remove('open');
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function toast(message, variant) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    if (variant === 'success') el.style.background = '#047857';
    else if (variant === 'error') el.style.background = '#be123c';
    else el.style.background = '';
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function bindGlobal() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('#cart-trigger');
      if (trigger && document.getElementById('cart-drawer')) {
        e.preventDefault();
        openDrawer();
      }
      if (e.target.closest('#cart-close') || e.target.closest('#cart-mask')) {
        closeDrawer();
      }
      if (e.target.closest('#mobile-menu-btn')) {
        const menu = document.getElementById('mobile-menu');
        if (menu) menu.classList.toggle('hidden');
      }
      if (e.target.closest('#search-toggle')) {
        const bar = document.getElementById('search-bar');
        if (bar) {
          bar.classList.toggle('hidden');
          if (!bar.classList.contains('hidden')) {
            const input = bar.querySelector('input');
            if (input) setTimeout(() => input.focus(), 50);
          }
        }
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  function bindAnimations() {
    if (!('IntersectionObserver' in window)) return;
    const els = document.querySelectorAll('[data-anim="up"]');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    els.forEach((el) => io.observe(el));
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(refreshIcons, 60);
    bindGlobal();
    bindAnimations();
  });

  window.HELIX_UI = { refreshIcons, openDrawer, closeDrawer, toast };
})();
