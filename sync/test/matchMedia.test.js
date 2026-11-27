import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchMedia, productIdFromFilename, mediaType } from '../src/matchMedia.js';

test('productIdFromFilename parses leading number + separator', () => {
  assert.equal(productIdFromFilename('1.2.jpg'), 1);
  assert.equal(productIdFromFilename('12-main.png'), 12);
  assert.equal(productIdFromFilename('3_a.mp4'), 3);
  assert.equal(productIdFromFilename('banner.jpg'), null); // no leading number
  assert.equal(productIdFromFilename('10'), null);         // no separator/ext
});

test('mediaType classifies images vs videos vs null', () => {
  assert.equal(mediaType('a.JPG'), 'image');
  assert.equal(mediaType('a.webp'), 'image');
  assert.equal(mediaType('a.mp4'), 'video');
  assert.equal(mediaType('a.mov'), 'video');
  assert.equal(mediaType('a.txt'), null);
});

test('attaches natural-sorted media, first is cover', () => {
  const products=[{id:1,name:'A'},{id:2,name:'B'}];
  const files=[
    {id:'f10',name:'1.10.jpg'},{id:'f2',name:'1.2.jpg'},{id:'f1',name:'1.1.jpg'},
    {id:'v',name:'1.3.mp4'},{id:'x',name:'2.1.png'},{id:'skip',name:'notes.txt'},
  ];
  const out=matchMedia(products, files);
  assert.deepEqual(out[0].media.map(m=>m.fileName), ['1.1.jpg','1.2.jpg','1.3.mp4','1.10.jpg']);
  assert.deepEqual(out[0].media[0], {type:'image',src:'media/1.1.jpg',fileId:'f1',fileName:'1.1.jpg'});
  assert.equal(out[0].media[2].type,'video');
  assert.deepEqual(out[1].media.map(m=>m.fileName), ['2.1.png']);
});

test('product with no media gets empty array', () => {
  const out=matchMedia([{id:9,name:'Z'}], [{id:'f',name:'1.1.jpg'}]);
  assert.deepEqual(out[0].media, []);
});
