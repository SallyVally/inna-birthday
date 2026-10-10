'use strict';
const experience = document.querySelector('#experience');
const scenes = [...document.querySelectorAll('.scene')];
const progress = document.querySelector('.story-progress');
const controls = document.querySelector('.story-controls');
const next = document.querySelector('#next');
const back = document.querySelector('#back');
const progressButtons = [...document.querySelectorAll('[data-go]')];
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let current = 0;
let transitioning = false;
let blown = false;
let blowTimer;
let transitionTimer;
let startTimer;
const bloomed = new Set();
let pointerStart;

function setScene(index, {focus = true} = {}) {
  if (transitioning || index === current || index < 0 || index >= scenes.length) return;
  clearTimeout(blowTimer);
  transitioning = true;
  const old = scenes[current];
  const incoming = scenes[index];
  const reverse = index < current;
  if (index === 0) document.querySelector('.gift-envelope').classList.remove('opening');
  old.classList.remove('is-active', 'is-entering', 'reverse');
  old.classList.add('is-leaving');
  old.inert = true;
  if (reverse) old.classList.add('reverse');
  incoming.hidden = false;
  incoming.inert = false;
  incoming.classList.remove('is-leaving', 'reverse');
  if (reverse) incoming.classList.add('reverse');
  incoming.classList.add('is-active', 'is-entering');
  current = index;
  experience.dataset.scene = String(index);
  progress.hidden = index === 0;
  controls.hidden = index === 0 || index === 5;
  next.hidden = index === 5;
  next.textContent = index === 3 ? 'К сюрпризу →' : index === 4 ? 'К финалу →' : 'Дальше →';
  document.querySelector('#scene-number').textContent = String(index).padStart(2, '0');
  progressButtons.forEach((button, i) => {
    button.classList.toggle('is-visited', i + 1 <= index);
    if (i + 1 === index) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  transitionTimer = setTimeout(() => {
    old.hidden = true;
    old.classList.remove('is-leaving', 'reverse');
    incoming.classList.remove('is-entering');
    transitioning = false;
  }, motionQuery.matches ? 0 : 760);
  if (focus) {
    const title = incoming.querySelector('h1,h2');
    title.tabIndex = -1;
    title.focus({preventScroll:true});
  }
  if (index === 1) burst(34, .5, .4);
  if (index === 5) burst(95, .5, .2);
  if (index === 2) incoming.querySelector('.letter-paper').scrollTop = 0;
}

document.querySelector('#start').addEventListener('click', () => {
  const startButton = document.querySelector('#start');
  if (startButton.disabled) return;
  startButton.disabled = true;
  document.querySelector('.gift-envelope').classList.add('opening');

  startTimer = setTimeout(() => { setScene(1); startButton.disabled = false; }, motionQuery.matches ? 0 : 1100);
});
next.addEventListener('click', () => setScene(current + 1));
back.addEventListener('click', () => setScene(current - 1));
progressButtons.forEach(button => button.addEventListener('click', () => setScene(Number(button.dataset.go))));
document.addEventListener('keydown', event => {
  if (current === 0 || ['INPUT','TEXTAREA'].includes(event.target.tagName)) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); setScene(current + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); setScene(current - 1); }
});
experience.addEventListener('pointerdown', event => {
  if (event.target.closest('button,.letter-paper') || event.pointerType === 'mouse') return;
  pointerStart = {x:event.clientX,y:event.clientY};
});
experience.addEventListener('pointerup', event => {
  if (!pointerStart) return;
  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  pointerStart = null;
  if (current > 0 && Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy)*1.5) setScene(current + (dx < 0 ? 1 : -1));
});
experience.addEventListener('pointercancel', () => {pointerStart = null;});

const wishTexts = [
  'Крепкого здоровья. Пусть хватает сил на всё, что ты любишь.',
  'Много радости. Пусть каждый день приносит повод улыбнуться.',
  'Большой любви. Пусть рядом всегда будут родные и близкие.'
];
const bloomButtons = [...document.querySelectorAll('[data-bloom]')];
bloomButtons.forEach((button, index) => button.addEventListener('click', () => {
  bloomed.add(index);
  button.classList.add('is-bloomed');
  button.setAttribute('aria-pressed', 'true');
  document.querySelector('#flower-wish').textContent = wishTexts[index];
  document.querySelector('#bloom-count').textContent = `${bloomed.size} из 3 цветков`;
  const rect = button.getBoundingClientRect();
  const shell = experience.getBoundingClientRect();
  burst(20, (rect.left + rect.width/2-shell.left)/shell.width, (rect.top+rect.height/2-shell.top)/shell.height);

  if (bloomed.size === 3) {
    document.querySelector('.interactive-bouquet').classList.add('all-bloomed');
    document.querySelector('#flower-hint').textContent = 'Этот букет — для тебя ♡';
    document.querySelector('#bloom-count').textContent = 'Все пожелания — от всего сердца';
  }
}));

document.querySelector('#blow').addEventListener('click', () => {
  if (blown) return;
  blown = true;
  document.querySelector('.cake-stage').classList.add('is-blown');
  document.querySelector('#blow').disabled = true;
  document.querySelector('#blow').textContent = 'Пусть сбудется ♡';
  document.querySelector('#candle-status').textContent = 'Твоё желание отправляется к звёздам…';
  burst(45, .5, .5);

  blowTimer = setTimeout(() => setScene(5), motionQuery.matches ? 800 : 2000);
});

document.querySelector('#hug').addEventListener('click', () => {
  document.querySelector('#hug-response').hidden = false;
  const heart = document.querySelector('#heart-hug');
  heart.classList.remove('is-hugging');
  void heart.offsetWidth;
  heart.classList.add('is-hugging');
  burst(65, .5, .5, true);

});
document.querySelector('#replay').addEventListener('click', () => {
  if (transitioning) return;
  clearTimeout(startTimer);
  clearTimeout(blowTimer);
  bloomed.clear();
  bloomButtons.forEach(button => {button.classList.remove('is-bloomed');button.setAttribute('aria-pressed','false');});
  document.querySelector('.interactive-bouquet').classList.remove('all-bloomed');
  document.querySelector('#flower-hint').textContent = 'Коснись каждого цветка';
  document.querySelector('#flower-wish').textContent = 'В этом букете — всё, чего я желаю тебе.';
  document.querySelector('#bloom-count').textContent = '0 из 3 цветков';
  document.querySelector('.cake-stage').classList.remove('is-blown');
  blown = false;
  const blow = document.querySelector('#blow');
  blow.disabled = false;
  blow.textContent = 'Задуть свечу ✧';
  document.querySelector('#candle-status').textContent = 'И пусть всё хорошее сбудется';
  document.querySelector('#hug-response').hidden = true;
  document.querySelector('#heart-hug').classList.remove('is-hugging');
  document.querySelector('.gift-envelope').classList.remove('opening');
  particles.length = 0;
  setScene(0);
});

// Transform-only UI animation plus one bounded canvas for floating petals and bursts.
const canvas = document.querySelector('#particles');
const ctx = canvas.getContext('2d');
let width = 0,height = 0,frame = 0,lastTime = 0;
const particles = [];
const ambientPetals = Array.from({length:13},()=>({x:Math.random(),y:Math.random(),size:2+Math.random()*3,speed:.000025+Math.random()*.000025,phase:Math.random()*6.28}));
const colors = ['#ba7894','#d69cb0','#c4a37b','#a9b596','#e6beb1'];
function sizeCanvas() {
  const rect = experience.getBoundingClientRect();
  width = rect.width;height = rect.height;
  const ratio = Math.min(window.devicePixelRatio||1,2);
  canvas.width = Math.round(width*ratio);canvas.height = Math.round(height*ratio);
  if(ctx) ctx.setTransform(ratio,0,0,ratio,0,0);
}
function burst(count,x,y,hearts=false) {
  if(motionQuery.matches || !ctx) return;
  while(particles.length>180-count) particles.shift();
  for(let i=0;i<count;i++) {
    const angle = Math.random()*Math.PI*2;
    const velocity = 1.2+Math.random()*3.6;
    particles.push({x:x*width,y:y*height,vx:Math.cos(angle)*velocity,vy:Math.sin(angle)*velocity-1.4,size:3+Math.random()*5,rotation:Math.random()*6.28,spin:(Math.random()-.5)*.1,life:1,color:colors[Math.floor(Math.random()*colors.length)],hearts});
  }
}
function draw(time) {
  if(!ctx) return;
  const delta = Math.min(time-(lastTime||time),40);lastTime=time;
  ctx.clearRect(0,0,width,height);
  if(!motionQuery.matches) {
    for(const petal of ambientPetals) {
      petal.y-=petal.speed*delta;if(petal.y<-.03)petal.y=1.03;
      ctx.save();ctx.globalAlpha=.25;ctx.fillStyle='#c6949c';
      ctx.translate(petal.x*width+Math.sin(time*.0005+petal.phase)*12,petal.y*height);
      ctx.rotate(time*.0002+petal.phase);ctx.beginPath();ctx.ellipse(0,0,petal.size,petal.size*.45,0,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    for(let i=particles.length-1;i>=0;i--) {
      const p=particles[i];const step=delta/16.67;
      p.x+=p.vx*step;p.y+=p.vy*step;p.vy+=.025*step;p.rotation+=p.spin*step;p.life-=.007*step;
      if(p.life<=0){particles.splice(i,1);continue;}
      ctx.save();ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.translate(p.x,p.y);ctx.rotate(p.rotation);
      if(p.hearts){ctx.font=`${p.size*2.5}px Georgia`;ctx.fillText('♥',-p.size,-p.size);}
      else ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.7);
      ctx.restore();
    }
  }
  frame=requestAnimationFrame(draw);
}
new ResizeObserver(sizeCanvas).observe(experience);
sizeCanvas();
if(ctx)frame=requestAnimationFrame(draw);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){cancelAnimationFrame(frame);frame=0;}
  else {lastTime=0;if(ctx&&!frame)frame=requestAnimationFrame(draw);}
});
window.addEventListener('pagehide',()=>{
  cancelAnimationFrame(frame);frame=0;
  clearTimeout(transitionTimer);clearTimeout(blowTimer);clearTimeout(startTimer);
  scenes.forEach((scene,index)=>{
    scene.hidden=index!==current;scene.inert=index!==current;
    scene.classList.remove('is-entering','is-leaving','reverse');
    scene.classList.toggle('is-active',index===current);
  });
  transitioning=false;
  document.querySelector('#start').disabled=false;
  if(current===0)document.querySelector('.gift-envelope').classList.remove('opening');
});
window.addEventListener('pageshow',event=>{
  if(!event.persisted)return;
  lastTime=0;if(ctx&&!frame)frame=requestAnimationFrame(draw);

});
