'use strict';
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
function closeMenu() {nav.classList.remove('open');menu.setAttribute('aria-expanded', 'false');menu.textContent = 'Menu';}
menu.addEventListener('click', () => {const open = menu.getAttribute('aria-expanded') !== 'true';menu.setAttribute('aria-expanded', String(open));nav.classList.toggle('open', open);menu.textContent = open ? 'Close' : 'Menu';});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {if(event.key === 'Escape') {closeMenu();}});
document.querySelectorAll('[data-service]').forEach(button => button.addEventListener('click', () => {document.querySelector('#service').value = button.dataset.service;document.querySelector('#contact').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 640px)').matches ? 'instant' : 'smooth'});document.querySelector('#name').focus({preventScroll:true});}));
const form = document.querySelector('#contact-form');
form.addEventListener('submit', event => {event.preventDefault();const name = form.elements.name.value.trim();const brief = form.elements.brief.value.trim();if(!name || !brief) {return;}document.querySelector('#message').value = `Hi Josephine, I’m ${name}.\n\nI’d love to discuss ${form.elements.service.value === 'Let’s explore' ? 'a potential collaboration' : form.elements.service.value.toLowerCase()}.\n\n${brief}\n\nWould you be open to a conversation?`;document.querySelector('#introduction').hidden = false;document.querySelector('#copy-status').textContent = '';document.querySelector('#message').focus();});
document.querySelector('#copy').addEventListener('click', async () => {const message = document.querySelector('#message');try {await navigator.clipboard.writeText(message.value);document.querySelector('#copy-status').textContent = 'Copied. Paste your introduction into a LinkedIn message.';}catch {message.focus();message.select();document.querySelector('#copy-status').textContent = 'Select and copy the introduction, then paste it into LinkedIn.';}});
document.querySelector('#year').textContent = new Date().getFullYear();

// Studio ident: typography moves; the portrait remains still.
const intro = document.querySelector('#intro');
const skipIntro = document.querySelector('#skip-intro');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('.motion-toggle');
const films = [...document.querySelectorAll('.project-video')];
let introTimer;
let countTimer;
function dismissIntro(){clearTimeout(introTimer);clearInterval(countTimer);const restore=intro.contains(document.activeElement);intro.hidden=true;document.body.classList.remove('intro-playing');if(restore)document.querySelector('.brand').focus({preventScroll:true});try{sessionStorage.setItem('jopelo-closeup-seen','1');}catch{}}
function playOpening(){if(motionPreference.matches)return;clearTimeout(introTimer);clearInterval(countTimer);intro.hidden=false;intro.classList.remove('playing');void intro.offsetWidth;intro.classList.add('playing');document.body.classList.add('intro-playing');skipIntro.focus({preventScroll:true});let count=1;document.querySelector("#intro-count").textContent="001 / 003";countTimer=setInterval(()=>{count=Math.min(3,count+1);document.querySelector("#intro-count").textContent=`00${count} / 003`;},850);introTimer=setTimeout(dismissIntro,2800);}
let seen=false;try{seen=sessionStorage.getItem('jopelo-closeup-seen')==='1';}catch{}
if(!seen)playOpening();
skipIntro.addEventListener('click',dismissIntro);
document.querySelector('.replay-opening').addEventListener('click',playOpening);
intro.addEventListener('keydown',e=>{if(e.key==='Escape')dismissIntro();if(e.key==='Tab'){e.preventDefault();skipIntro.focus();}});
function setFilmMotion(paused){films.forEach(v=>{if(paused){v.pause();v.removeAttribute('autoplay');}else{v.play().catch(()=>{});}});}
motionButton.addEventListener('click',()=>{const paused=document.body.classList.toggle('motion-paused');motionButton.setAttribute('aria-pressed',String(paused));motionButton.textContent=paused?'Resume motion':'Pause motion';setFilmMotion(paused||motionPreference.matches);});
setFilmMotion(motionPreference.matches);
motionPreference.addEventListener('change',()=>{if(motionPreference.matches)dismissIntro();setFilmMotion(motionPreference.matches||document.body.classList.contains('motion-paused'));});
// Section typography enters once; photography and barcode remain still.
if (!motionPreference.matches && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}
  }),{threshold:.1});
  document.querySelectorAll('.section-heading h2,.principal h2,.contact h2').forEach(heading => {heading.classList.add('text-reveal');revealObserver.observe(heading);});
  motionPreference.addEventListener('change',()=>{if(motionPreference.matches)document.querySelectorAll('.text-reveal').forEach(el=>el.classList.add('is-visible'));});
}
const awardsToggle = document.querySelector('.awards-toggle');
awardsToggle.addEventListener('click', () => {
  const paused = document.querySelector('.awards').classList.toggle('awards-paused');
  awardsToggle.setAttribute('aria-pressed', String(paused));
  awardsToggle.textContent = paused ? 'Resume awards' : 'Pause awards';
});
