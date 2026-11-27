// sync/test/parseProducts.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseProducts } from '../src/parseProducts.js';

const header = ['#','Name','Category','Description','Channel','Link','Show'];

test('parses valid rows and collects categories in order', () => {
  const rows = [header,
    ['1','Silk Hair Towel','Beauty','Soft','Amazon','https://a/1','yes'],
    ['2','Ceramic Diffuser','Home','Calm','TikTok','https://a/2',''],
    ['3','Matcha Set','Beauty','Ritual','Amazon','https://a/3','YES'],
  ];
  const r = parseProducts(rows);
  assert.equal(r.products.length, 3);
  assert.deepEqual(r.products[0], {id:1,name:'Silk Hair Towel',category:'Beauty',description:'Soft',channel:'Amazon',link:'https://a/1'});
  assert.deepEqual(r.categories, ['Beauty','Home']); // first-seen order, deduped
});

test('skips rows missing name/channel/link with reasons', () => {
  const rows = [header,
    ['1','','Beauty','x','Amazon','https://a/1','yes'],     // no name
    ['2','Thing','Home','x','','https://a/2','yes'],         // no channel
    ['3','Thing3','Home','x','Amazon','','yes'],             // no link
  ];
  const r = parseProducts(rows);
  assert.equal(r.products.length, 0);
  assert.equal(r.skipped.length, 3);
  assert.match(r.skipped[0].reason, /name/i);
});

test('Show=no/false/0/hide hides product (case-insensitive)', () => {
  for (const v of ['no','NO','false','0','hide','Hide']) {
    const rows = [header, ['1','T','Home','x','Amazon','https://a/1',v]];
    assert.equal(parseProducts(rows).products.length, 0, `expected hidden for ${v}`);
  }
});

test('duplicate # keeps first, skips later', () => {
  const rows = [header,
    ['1','First','Home','x','Amazon','https://a/1','yes'],
    ['1','Second','Home','x','Amazon','https://a/2','yes'],
  ];
  const r = parseProducts(rows);
  assert.equal(r.products.length, 1);
  assert.equal(r.products[0].name, 'First');
});

test('trims whitespace and ignores fully empty rows', () => {
  const rows = [header, ['', '', '', '', '', '', ''],
    [' 5 ',' Name ',' Cat ',' D ',' Amazon ',' https://a/5 ','yes']];
  const r = parseProducts(rows);
  assert.equal(r.products.length, 1);
  assert.deepEqual(r.products[0], {id:5,name:'Name',category:'Cat',description:'D',channel:'Amazon',link:'https://a/5'});
});
