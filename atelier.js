/* PERMISOS 2D Atelier: enhancement layer. No administrative data writes here.
   Native Web Animations API + MutationObserver + keyboard controls + pointer feedback. */
(()=>{'use strict';
const $=id=>document.getElementById(id), reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const teacher=$('teacherView'), intro=teacher.querySelector('.intro-line'), summary=$('teacherSummary');
const rail=document.createElement('div');rail.className='action-rail';rail.setAttribute('aria-label','Accesos rápidos');
rail.innerHTML=`<div class="signal"><span class="action-orb" aria-hidden="true"></span><span><strong>Espacio de planificación · curso 2026/2027</strong><small>Explora el calendario o cambia de módulo sin perder contexto.</small></span></div><div class="action-links"><button type="button" data-atelier="agenda">Ver agenda →</button><button type="button" data-atelier="inbox">Centro de control ↗</button><button type="button" data-atelier="analytics">Analítica ↗</button></div>`;
intro.after(rail);
// Relocate the real status indicators to the personal decision rail; same data bindings.
const decisionRail=teacher.querySelector('.teacher-rail');decisionRail.prepend(summary);
rail.querySelector('[data-atelier="agenda"]').onclick=()=>{$('agendaMode').click();$('agendaView').scrollIntoView({block:'nearest',behavior:reduced?'instant':'smooth'})};
for(const [key,target] of [['inbox','inbox'],['analytics','analytics']])rail.querySelector(`[data-atelier="${key}"]`).onclick=()=>document.querySelector(`.sidebar [data-route="${target}"]`)?.click();
// Functional date exploration ribbon: references the actual calendar buttons, never reimplements date rules.
const calendar=$('teacherCalendar'),canvas=calendar.closest('.calendar-surface');
const label=document.createElement('p');label.className='date-rail-overline';label.textContent='EXPLORADOR · FECHAS CON ACTIVIDAD';
const dateRail=document.createElement('div');dateRail.className='date-rail';dateRail.setAttribute('role','group');dateRail.setAttribute('aria-label','Acceder a fechas con actividad');
canvas.querySelector('.weekdays').before(label,dateRail);
function paintDateRail(){
 const cells=[...calendar.querySelectorAll('.calendar-day')].filter(b=>!b.classList.contains('off'));
 const active=cells.filter(b=>b.classList.contains('has-demand'));
 const items=active.length?active:cells.slice(0,9);
 const fragment=document.createDocumentFragment();
 items.forEach(cell=>{const el=document.createElement('button');el.type='button';const day=cell.querySelector('.date-number')?.textContent||'';const count=cell.querySelector('.day-count')?.textContent?.trim()||'0 registros';el.setAttribute('aria-pressed',String(cell.classList.contains('selected')));el.setAttribute('aria-label',cell.getAttribute('aria-label')||'');const strong=document.createElement('strong');strong.textContent=day;const span=document.createElement('span');span.textContent=cell.classList.contains('conflict')?'Concurrencia':(cell.classList.contains('has-demand')?'Con actividad':'Disponible');const small=document.createElement('small');small.textContent=count;el.append(strong,span,small);el.addEventListener('click',()=>{cell.click();document.querySelector('.request-panel')?.scrollIntoView({block:'nearest',behavior:reduced?'instant':'smooth'})});fragment.append(el)});
 dateRail.replaceChildren(fragment);
}
new MutationObserver(paintDateRail).observe(calendar,{childList:true});paintDateRail();
// Heatmap mode distinguishes density visually, preserving all statuses and click handlers.
let heat=false;
for(const [view,root] of [['teacher',calendar],['admin',$('adminCalendar')]]){
 const target=root.closest('.calendar-surface');const controls=target.querySelector('.section-head');
 const btn=document.createElement('button');btn.className='heatmap-toggle';btn.type='button';btn.setAttribute('aria-pressed','false');btn.textContent='Mapa de intensidad';
 controls.after(btn);
 const enrich=()=>{root.querySelectorAll('.calendar-day').forEach(b=>{const n=+(b.querySelector('.day-count')?.textContent||'').match(/\d+/)?.[0]||0;b.style.setProperty('--intensity',Math.min(5,n));});};
 new MutationObserver(enrich).observe(root,{childList:true});enrich();
 btn.onclick=()=>{const on=btn.getAttribute('aria-pressed')!=='true';btn.setAttribute('aria-pressed',String(on));root.classList.toggle('heatmap',on);btn.textContent=on?'Vista normal':'Mapa de intensidad';if(!reduced)root.animate([{opacity:.7},{opacity:1}],{duration:260,easing:'ease-out'})};
}
// Keyboard calendar navigation with explicit spatial arrow semantics, Home/End within visible week.
for(const root of [calendar,$('adminCalendar')])root.addEventListener('keydown',e=>{
 const supported=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];if(!supported.includes(e.key))return;
 const all=[...root.querySelectorAll('.calendar-day')];const current=all.indexOf(document.activeElement);if(current<0)return;
 let target=current+({ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key]||0);
 if(e.key==='Home')target=current-current%7;
 if(e.key==='End')target=Math.min(all.length-1,current+(6-current%7));
 target=Math.max(0,Math.min(all.length-1,target));e.preventDefault();all[target]?.focus();
});
// Motion works only on user-triggered actions and is disabled for reduced-motion.
if(!reduced){
 const anim={duration:350,easing:'cubic-bezier(.18,.9,.26,1)'};
 ['teacherPrev','teacherNext','adminPrev','adminNext'].forEach(id=>$(id).addEventListener('click',()=>{const root=id.startsWith('teacher')?calendar:$('adminCalendar');root.classList.remove('month-enter');void root.offsetHeight;root.classList.add('month-enter');setTimeout(()=>root.classList.remove('month-enter'),850)}));
 const caseTitle=$('caseTitle'),inspector=$('casePanel');let last=caseTitle.textContent;
 new MutationObserver(()=>{if(last===caseTitle.textContent)return;last=caseTitle.textContent;inspector.animate([{opacity:.72,transform:'translateX(12px)'},{opacity:1,transform:'translateX(0)'}],anim)}).observe(caseTitle,{childList:true});
 const holder=document.querySelector('.request-panel');let previous='';new MutationObserver(()=>{const t=$('teacherSelectedTitle').textContent;if(t===previous)return;previous=t;holder.animate([{transform:'translateY(7px)',filter:'saturate(.8)'},{transform:'translateY(0)',filter:'saturate(1)'}],anim)}).observe($('teacherSelectedTitle'),{childList:true});
 const activeCounter=new Map();const obs=new MutationObserver(muts=>{for(const n of document.querySelectorAll('.teacher-summary .summary-item strong, .director-metric strong')){
 const text=n.textContent.trim(),prior=activeCounter.get(n);if(prior===text)continue;activeCounter.set(n,text);
 if(prior!==undefined)n.animate([{opacity:.6,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'ease-out'});
 }});obs.observe(summary,{childList:true,subtree:true});obs.observe($('directorMetrics'),{childList:true,subtree:true});
 // Hover affordances: pointer halo only on devices with a fine pointer.
 if(matchMedia('(pointer:fine)').matches){document.querySelectorAll('.intro-line').forEach(el=>{
 el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--orb-x',(e.clientX-r.left)/r.width);el.style.setProperty('--orb-y',(e.clientY-r.top)/r.height)},{passive:true});
 });}
}
// Director actions: the same route/event model; no alternative permission engine.
const ctrl=$('directorView');const directorRail=document.createElement('div');directorRail.className='action-rail';directorRail.innerHTML=`<div class="signal"><span class="action-orb" aria-hidden="true"></span><span><strong>Puesto de trabajo · Dirección</strong><small>Consulta expedientes, revisa concurrencias y registra simulaciones.</small></span></div><div class="action-links"><button data-d-action="pending" type="button">Pendientes ↗</button><button data-d-action="board" type="button">Tablero ↗</button><button data-d-action="ledger" type="button">Resoluciones ↗</button></div>`;
ctrl.querySelector('.intro-line').after(directorRail);
directorRail.querySelector('[data-d-action="pending"]').onclick=()=>{$('queueFilter').value='SOLICITADO';document.querySelector('.sidebar [data-route="inbox"]').click();$('queueFilter').dispatchEvent(new Event('change',{bubbles:true}))};
directorRail.querySelector('[data-d-action="board"]').onclick=()=>{document.querySelector('.sidebar [data-route="inbox"]').click();$('boardMode').click()};
directorRail.querySelector('[data-d-action="ledger"]').onclick=()=>document.querySelector('.sidebar [data-route="ledger"]').click();
const steps=document.createElement('div');steps.className='case-flow';steps.setAttribute('aria-label','Flujo del expediente');steps.innerHTML='<span>01 · Recepción</span><span>02 · Verificación</span><span>03 · Resolución</span>';
$('casePanel').querySelector('.case-rule').before(steps);
// Persistent bottom navigation on mobile/tablet portrait: real routes, no dead buttons.
const mobileNav=document.createElement('nav');mobileNav.className='mobile-action-dock';mobileNav.setAttribute('aria-label','Navegación rápida');
const destinations=[['teacher','Mi espacio','M3 4h18v16H3zM7 2v4m10-4v4M3 10h18'],['inbox','Bandeja','M3 3h18v18H3zM3 14h5l2 3h4l2-3h5'],['calendar','Ocupación','M3 7h18v14H3zM7 3v8m10-8v8M3 12h18'],['analytics','Analítica','M4 19V10m6 9V5m6 14v-7m5 7H3']];
for(const [name,title,path] of destinations){const btn=document.createElement('button');btn.type='button';btn.dataset.mobileRoute=name;btn.innerHTML=`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="${path}"/></svg><span>${title}</span>`;btn.setAttribute('aria-label',title);btn.onclick=()=>document.querySelector(`.sidebar [data-route="${name}"]`)?.click();mobileNav.append(btn)}
document.body.append(mobileNav);
function syncMobileNav(){const label=$('breadcrumb').textContent;const map={'Mi espacio':'teacher','Centro de control':'inbox','Ocupación':'calendar','Resoluciones':'inbox','Analítica y memoria':'analytics'};for(const btn of mobileNav.querySelectorAll('button')){const isCurrent=btn.dataset.mobileRoute===map[label];btn.classList.toggle('active',isCurrent);if(isCurrent)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current')}}
new MutationObserver(syncMobileNav).observe($('breadcrumb'),{childList:true});syncMobileNav();
})();
