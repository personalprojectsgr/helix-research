const fs = require('fs');
const path = require('path');

const POSTS_DIR = __dirname;

function loadAll() {
  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.js') && f !== 'index.js')
    .map((f) => path.join(POSTS_DIR, f));

  const posts = files
    .map((file) => {
      const mod = require(file);
      return {
        slug: mod.slug,
        title: mod.title,
        tag: mod.tag,
        read: mod.read,
        date: mod.date,
        sortKey: mod.sortKey || mod.date,
        excerpt: mod.excerpt,
        body: mod.body,
        author: mod.author || 'Helix Research',
        updated: mod.updated || mod.date,
      };
    })
    .filter((p) => p.slug && p.title && p.body)
    .sort((a, b) => (b.sortKey > a.sortKey ? 1 : -1));

  return posts;
}

let cache = null;

function all() {
  if (!cache) cache = loadAll();
  return cache;
}

function bySlug(slug) {
  return all().find((p) => p.slug === slug) || null;
}

function related(slug, limit = 3) {
  const post = bySlug(slug);
  if (!post) return all().slice(0, limit);
  const sameTag = all().filter((p) => p.tag === post.tag && p.slug !== slug);
  const others = all().filter((p) => p.tag !== post.tag && p.slug !== slug);
  return [...sameTag, ...others].slice(0, limit);
}

module.exports = { all, bySlug, related };
