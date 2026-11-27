import { buttonLabel, coverOf, withAllPicks, filterProducts, nextIndex, prevIndex, safeUrl } from './catalog-helpers.js';

const state = { catalog:{products:[],categories:[]}, category:'All Picks', query:'', lb:{media:[],i:0} };

const $ = (s)=>document.querySelector(s);
const grid=$('#grid'), tabsEl=$('#tabs'), emptyEl=$('#empty'), searchEl=$('#search');
const lb=$('#lightbox'), lbMedia=$('#lb-media'), lbTitle=$('#lb-title'), lbCta=$('#lb-cta');

async function load(){
  let data;
  try { const r=await fetch('products.json',{cache:'no-store'}); if(!r.ok) throw new Error('no products.json'); data=await r.json(); }
  catch { data=await (await fetch('products.sample.json')).json(); }
  state.catalog = data;
  renderTabs(); renderGrid();
}

function renderTabs(){
  const cats = withAllPicks(state.catalog.categories || []);
  tabsEl.replaceChildren();
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
  grid.replaceChildren();
  emptyEl.hidden = items.length>0;
  for(const p of items){
    const cover=coverOf(p);
    const card=document.createElement('article'); card.className='card';
    const img=document.createElement('img'); img.className='cover'; img.loading='lazy';
    img.src = cover ? cover.src : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';
    img.alt=p.name; img.onclick=()=>openLightbox(p);
    const body=document.createElement('div'); body.className='body';
    const meta=document.createElement('div'); meta.className='meta';
    meta.textContent=`${p.category} · ${p.channel}`;
    const h3=document.createElement('h3'); h3.className='name'; h3.textContent=p.name;
    const desc=document.createElement('p'); desc.className='desc'; desc.textContent=p.description||'';
    body.appendChild(meta); body.appendChild(h3); body.appendChild(desc);
    const a=document.createElement('a'); a.className='btn'; a.href=safeUrl(p.link);
    a.target='_blank'; a.rel='nofollow sponsored noopener'; a.textContent=buttonLabel(p.channel);
    body.appendChild(a); card.appendChild(img); card.appendChild(body); grid.appendChild(card);
  }
}

function openLightbox(p){
  if(!p.media || !p.media.length){ const u=safeUrl(p.link); if(u!=='#') window.open(u,'_blank','noopener'); return; }
  state.lb={media:p.media,i:0};
  lbTitle.textContent=p.name; lbCta.href=safeUrl(p.link); lbCta.textContent=buttonLabel(p.channel);
  lb.hidden=false; renderLbMedia();
}
function renderLbMedia(){
  const m=state.lb.media[state.lb.i];
  lbMedia.textContent='';
  let el;
  if(m.type==='video'){ el=document.createElement('video'); el.src=m.src; el.controls=true; el.autoplay=true; el.playsInline=true; }
  else { el=document.createElement('img'); el.src=m.src; el.alt=''; }
  lbMedia.appendChild(el);
}
function closeLb(){ lb.hidden=true; lbMedia.replaceChildren(); }
function step(d){ const {media,i}=state.lb; state.lb.i = d>0?nextIndex(i,media.length):prevIndex(i,media.length); renderLbMedia(); }

$('.lb-close').onclick=closeLb;
$('.lb-prev').onclick=()=>step(-1);
$('.lb-next').onclick=()=>step(1);
lb.onclick=(e)=>{ if(e.target===lb) closeLb(); };
document.addEventListener('keydown',(e)=>{ if(lb.hidden)return; if(e.key==='Escape')closeLb(); if(e.key==='ArrowRight')step(1); if(e.key==='ArrowLeft')step(-1); });
searchEl.oninput=(e)=>{ state.query=e.target.value; renderGrid(); };

load();
