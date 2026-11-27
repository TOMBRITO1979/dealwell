// sync/test/buildCatalog.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalog } from '../src/buildCatalog.js';

test('builds frontend contract and strips drive fields', () => {
  const products=[{id:1,name:'A',category:'Home',description:'d',channel:'Amazon',link:'L',
    media:[{type:'image',src:'media/1.1.jpg',fileId:'x',fileName:'1.1.jpg'}]}];
  const cat=buildCatalog({products,categories:['Home']}, '2026-11-26T00:00:00Z');
  assert.equal(cat.generated_at,'2026-11-26T00:00:00Z');
  assert.deepEqual(cat.categories,['Home']);
  assert.deepEqual(cat.products[0],{id:1,name:'A',category:'Home',description:'d',channel:'Amazon',link:'L',
    media:[{type:'image',src:'media/1.1.jpg'}]});
  assert.equal('fileId' in cat.products[0].media[0], false);
});
