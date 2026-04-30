const path = require('path');
const fs = require('fs');

const categories = require('../data/categories');

const peptidesDir = path.join(__dirname, '..', 'data', 'peptides');
const products = [];
for (const file of fs.readdirSync(peptidesDir)) {
  if (!file.endsWith('.js')) continue;
  const mod = require(path.join(peptidesDir, file));
  if (Array.isArray(mod)) products.push(...mod);
}

const bySlug = new Map(products.map((p) => [p.slug, p]));
const byId = new Map(products.map((p) => [p.id, p]));
const byCategory = new Map();
for (const c of categories) byCategory.set(c.id, []);
for (const p of products) {
  if (byCategory.has(p.category)) byCategory.get(p.category).push(p);
}

function getProduct(slugOrId) {
  return bySlug.get(slugOrId) || byId.get(slugOrId);
}

function getCategory(id) {
  return categories.find((c) => c.id === id);
}

function getFeatured(limit = 8) {
  return products.filter((p) => p.featured).slice(0, limit);
}

function getBestSellers(limit = 6) {
  return products.filter((p) => p.bestSeller).slice(0, limit);
}

function search(query, options = {}) {
  const q = (query || '').trim().toLowerCase();
  let results = products;
  if (q) {
    results = results.filter((p) => {
      const hay = `${p.name} ${p.fullName || ''} ${p.abbreviation || ''} ${p.description} ${(p.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }
  if (options.category) results = results.filter((p) => p.category === options.category);
  if (options.format) results = results.filter((p) => p.format === options.format);
  if (options.evidence) results = results.filter((p) => p.evidenceTier === options.evidence);
  if (options.featuredOnly) results = results.filter((p) => p.featured);
  return results;
}

function relatedProducts(product, limit = 4) {
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, limit);
}

module.exports = {
  products, categories, bySlug, byId, byCategory,
  getProduct, getCategory, getFeatured, getBestSellers, search, relatedProducts,
};
