import { buttonLabel, coverOf, withAllPicks, filterProducts, nextIndex, prevIndex } from './catalog-helpers.js';

const state = { catalog:{products:[],categories:[]}, category:'All Picks', query:'', lb:{media:[],i:0} };

const $ = (s)=>document.querySelector(s);
const grid=$('#grid'), tabsEl=$('#tabs'), emptyEl=$('#empty'), searchEl=$('#search');
const lb=$('#lightbox'), lbMedia=$('#lb-media'), lbTitle=$('#lb-title'), lbCta=$('#lb-cta');

async function load(){
  let data;
  try { data = await (await fetch('products.json',{cache:'no-store'})).json(); }
  catch { data = await (await fetch('products.sample.json')).json(); }
  state.catalog = data;
  renderTabs(); renderGrid();
}

function renderTabs(){
  const cats = withAllPicks(state.catalog.categories || []);
  tabsEl.innerHTML='';
  for(const c of cats){
    const b=document.createElement('button');
    b.className='tab'+(c===state.category?' active':'');
    b.textContent=c;
    b.onclick=()=>{ state.category=c; renderTabs(); renderGrid(); };
    tabsEl.appendChild(b);
  }
}

function renderGrid(){
  const items=filterProducts(state.catalog.products, {category:state.category, query:state.query});
  grid.innerHTML='';
  emptyEl.hidden = items.length>0;
  for(const p of items){
    const cover=coverOf(p);
    const card=document.createElement('article'); card.className='card';
    const img=document.createElement('img'); img.className='cover'; img.loading='lazy';
    img.src = cover ? cover.src : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';
    img.alt=p.name; img.onclick=()=>openLightbox(p);
    const body=document.createElement('div'); body.className='body';
    body.innerHTML=`<div class="meta">${p.category} · ${p.channel}</div>
      <h3 class="name"></h3><p class="desc"></p>`;
    body.querySelector('.name').textContent=p.name;
    body.querySelector('.desc').textContent=p.description||'';
    const a=document.createElement('a'); a.className='btn'; a.href=p.link;
    a.target='_blank'; a.rel='nofollow sponsored noopener'; a.textContent=buttonLabel(p.channel);
    body.appendChild(a); card.appendChild(img); card.appendChild(body); grid.appendChild(card);
  }
}

function openLightbox(p){
  if(!p.media || !p.media.length) { window.open(p.link,'_blank','noopener'); return; }
  state.lb={media:p.media,i:0};
  lbTitle.textContent=p.name; lbCta.href=p.link; lbCta.textContent=buttonLabel(p.channel);
  lb.hidden=false; renderLbMedia();
}
function renderLbMedia(){
  const m=state.lb.media[state.lb.i];
  lbMedia.innerHTML = m.type==='video'
    ? `<video src="${m.src}" controls autoplay playsinline></video>`
    : `<img src="${m.src}" alt="">`;
}
function closeLb(){ lb.hidden=true; lbMedia.innerHTML=''; }
function step(d){ const {media,i}=state.lb; state.lb.i = d>0?nextIndex(i,media.length):prevIndex(i,media.length); renderLbMedia(); }

$('.lb-close').onclick=closeLb;
$('.lb-prev').onclick=()=>step(-1);
$('.lb-next').onclick=()=>step(1);
lb.onclick=(e)=>{ if(e.target===lb) closeLb(); };
document.addEventListener('keydown',(e)=>{ if(lb.hidden)return; if(e.key==='Escape')closeLb(); if(e.key==='ArrowRight')step(1); if(e.key==='ArrowLeft')step(-1); });
searchEl.oninput=(e)=>{ state.query=e.target.value; renderGrid(); };

load();
