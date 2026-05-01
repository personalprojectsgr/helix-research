const express = require('express');
const { Log } = require('../lib/logger');
const shippingCfg = require('../data/shipping');
const posts = require('../data/posts');

module.exports = function buildPagesRouter({ catalog }) {
  const router = express.Router();

  router.get('/robots.txt', (req, res) => {
    req.skipLog = true;
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || '';
    const sitemap = host ? `Sitemap: ${proto}://${host}/sitemap.xml\n` : '';
    res.type('text/plain').send(
      'User-agent: *\n' +
      'Allow: /\n' +
      'Disallow: /api/\n' +
      'Disallow: /cart\n' +
      'Disallow: /checkout\n' +
      'Disallow: /order/\n' +
      '\n' +
      'User-agent: facebookexternalhit\n' +
      'Allow: /\n' +
      '\n' +
      'User-agent: meta-externalagent\n' +
      'Allow: /\n' +
      '\n' +
      sitemap
    );
  });

  router.get('/sitemap.xml', (req, res) => {
    req.skipLog = true;
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || '';
    const base = `${proto}://${host}`;
    const urls = [
      '/', '/shop', '/about', '/quality', '/shipping', '/blog', '/faq', '/contact',
      '/legal/terms', '/legal/privacy', '/legal/refund', '/legal/shipping', '/legal/disclaimer',
      ...catalog.categories.map((c) => `/category/${c.id}`),
      ...catalog.products.map((p) => `/p/${p.slug || p.id}`),
      ...posts.all().map((p) => `/blog/${p.slug}`),
    ];
    const today = new Date().toISOString().slice(0, 10);
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map((u) => `  <url><loc>${base}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
      '\n</urlset>\n';
    res.type('application/xml').send(xml);
  });

  router.get('/favicon.ico', (req, res) => {
    req.skipLog = true;
    res.set('Cache-Control', 'public, max-age=86400');
    res.status(204).end();
  });

  router.get('/', (req, res) => {
    res.render('home', {
      title: 'Helix Research \u2014 Research Peptides Shipped from the EU',
      featured: catalog.getFeatured(8),
      bestSellers: catalog.getBestSellers(12),
      gridProducts: catalog.getFeatured(15),
      categories: catalog.categories,
      pageContext: 'home',
    });
    Log.event('pageview', req.sessionRef, '/');
  });

  router.get('/shop', (req, res) => {
    const { category, format, evidence, q, sort = 'featured' } = req.query;
    const filtered = catalog.search(q || '', { category, format, evidence });
    const sorted = sortProducts(filtered, sort);
    res.render('shop', {
      title: 'Shop All Peptides \u2014 Helix Research',
      products: sorted,
      categories: catalog.categories,
      filters: { category: category || '', format: format || '', evidence: evidence || '', q: q || '', sort },
      pageContext: 'shop',
    });
    Log.event('pageview', req.sessionRef, `/shop ${formatFilters(req.query)}`);
  });

  router.get('/category/:id', (req, res) => {
    const cat = catalog.getCategory(req.params.id);
    if (!cat) return res.status(404).render('error', { title: 'Category not found', code: 404, message: 'No such category.', pageContext: 'error' });
    const products = catalog.byCategory.get(cat.id) || [];
    res.render('shop', {
      title: `${cat.name} \u2014 Helix Research`,
      products,
      categories: catalog.categories,
      filters: { category: cat.id, format: '', evidence: '', q: '', sort: 'featured' },
      pageContext: 'category',
      activeCategory: cat,
    });
    Log.event('pageview', req.sessionRef, `/category/${cat.id}`);
  });

  router.get('/p/:slug', (req, res) => {
    const product = catalog.getProduct(req.params.slug);
    if (!product) return res.status(404).render('error', { title: 'Product not found', code: 404, message: 'No such peptide.', pageContext: 'error' });
    const cat = catalog.getCategory(product.category);
    res.render('product', {
      title: `${product.name} \u2014 ${product.size} \u2014 Helix Research`,
      product,
      category: cat,
      related: catalog.relatedProducts(product, 4),
      pageContext: 'product',
    });
    Log.event('view_content', req.sessionRef, `${product.id} (${product.name})`, { price: product.price });
  });

  router.get('/cart', (req, res) => {
    res.render('cart', { title: 'Your Cart \u2014 Helix Research', pageContext: 'cart' });
  });

  router.get('/checkout', (req, res) => {
    res.render('checkout', {
      title: 'Checkout \u2014 Helix Research',
      pageContext: 'checkout',
      shippingCountries: shippingCfg.listCountries(),
      shippingZones: shippingCfg.ZONES,
      shippingOptions: shippingCfg.OPTIONS,
      freeShippingThreshold: shippingCfg.FREE_SHIPPING_THRESHOLD_USD,
    });
  });

  router.get('/thanks', (req, res) => {
    const order = (req.query.order || '').toString();
    if (order) return res.redirect(`/order/success/${encodeURIComponent(order)}`);
    res.redirect('/');
  });

  router.get('/shipping', (req, res) => {
    res.render('shipping', {
      title: 'Shipping & Logistics \u2014 EU Fulfilment, Tracked, Discreet',
      pageContext: 'shipping',
      shippingZones: shippingCfg.ZONES,
      shippingOptions: shippingCfg.OPTIONS,
      shippingCountries: shippingCfg.listCountries(),
      freeShippingThreshold: shippingCfg.FREE_SHIPPING_THRESHOLD_USD,
    });
  });

  router.get('/about', (req, res) => {
    res.render('about', {
      title: 'The Lab \u2014 Helix Research, Ljubljana',
      pageContext: 'about',
    });
    Log.event('pageview', req.sessionRef, '/about');
  });

  router.get('/quality', (req, res) => {
    res.render('quality', {
      title: 'Quality \u2014 Synthesis, Verification & Release',
      pageContext: 'quality',
    });
    Log.event('pageview', req.sessionRef, '/quality');
  });

  router.get('/blog', (req, res) => {
    res.render('blog', {
      title: 'Journal \u2014 Peptide Research Library',
      pageContext: 'blog',
      posts: posts.all(),
    });
    Log.event('pageview', req.sessionRef, '/blog');
  });

  router.get('/blog/:slug', (req, res) => {
    const post = posts.bySlug(req.params.slug);
    if (!post) {
      return res
        .status(404)
        .render('error', { title: 'Article not found', code: 404, message: 'No such article in the Journal.', pageContext: 'error' });
    }
    res.render('post', {
      title: `${post.title} \u2014 Helix Journal`,
      pageContext: 'post',
      post,
      related: posts.related(post.slug, 3),
    });
    Log.event('pageview', req.sessionRef, `/blog/${post.slug}`);
  });

  const staticPages = [
    ['/faq', 'faq', 'Frequently Asked Questions'],
    ['/contact', 'contact', 'Contact \u2014 Helix Research'],
    ['/legal/terms', 'legal/terms', 'Terms of Service'],
    ['/legal/privacy', 'legal/privacy', 'Privacy Policy'],
    ['/legal/refund', 'legal/refund', 'Refund Policy'],
    ['/legal/shipping', 'legal/shipping', 'Shipping Policy'],
    ['/legal/disclaimer', 'legal/disclaimer', 'Research Use Only Disclaimer'],
  ];

  for (const [path, view, title] of staticPages) {
    router.get(path, (req, res) => {
      res.render(view, { title, slug: req.params.slug, pageContext: view });
    });
  }

  return router;
};

function sortProducts(list, sort) {
  const arr = [...list];
  switch (sort) {
    case 'price-asc':  return arr.sort((a, b) => a.price - b.price);
    case 'price-desc': return arr.sort((a, b) => b.price - a.price);
    case 'a-z':        return arr.sort((a, b) => a.name.localeCompare(b.name));
    case 'z-a':        return arr.sort((a, b) => b.name.localeCompare(a.name));
    case 'newest':     return arr.sort((a, b) => Number(!!b.new) - Number(!!a.new));
    case 'best':       return arr.sort((a, b) => Number(!!b.bestSeller) - Number(!!a.bestSeller));
    default:           return arr.sort((a, b) =>
      Number(!!b.featured) - Number(!!a.featured) || Number(!!b.bestSeller) - Number(!!a.bestSeller));
  }
}

function formatFilters(q) {
  const parts = [];
  if (q.category) parts.push(`cat=${q.category}`);
  if (q.format) parts.push(`fmt=${q.format}`);
  if (q.evidence) parts.push(`ev=${q.evidence}`);
  if (q.q) parts.push(`q="${q.q}"`);
  if (q.sort) parts.push(`sort=${q.sort}`);
  return parts.join(' ');
}
