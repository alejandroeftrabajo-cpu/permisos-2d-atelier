/* Capa dinámica de producto: vistas alternativas, feedback y navegación táctil.
   Lee la interfaz de DemoAdapter; NO escribe estados ni modifica reglas. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const matchMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const observerConfig={childList:true,subtree:false};
document.querySelectorAll('.sidebar [data-route]').forEach(e=>e.dataset.tooltip=({teacher:'Mi espacio',inbox:'Centro de control',calendar:'Ocupación',ledger:'Resoluciones',analytics:'Analítica y memoria'})[e.dataset.route]||'');
// Semantic glyphs, crisp SVG instead of platform-dependent text symbols.
const symbols={teacher:'<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M7 2v4M17 2v4M3 10h18M8 14h2m3 0h2"/>',inbox:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 14h5l2 3h4l2-3h5"/>',calendar:'<path d="M3 7h18v14H3zM7 3v8m10-8v8M3 12h18"/>',ledger:'<path d="M7 3h10l4 4v14H7zM17 3v5h4M10 12h8M10 16h6"/>',analytics:'<path d="M4 19V10m6 9V5m6 14v-7m5 7H3"/>'};
for(const b of document.querySelectorAll('.sidebar [data-route]')){const glyph=b.querySelector('.nav-ico');if(glyph){glyph.innerHTML=`<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${symbols[b.dataset.route]}</svg>`;}}
const toast=document.createElement('div');toast.className='ui-context-pop';toast.role='status';toast.setAttribute('aria-live','polite');document.body.append(toast);
let dismissId=0;
function showToast(message){toast.textContent=message;toast.classList.add('visible');const k=++dismissId;setTimeout(()=>{if(k===dismissId)toast.classList.remove('visible')},2600)}
// View mode for a genuinely different, usable temporal interpretation.
const professorCalendar=$('teacherCalendar'),calendarWrap=professorCalendar.parentNode;
const agenda=document.createElement('div');agenda.id='agendaView';agenda.className='agenda-view';agenda.hidden=true;
const viewTools=document.createElement('div');viewTools.className='view-tools';viewTools.innerHTML='<small>EXPLORAR FECHAS</small><div class="mode-switch" role="group" aria-label="Modo de visualización de fechas"><button id="monthMode" type="button" aria-pressed="true">Calendario</button><button id="agendaMode" type="button" aria-pressed="false">Agenda</button></div>';
calendarWrap.insertBefore(viewTools,calendarWrap.querySelector('.weekdays'));
calendarWrap.insertBefore(agenda,calendarWrap.querySelector('.legend'));
let agendaMode=false;
function decorateAgenda(){const cells=[...professorCalendar.querySelectorAll('.calendar-day')];agenda.replaceChildren();const withRecords=cells.filter(b=>!b.classList.contains('off') && (b.classList.contains('has-demand') || b.classList.contains('selected')));
 if(!withRecords.length){agenda.innerHTML='<div class="agenda-empty">No hay solicitudes simuladas en este mes. Puedes seleccionar una fecha en el calendario.</div>';return}
 withRecords.forEach(day=>{const label=day.getAttribute('aria-label')||'';const n=day.querySelector('.date-number')?.textContent||'';const count=Number((day.querySelector('.day-count')?.textContent||'').split(' ')[0])||0;const row=document.createElement('button');row.type='button';row.className='agenda-row'+(day.classList.contains('conflict')?' danger':'');row.innerHTML=`<span class="agenda-date">${n}</span><span class="agenda-day"><strong></strong><small></small></span><span class="agenda-level">${count} ${count===1?'registro':'registros'} →</span>`;row.querySelector('strong').textContent=label.split(',')[0]||'Fecha';row.querySelector('small').textContent=day.classList.contains('conflict')?'Concurrencia de demostración':'Ocupación registrada en simulación';row.onclick=()=>{setMode(false);day.click();showToast('Fecha seleccionada · revisa el panel contextual')};agenda.append(row)})}
function setMode(mode){agendaMode=mode;$('monthMode').setAttribute('aria-pressed',String(!mode));$('agendaMode').setAttribute('aria-pressed',String(mode));professorCalendar.hidden=mode;calendarWrap.querySelector('.weekdays').hidden=mode;agenda.hidden=!mode;if(mode)decorateAgenda();}
$('monthMode').onclick=()=>setMode(false);$('agendaMode').onclick=()=>setMode(true);
new MutationObserver(()=>{if(agendaMode)decorateAgenda()}).observe(professorCalendar,observerConfig);
// Board instead of table: same requests, same filters, same click-to-case handling.
const queue=$('queueBody'),queueWrap=queue.closest('.table-wrap');const board=document.createElement('div');board.id='boardView';board.className='board-layout';board.hidden=true;queueWrap.after(board);
const modeBox=document.createElement('div');modeBox.className='view-tools';modeBox.innerHTML='<small>REPRESENTACIÓN</small><div class="mode-switch" role="group" aria-label="Modo de bandeja"><button type="button" id="tableMode" aria-pressed="true">Lista</button><button type="button" id="boardMode" aria-pressed="false">Tablero</button></div>';
$('inboxPage').querySelector('.filters').before(modeBox);
let boardMode=false;
const columns=[['SOLICITADO','Por resolver'],['CONCEDIDO','Concedidos'],['DENEGADO','Denegados / otros']];
function buildBoard(){board.replaceChildren();const source=[...queue.querySelectorAll('tr')].filter(tr=>tr.querySelector('button[data-case]'));
 for(const [key,title] of columns){const col=document.createElement('section');col.className='board-column';const match=source.filter(tr=>{const s=tr.querySelector('.status')?.textContent||'';return key==='DENEGADO'?s!=='SOLICITADO'&&s!=='CONCEDIDO':s===key});const head=document.createElement('h3');head.append(document.createTextNode(title));const num=document.createElement('em');num.textContent=match.length;head.append(num);col.append(head);
 for(const tr of match){const original=tr.querySelector('button[data-case]');const cells=tr.querySelectorAll('td');const b=document.createElement('button');b.type='button';b.className='board-case';const teacher=document.createElement('strong');teacher.textContent=cells[1]?.textContent||'';const date=document.createElement('small');date.textContent=cells[0]?.textContent||'';const ref=document.createElement('b');ref.textContent='VER EXPEDIENTE ↗';b.append(teacher,date,ref);b.onclick=()=>original.click();col.append(b)}board.append(col)}
}
function switchBoard(mode){boardMode=mode;$('tableMode').setAttribute('aria-pressed',String(!mode));$('boardMode').setAttribute('aria-pressed',String(mode));queueWrap.hidden=mode;board.hidden=!mode;if(mode)buildBoard()}
$('tableMode').onclick=()=>switchBoard(false);$('boardMode').onclick=()=>switchBoard(true);
new MutationObserver(()=>{if(boardMode)buildBoard()}).observe(queue,observerConfig);
// Functional visual feedback: date inspector reacts to a selection.
const selectedTitle=$('teacherSelectedTitle');new MutationObserver(()=>{const selected=selectedTitle.textContent;if(!selected||selected==='Selecciona una fecha')return;const panel=selectedTitle.closest('.request-panel');panel?.animate?.([{transform:'translateY(4px)',opacity:.8},{transform:'translateY(0)',opacity:1}],{duration:210,easing:'ease-out'})}).observe(selectedTitle,{childList:true});
// Calendar spotlight follows pointer; no continuous motion when unattended.
if(!matchMotion.matches && matchMedia('(pointer:fine)').matches){document.querySelectorAll('.calendar-surface').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--glow-x',(e.clientX-r.left)+'px');el.style.setProperty('--glow-y',(e.clientY-r.top)+'px');el.style.setProperty('--glow-active','1')},{passive:true});el.addEventListener('pointerleave',()=>el.style.setProperty('--glow-active','0'))})}
// Swipe calendar months on touch; avoid swiping inside controls to preserve normal scroll.
for(const [root,prev,next] of [['teacherCalendar','teacherPrev','teacherNext'],['adminCalendar','adminPrev','adminNext']]){let x=0,y=0;const el=$(root);el.addEventListener('touchstart',e=>{if(e.touches.length===1){x=e.touches[0].clientX;y=e.touches[0].clientY}},{passive:true});el.addEventListener('touchend',e=>{if(!x)return;const dx=e.changedTouches[0].clientX-x,dy=e.changedTouches[0].clientY-y;if(Math.abs(dx)>70 && Math.abs(dx)>Math.abs(dy)*1.5){$(dx<0?next:prev).click();showToast('Calendario actualizado')}x=0},{passive:true})}
// Live route announcement and visual orientation on meaningful navigation.
document.querySelectorAll('.sidebar [data-route],.director-tabs [data-route]').forEach(b=>b.addEventListener('click',()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const h=document.querySelector('.route-view:not([hidden]) h1');h?.animate?.([{opacity:.4,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'})}));
})();
