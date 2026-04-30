(function () {
  'use strict';

  function init() {
    const form = document.getElementById('filter-form');
    if (!form) return;

    const radios = form.querySelectorAll('input[type="radio"][name="category"], input[type="radio"][name="format"], input[type="radio"][name="evidence"]');
    radios.forEach((r) => {
      r.addEventListener('change', () => form.submit());
    });

    const search = form.querySelector('input[type="search"][name="q"]');
    if (search) {
      let t;
      search.addEventListener('input', () => {
        clearTimeout(t);
        if (window.HELIX_TRACK && search.value.trim().length >= 3) {
          t = setTimeout(() => {
            window.HELIX_TRACK.track('Search', { search_string: search.value.trim() });
          }, 800);
        }
      });
    }

    const mobileFilterBtn = document.getElementById('mobile-filter-btn');
    if (mobileFilterBtn) {
      mobileFilterBtn.addEventListener('click', () => {
        const aside = mobileFilterBtn.parentElement.querySelector('.hidden.lg\\:block');
        if (aside) aside.classList.toggle('hidden');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
