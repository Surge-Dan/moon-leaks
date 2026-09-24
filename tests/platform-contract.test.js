const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const runtimePaths = [
  'index.html',
  'assets/style.css',
  'assets/editorial.css',
  'assets/atelier.css',
  'assets/atelier-hero.webp',
  'assets/ingredients-flatlay.webp',
  'assets/moon-phases.webp',
  'assets/mooncake-whole.webp',
  'assets/mooncake-cut-lotus.webp',
  'assets/mooncake-cut-sesame.webp',
  'assets/mooncake-cut-osmanthus.webp',
  'assets/mooncake-cut-custard.webp',
  'assets/mooncake-cut-coffee.webp',
  'assets/mooncake-cut-chestnut.webp',
  'assets/mooncake-cut-redbean.webp',
  'assets/mooncake-cut-matcha.webp',
  'assets/filling-lotus.webp',
  'assets/filling-sesame.webp',
  'assets/filling-osmanthus.webp',
  'assets/filling-custard.webp',
  'assets/filling-coffee.webp',
  'assets/filling-chestnut-v2.webp',
  'assets/filling-redbean-v2.webp',
  'assets/filling-matcha-v2.webp',
  'assets/lxgw-wenkai.woff2',
  'assets/content.js',
  'assets/engine.js',
  'assets/visuals.js',
  'assets/gsap.min.js',
  'assets/app.js',
];

test('runtime contains the Builder Hub entry and all local assets', () => {
  runtimePaths.forEach((relativePath) => {
    assert.ok(fs.existsSync(path.join(root, relativePath)), `${relativePath} is missing`);
  });
});

test('index uses a safe offline classic-script shell', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /lang="zh-CN"/);
  assert.match(html, /viewport-fit=cover/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
  assert.doesNotMatch(html, /\son\w+\s*=/i);
  assert.doesNotMatch(html, /type=["']module["']/i);
  assert.doesNotMatch(html, /(?:src|href)=["'](?:https?:|\/)/i);
});

test('runtime source contains no forbidden platform capability', () => {
  const forbidden = [
    /\bfetch\s*\(/i,
    /XMLHttpRequest/i,
    /WebSocket/i,
    /navigator\.clipboard/i,
    /navigator\.geolocation/i,
    /serviceWorker/i,
    /\bWorker\s*\(/i,
    /WebAssembly/i,
    /window\.open/i,
    /location\.(?:href|assign)/i,
    /<iframe/i,
    /<object/i,
    /https?:\/\//i,
    /\beval\s*\(/i,
    /new\s+Function/i,
  ];
  const source = runtimePaths
    .filter((relativePath) => !relativePath.endsWith('.webp') && fs.existsSync(path.join(root, relativePath)))
    .map((relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8'))
    .join('\n');

  forbidden.forEach((pattern) => assert.doesNotMatch(source, pattern));
});

test('content ships exactly sixteen authored archetypes', () => {
  const Content = require('../assets/content.js');
  assert.equal(Object.keys(Content.archetypes).length, 16);
  Object.values(Content.archetypes).forEach((result) => {
    assert.ok(result.name.length >= 4);
    assert.ok(result.essay.length >= 40);
    assert.ok(result.line.length >= 8);
  });
});

test('preflight enforces one HTML entry and blocks location navigation calls', () => {
  const script = fs.readFileSync(path.join(root, 'scripts', 'preflight-upload.ps1'), 'utf8');
  assert.match(script, /\$htmlFiles\.Count -ne 1/);
  assert.match(script, /location\\\.assign\\s\*\\\(/);
});
