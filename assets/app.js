(() => {
'use strict';
const projects = window.PORTFOLIO_PROJECTS || [];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);
$('yr').textContent = new Date().getFullYear();
const technologies = ['Vue & TypeScript','PHP & SQL','Python & Selenium','Flutter & Dart','Automation','Business systems'];
if (!reduced && 'IntersectionObserver' in window) {
const entrances = new IntersectionObserver(entries => {
for (const entry of entries) if (entry.isIntersecting) {
entry.target.animate([{opacity:.2,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,easing:'cubic-bezier(.22,1,.36,1)'});
entrances.unobserve(entry.target);
}
},{threshold:.12});
document.querySelectorAll('.section-intro,.feature-case,.project-card,.mobile-feature,.cta-box').forEach(element=>entrances.observe(element));
}
for (let copy=0;copy<2;copy++) for (const name of technologies) {const span=document.createElement('span');span.textContent=name;$('mq').append(span);}
let queued=false;
const updateScroll=()=>{const range=document.documentElement.scrollHeight-innerHeight;$('progress').style.width=(range>0?scrollY/range*100:0)+'%';$('nav').classList.toggle('stuck',scrollY>20);queued=false;};
window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateScroll);}},{passive:true});updateScroll();
const menu=document.querySelector('.menu-toggle'), nav=$('main-nav');
const closeMenu=()=>{menu.setAttribute('aria-expanded','false');nav.classList.remove('open');};
menu.addEventListener('click',()=>{const opened=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(opened));nav.classList.toggle('open',opened);});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
const cards=[...document.querySelectorAll('.project-card')], filters=[...document.querySelectorAll('[data-filter]')];
let category='All projects';
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function filterProjects(animate=false){
const terms=normalize($('project-search').value.trim()).split(/\s+/).filter(Boolean);let count=0;
for(const card of cards){const shown=(category==='All projects'||card.dataset.category===category)&&terms.every(term=>normalize(card.dataset.search).includes(term));card.hidden=!shown;if(shown){count++;if(animate&&!reduced)card.animate([{opacity:.3,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'ease-out'});}}
$('project-count').textContent=count===projects.length?'Showing all '+count+' projects':'Showing '+count+' of '+projects.length+' projects';
$('empty-state').hidden=count>0;
filters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===category)));
}
filters.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.filter;filterProjects(true);}));
$('project-search').addEventListener('input',()=>filterProjects());
$('reset-filters').addEventListener('click',()=>{category='All projects';$('project-search').value='';filterProjects(true);$('project-search').focus();});
const dialog=$('project-dialog'), image=$('gallery-image'), thumbs=$('gallery-thumbnails');
let active=null, slide=0, opener=null, previousOverflow='';
const fullImage=document.createElement('a');fullImage.className='full-image';fullImage.textContent='Open full image ↗';fullImage.target='_blank';fullImage.rel='noopener';document.querySelector('.gallery-stage').append(fullImage);
function addLink(url,label,primary=false){if(!url)return;const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener';link.className='btn '+(primary?'primary':'');link.textContent=label;$('dialog-links').append(link);}
function showSlide(index){
if(!active.images.length)return;
slide=(index+active.images.length)%active.images.length;const entry=active.images[slide];
image.hidden=false;image.src=entry.src;image.alt=active.name+' — '+entry.caption;fullImage.href=entry.src;fullImage.hidden=false;$('gallery-unavailable').hidden=true;
$('gallery-caption').textContent=(slide+1)+' / '+active.images.length+' · '+entry.caption;
[...thumbs.children].forEach((button,i)=>button.setAttribute('aria-pressed',String(i===slide)));
if(!reduced)image.animate([{opacity:.3,transform:'scale(.985)'},{opacity:1,transform:'scale(1)'}],{duration:260,easing:'ease-out'});
}
function openProject(slug,index,trigger){
active=projects.find(project=>project.slug===slug);if(!active)return;
opener=trigger;$('dialog-category').textContent=active.category;$('dialog-status').textContent=active.status;$('dialog-title').textContent=active.name;$('dialog-description').textContent=active.detail;
$('dialog-features').replaceChildren();for(const text of active.features){const li=document.createElement('li');li.textContent=text;$('dialog-features').append(li);}
$('dialog-stack').replaceChildren();for(const text of active.stack){const span=document.createElement('span');span.className='chip';span.textContent=text;$('dialog-stack').append(span);}
$('dialog-links').replaceChildren();
addLink(active.demo,active.slug==='time'?'Install Android app ↗':active.slug==='hotkey'?'Run browser preview ↗':['zentrix','gaston','portfolio'].includes(active.slug)?'Visit website ↗':'Try interactive demo ↗',true);
addLink(active.repo,'View source ↗');addLink(active.upwork,'View on Upwork ↗');
thumbs.replaceChildren();active.images.forEach((entry,i)=>{const button=document.createElement('button');button.type='button';button.setAttribute('aria-label','Image '+(i+1)+': '+entry.caption);button.setAttribute('aria-pressed','false');const preview=document.createElement('img');preview.src=entry.src;preview.alt='';preview.loading='lazy';button.append(preview);button.addEventListener('click',()=>showSlide(i));thumbs.append(button);});
$('gallery-prev').disabled=active.images.length<2;$('gallery-next').disabled=active.images.length<2;thumbs.hidden=active.images.length<2;
if(active.images.length){showSlide(Number(index)||0);}else{image.hidden=true;fullImage.hidden=true;$('gallery-unavailable').textContent='This project is in development. Interface previews will be added as the product progresses.';$('gallery-unavailable').hidden=false;$('gallery-caption').textContent='Work in progress';}
previousOverflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';dialog.scrollTop=0;document.querySelector('.dialog-close').focus();
if(!reduced)dialog.animate([{opacity:0,transform:'translateY(18px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:300,easing:'cubic-bezier(.22,1,.36,1)'});
}
document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>openProject(button.dataset.project,button.dataset.slide,button)));
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;opener?.focus();});
dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();});
$('gallery-prev').addEventListener('click',()=>showSlide(slide-1));$('gallery-next').addEventListener('click',()=>showSlide(slide+1));
dialog.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();showSlide(slide+(event.key==='ArrowRight'?1:-1));}});
image.addEventListener('error',()=>{image.hidden=true;fullImage.hidden=true;$('gallery-unavailable').textContent='Image temporarily unavailable. You can view this project on Upwork.';$('gallery-unavailable').hidden=false;});
const showcaseButtons=[...document.querySelectorAll('[data-showcase]')], showcase=document.querySelector('.showcase-screen');
showcaseButtons.forEach(button=>button.addEventListener('click',()=>{
const project=projects.find(entry=>entry.slug===button.dataset.showcase);if(!project)return;
const index={zentrix:1,gaston:7,nexo:0}[project.slug]||0;
$('showcase-img').src=project.images[index].src;$('showcase-img').alt=project.name+' — '+project.images[index].caption;$('showcase-label').textContent=project.name+' / '+project.images[index].caption;
showcase.dataset.project=project.slug;showcase.dataset.slide=index;showcase.setAttribute('aria-label','Explore '+project.name);
showcaseButtons.forEach(entry=>entry.setAttribute('aria-pressed',String(entry===button)));
if(!reduced)$('showcase-img').animate([{opacity:.15,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'});
}));
})();
