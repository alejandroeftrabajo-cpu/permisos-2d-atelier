/* PERMISOS 2D · fuente de datos de laboratorio. No usa red, cookies ni almacenamiento local. */
'use strict';
const DEMO_CAPACITY=4; // Hipótesis de demostración, NO parámetro normativo validado.
const DEMO_ALLOWANCE=2; // Solo diseño visual, NO adjudicación administrativa.
const DEMO_NON_TEACHING=new Set(['2026-10-12','2026-11-02','2026-12-07','2026-12-08','2027-01-06','2027-02-26','2027-03-01','2027-05-03']);
const DEMO_USERS=[
 {id:'u-a',name:'Lia Arvendel',email:'lia.arvendel@example.invalid'},
 {id:'u-b',name:'Nura Velmir',email:'nura.velmir@example.invalid'},
 {id:'u-c',name:'Teo Nereval',email:'teo.nereval@example.invalid'},
 {id:'u-d',name:'Mara Solvende',email:'mara.solvende@example.invalid'},
 {id:'u-e',name:'Bruno Elevar',email:'bruno.elevar@example.invalid'},
 {id:'u-f',name:'Iris Cantelar',email:'iris.cantelar@example.invalid'},
 {id:'u-g',name:'Sael Montiver',email:'sael.montiver@example.invalid'}
];
const DEMO_REQUESTS=[
 {id:'S-001',userId:'u-a',dateRequested:'2026-10-13',submittedAt:'2026-09-16',status:'SOLICITADO'},
 {id:'S-002',userId:'u-b',dateRequested:'2026-10-20',submittedAt:'2026-09-18',status:'SOLICITADO'},
 {id:'S-003',userId:'u-c',dateRequested:'2026-10-20',submittedAt:'2026-09-19',status:'SOLICITADO'},
 {id:'S-004',userId:'u-d',dateRequested:'2026-10-20',submittedAt:'2026-09-19',status:'SOLICITADO'},
 {id:'S-005',userId:'u-e',dateRequested:'2026-10-20',submittedAt:'2026-09-13',status:'CONCEDIDO'},
 {id:'S-006',userId:'u-f',dateRequested:'2026-10-20',submittedAt:'2026-09-20',status:'CONCEDIDO'},
 {id:'S-007',userId:'u-e',dateRequested:'2026-10-21',submittedAt:'2026-09-24',status:'SOLICITADO'},
 {id:'S-008',userId:'u-d',dateRequested:'2026-10-21',submittedAt:'2026-09-25',status:'SOLICITADO'},
 {id:'S-009',userId:'u-a',dateRequested:'2026-11-27',submittedAt:'2026-10-02',status:'SOLICITADO'},
 {id:'S-010',userId:'u-g',dateRequested:'2026-09-17',submittedAt:'2026-09-03',status:'DENEGADO'},
 {id:'S-011',userId:'u-b',dateRequested:'2027-02-18',submittedAt:'2027-01-12',status:'SOLICITADO'}
];
const isoDate=d=>{const a=d.split('-').map(Number);return new Date(Date.UTC(a[0],a[1]-1,a[2],12))};
const dateKey=d=>`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
const dateAdd=(key,n)=>{const d=isoDate(key);d.setUTCDate(d.getUTCDate()+n);return dateKey(d)};
const isOff=key=>[0,6].includes(isoDate(key).getUTCDay())||DEMO_NON_TEACHING.has(key);
const prettyDate=(key,withYear=true)=>new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',day:'numeric',month:'long',...(withYear?{year:'numeric'}:{})}).format(isoDate(key));
const trimesters=key=>{const m=Number(key.slice(5,7));return m>=9?1:m<=3?2:3};
class DemoAdapter{
 constructor(){this.users=structuredClone(DEMO_USERS);this.requests=structuredClone(DEMO_REQUESTS);this.resolutions=[];this.nextId=12;}
 async getIdentity(userId){return this.users.find(u=>u.id===userId)||null}
 async getDashboard(){return {users:structuredClone(this.users),requests:structuredClone(this.requests),resolutions:structuredClone(this.resolutions),capacity:DEMO_CAPACITY,allowance:DEMO_ALLOWANCE,source:'synthetic',persistence:false}}
 async requestDay({userId,dateRequested}){
  if(!this.users.find(u=>u.id===userId))throw new Error('Identidad ficticia desconocida');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateRequested)||Number.isNaN(isoDate(dateRequested).getTime())||isOff(dateRequested))throw new Error('Fecha no válida para esta demostración');
  const current=this.requests.filter(r=>r.userId===userId);
  if(current.some(r=>r.dateRequested===dateRequested&&['SOLICITADO','CONCEDIDO','DISFRUTADO'].includes(r.status)))throw new Error('Ya tienes una solicitud para esa fecha');
  if(current.filter(r=>['SOLICITADO','CONCEDIDO'].includes(r.status)).length>=DEMO_ALLOWANCE)throw new Error('Se ha alcanzado el límite experimental de días comprometidos');
  const id='S-'+String(this.nextId++).padStart(3,'0');
  const created={id,userId,dateRequested,submittedAt:'2026-10-09',status:'SOLICITADO'};
  this.requests.push(created);return structuredClone(created);
 }
 async resolveRequest({requestId,outcome,reason,rule,resolvedAt,notes}){
  const r=this.requests.find(r=>r.id===requestId);
  if(!r)throw new Error('Solicitud inexistente');
  if(r.status!=='SOLICITADO')throw new Error('Solo se pueden resolver solicitudes pendientes en el laboratorio; las concesiones previas se respetan');
  if(!['CONCEDIDO','DENEGADO'].includes(outcome))throw new Error('Estado de resolución no admitido');
  if(!reason?.trim()||!rule?.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(resolvedAt))throw new Error('Faltan datos de motivación o fecha');
  const oldStatus=r.status;
  r.status=outcome;
  const record={id:'R-'+String(this.resolutions.length+1).padStart(3,'0'),requestId,priorStatus:oldStatus,outcome,reason:reason.trim(),rule:rule.trim(),notes:notes?.trim()||'',resolvedAt,recordedAt:new Date().toISOString(),actor:'Dirección ficticia'};
  this.resolutions.push(record);return structuredClone(record);
 }
 async getLedger(){return structuredClone(this.resolutions)}
}
/* Contrato futuro, no conectado. Las llamadas y permisos efectivos han de verificarse en Apps Script.
   En una Web App institucional google.script.run solo estará disponible dentro de HtmlService.
   El servidor debe derivar la identidad y comprobar el rol en CADA operación. */
class AppsScriptAdapter{
 constructor(bridge){this.bridge=bridge;}
 call(method,...args){return new Promise((resolve,reject)=>{
  if(!this.bridge) return reject(new Error('Apps Script no está conectado'));
  const runner=this.bridge.withSuccessHandler(resolve).withFailureHandler(reject);
  if(typeof runner[method]!=='function')return reject(new Error('Método no disponible: '+method));
  runner[method](...args);
 });}
 getIdentity(){return this.call('getIdentity')}
 getDashboard(){return this.call('getDashboard')}
 requestDay(data){return this.call('requestDay',data)}
 // Resoluciones futuras: no se define aquí un nombre de función inexistente.
}
