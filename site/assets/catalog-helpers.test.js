import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buttonLabel, coverOf, withAllPicks, filterProducts, nextIndex, prevIndex, safeUrl } from './catalog-helpers.js';

const P = [
  { id:1, name:'Silk Hair Towel', category:'Beauty', channel:'Amazon', media:[{type:'image',src:'a.jpg'}] },
  { id:2, name:'Ceramic Diffuser', category:'Home', channel:'TikTok', media:[] },
  { id:3, name:'Matcha Whisk Set', category:'Kitchen', channel:'Amazon', media:[{type:'image',src:'c.jpg'}] },
];

test('buttonLabel', () => {
  assert.equal(buttonLabel('Amazon'), 'View on Amazon →');
  assert.equal(buttonLabel('TikTok'), 'View on TikTok →');
});

test('coverOf returns first media or null', () => {
  assert.deepEqual(coverOf(P[0]), {type:'image',src:'a.jpg'});
  assert.equal(coverOf(P[1]), null);
});

test('withAllPicks prepends and dedupes', () => {
  assert.deepEqual(withAllPicks(['Beauty','Home']), ['All Picks','Beauty','Home']);
});

test('filterProducts by category', () => {
  assert.deepEqual(filterProducts(P, {category:'Beauty'}).map(p=>p.id), [1]);
  assert.deepEqual(filterProducts(P, {category:'All Picks'}).map(p=>p.id), [1,2,3]);
});

test('filterProducts by query (case-insensitive, name)', () => {
  assert.deepEqual(filterProducts(P, {query:'matcha'}).map(p=>p.id), [3]);
  assert.deepEqual(filterProducts(P, {query:''}).map(p=>p.id), [1,2,3]);
});

test('next/prevIndex wrap around', () => {
  assert.equal(nextIndex(2,3), 0);
  assert.equal(prevIndex(0,3), 2);
  assert.equal(nextIndex(0,1), 0);
});

test('safeUrl allows http/https, blocks everything else', () => {
  assert.equal(safeUrl('https://amzn.to/x'), 'https://amzn.to/x');
  assert.equal(safeUrl('http://x.com/'), 'http://x.com/');
  assert.equal(safeUrl('javascript:alert(1)'), '#');
  assert.equal(safeUrl('data:text/html,<script>'), '#');
  assert.equal(safeUrl(''), '#');
  assert.equal(safeUrl(undefined), '#');
});
