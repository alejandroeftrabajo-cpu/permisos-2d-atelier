/* Capa experimental de interacciones visuales.
   No escribe datos, cambia estados administrativos ni solicita permisos. */
(()=>{'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const calendarIds=['teacherCalendar','adminCalendar'];
function decorateCalendars(){
 for(const id of calendarIds){const root=document.getElementById(id);if(!root)return;
  [...root.querySelectorAll('.calendar-day')].forEach((b,i)=>{
   b.style.setProperty('--cell-index',String(i%7));
   // La fecha y las cifras provienen del aria-label que ya genera el motor.
   const label=b.getAttribute('aria-label')||'';
   const parts=label.split(',');
   b.dataset.preview=parts.slice(0,Math.min(3,parts.length)).join(' · ');
  });
 }
}
const observer=new MutationObserver(decorateCalendars);
calendarIds.forEach(id=>{const root=document.getElementById(id);if(root)observer.observe(root,{childList:true})});
decorateCalendars();
if(!reduced){
 document.addEventListener('pointerdown',e=>{
  const target=e.target.closest('.primary-button:not(:disabled), .tab, .side-link, .calendar-day, .icon-button');
  if(!target||e.pointerType==='mouse'&&e.button!==0)return;
  const r=target.getBoundingClientRect();const ripple=document.createElement('span');
  ripple.className='ui-ripple';ripple.style.left=(e.clientX-r.left)+'px';ripple.style.top=(e.clientY-r.top)+'px';
  target.append(ripple);ripple.addEventListener('animationend',()=>ripple.remove(),{once:true});
 },{passive:true});
}
// Navegador rápido útil en escritorio, iPad y móvil: Ctrl/⌘ + K.
const topActions=document.querySelector('.top-actions');
if(topActions){
 const launch=document.createElement('button');launch.className='jump-launch';launch.type='button';
 launch.setAttribute('aria-label','Ir a un módulo (Control K)');launch.innerHTML='<span class="jump-icon" aria-hidden="true">⌕</span><span class="jump-label">Ir a un módulo</span><kbd>⌘ K</kbd>';
 topActions.insertBefore(launch,topActions.firstChild);
 const palette=document.createElement('div');palette.className='jump-overlay';palette.hidden=true;
 palette.innerHTML=`<div class="jump-shade" data-jump-close></div>
 <section class="jump-dialog" role="dialog" aria-modal="true" aria-labelledby="jumpTitle">
 <div class="jump-search"><span aria-hidden="true">⌕</span><input id="jumpInput" autocomplete="off" placeholder="Escribe un módulo…" aria-label="Buscar un módulo"><kbd>ESC</kbd></div>
 <p class="jump-caption" id="jumpTitle">NAVEGACIÓN · PERMISOS 2D</p>
 <div class="jump-results" id="jumpResults"></div><p class="jump-tip">↑ ↓ para seleccionar · Intro para abrir · Esc para cerrar</p></section>`;
 document.body.append(palette);
 const items=[
  ['teacher','Mi espacio','Solicitar y consultar permisos','▦'],
  ['inbox','Centro de control','Bandeja de Dirección','▤'],
  ['calendar','Calendario de ocupación','Concurrencias por fecha','▦'],
  ['ledger','Resoluciones ficticias','Registro experimental','◫'],
  ['analytics','Analítica y memoria','Estadísticas e informe imprimible','▥']
 ];
 let previous=null,activeIndex=0,matching=items;
 const input=palette.querySelector('#jumpInput'),results=palette.querySelector('#jumpResults');
 function draw(){const term=input.value.trim().toLocaleLowerCase('es');matching=items.filter(x=>(x[1]+' '+x[2]).toLocaleLowerCase('es').includes(term));activeIndex=Math.min(activeIndex,Math.max(0,matching.length-1));
  results.replaceChildren();matching.forEach((x,i)=>{const b=document.createElement('button');b.type='button';b.className='jump-item'+(i===activeIndex?' chosen':'');b.innerHTML=`<span class="jump-item-icon" aria-hidden="true">${x[3]}</span><span><b>${x[1]}</b><small>${x[2]}</small></span><span class="jump-arrow" aria-hidden="true">↗</span>`;b.onmouseenter=()=>{activeIndex=i;highlight()};b.onclick=()=>{close();document.querySelector(`.sidebar [data-route="${x[0]}"]`)?.click()};results.append(b)});
  if(!matching.length){const n=document.createElement('p');n.className='jump-empty';n.textContent='Sin módulos coincidentes.';results.append(n)}}
 function highlight(){[...results.querySelectorAll('.jump-item')].forEach((b,i)=>b.classList.toggle('chosen',i===activeIndex))}
 function open(){previous=document.activeElement;input.value='';activeIndex=0;draw();palette.hidden=false;document.body.classList.add('jump-open');input.focus()}
 function close(){palette.hidden=true;document.body.classList.remove('jump-open');previous?.focus?.()}
 launch.onclick=()=>palette.hidden?open():close();palette.querySelector('[data-jump-close]').onclick=close;
 input.oninput=()=>{activeIndex=0;draw()};
 input.onkeydown=e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();activeIndex=(activeIndex+(e.key==='ArrowDown'?1:-1)+matching.length)%Math.max(1,matching.length);highlight()}
 else if(e.key==='Enter'&&matching.length){e.preventDefault();results.querySelectorAll('.jump-item')[activeIndex]?.click()}
 else if(e.key==='Tab'){e.preventDefault()}};
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();palette.hidden?open():close()}
 else if(e.key==='Escape'&&!palette.hidden){e.preventDefault();e.stopImmediatePropagation();close()}},true);
}
const style=document.createElement('style');style.textContent=`
.primary-button,.tab,.side-link,.calendar-day,.icon-button{position:relative}
.ui-ripple{position:absolute;z-index:4;width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.16);transform:translate(-50%,-50%) scale(1);pointer-events:none;animation:ui-ripple .34s ease-out forwards}
@keyframes ui-ripple{to{opacity:0;transform:translate(-50%,-50%) scale(11)}}
@media(prefers-reduced-motion:reduce){.ui-ripple{display:none!important}}
`;document.head.append(style);
})();
