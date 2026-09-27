const ROUTES = [
  {id:'overview', label:'Home', title:'Start'},
  {id:'qubits', label:'Coin', title:'Coin'},
  {id:'superposition', label:'Mix', title:'Mix'},
  {id:'entanglement', label:'Two coins', title:'Two coins'},
  {id:'grover', label:'Lock', title:'Find the number'},
  {id:'maze', label:'Maze', title:'Maze'},
  {id:'uses', label:'In life', title:'In real life'},
  {id:'compare', label:'True talk', title:'True talk'}
];
const $ = id => document.getElementById(id);
const nav = $('mainNav');
nav.innerHTML = ROUTES.map(r => '<a href="#/'+r.id+'" data-route="'+r.id+'">'+r.label+'</a>').join('');
$('hallTickets').innerHTML = ROUTES.map((r,i)=>'<a href="#/'+r.id+'"><div class="n">'+(i+1)+'</div><div class="t">'+r.title+'</div><div class="d">Tap to open</div></a>').join('');
$('dots').innerHTML = ROUTES.map(r=>'<a href="#/'+r.id+'" data-dot="'+r.id+'" title="'+r.title+'"></a>').join('');
function parseHash(){
  let h = (location.hash||'').replace(/^#\/?/,'').split('?')[0].toLowerCase();
  if(!h || h==='home' || h==='start' || h==='index') return 'overview';
  if(h==='quantum' || h==='lab' || h==='search' || h==='pin' || h==='password' || h==='passwords' || h==='lock') return 'grover';
  if(h==='q-maze' || h==='qmaze') return 'maze';
  if(h==='notation' || h==='reallife' || h==='why' || h==='life') return 'uses';
  if(h==='gates' || h==='interference' || h==='deutsch' || h==='qubits') return ROUTES.some(r=>r.id===h) ? h : 'qubits';
  return ROUTES.some(r=>r.id===h) ? h : 'overview';
}
function go(id){
  if(location.hash !== '#/'+id) location.hash = '#/'+id;
  else show(id);
}
function show(id){
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.dataset.view===id));
  document.querySelectorAll('#mainNav a').forEach(a => a.classList.toggle('active', a.dataset.route===id));
  document.querySelectorAll('#dots a').forEach(a => a.classList.toggle('on', a.dataset.dot===id));
  const i = ROUTES.findIndex(r=>r.id===id);
  const r = ROUTES[i];
  $('stageMeta').textContent = (i+1)+' / '+ROUTES.length+' · '+r.title;
  $('topStats').textContent = (i+1)+' / '+ROUTES.length;
  if(id==='qubits') drawBloch();
  if(id==='grover') { try{ draw(); }catch(err){} }
  if(id==='maze') { try{ mazeEnsure(); }catch(err){} }
}
window.addEventListener('hashchange', ()=>show(parseHash()));
$('prevBtn').onclick = ()=>{ const i=ROUTES.findIndex(r=>r.id===parseHash()); go(ROUTES[(i-1+ROUTES.length)%ROUTES.length].id); };
$('nextBtn').onclick = ()=>{ const i=ROUTES.findIndex(r=>r.id===parseHash()); go(ROUTES[(i+1)%ROUTES.length].id); };
window.addEventListener('keydown', e=>{
  if(e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if(e.key==='ArrowRight' || e.key==='PageDown') { e.preventDefault(); $('nextBtn').click(); }
  if(e.key==='ArrowLeft' || e.key==='PageUp') { e.preventDefault(); $('prevBtn').click(); }
});
const C = (r=0,i=0)=>({r,i});
const cadd = (a,b)=>C(a.r+b.r,a.i+b.i);
const csub = (a,b)=>C(a.r-b.r,a.i-b.i);
const cscale = (a,s)=>C(a.r*s,a.i*s);
const cabs2 = a=>a.r*a.r+a.i*a.i;
function cfmt(z){
  const r=z.r.toFixed(2), i=z.i.toFixed(2);
  if(Math.abs(z.i)<1e-9) return r;
  return r+(z.i>=0?'+':'')+i+'i';
}
function measureState(amps){
  const w = amps.map(cabs2);
  let r=Math.random(), acc=0;
  for(let i=0;i<w.length;i++){ acc+=w[i]; if(r<=acc) return i; }
  return w.length-1;
}
function qubitFromAngles(thDeg, phDeg){
  const th=thDeg*Math.PI/180, ph=phDeg*Math.PI/180;
  return {a0:C(Math.cos(th/2),0), a1:C(Math.sin(th/2)*Math.cos(ph), Math.sin(th/2)*Math.sin(ph)), th, ph};
}
function drawBloch(){
  const th=+$('theta').value, ph=+$('phi').value;
  $('thetaVal').textContent=th+'°'; $('phiVal').textContent=ph+'°';
  const q=qubitFromAngles(th,ph);
  const p0=cabs2(q.a0), p1=cabs2(q.a1);
  $('p0').textContent=(p0*100).toFixed(0)+'%';
  $('p1').textContent=(p1*100).toFixed(0)+'%';
  $('qubitState').textContent='0 side: '+cfmt(q.a0)+'   1 side: '+cfmt(q.a1);
  $('qubitExplain').textContent = p1<0.02 ? 'This is 0. If you look, you get 0.' : p0<0.02 ? 'This is 1. If you look, you get 1.' : 'Still in the air. Look, and it picks 0 or 1.';
  const cv=$('bloch'), ctx=cv.getContext('2d'), d=devicePixelRatio||1;
  const W=cv.clientWidth, H=cv.clientHeight; cv.width=W*d; cv.height=H*d; ctx.setTransform(d,0,0,d,0,0);
  ctx.clearRect(0,0,W,H);
  const cx=W/2, cy=H/2, R=Math.min(W,H)*0.36;
  ctx.strokeStyle='#b8ad95'; ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx,cy,R,R*0.32,0,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle='#766f61'; ctx.font='16px Georgia';
  ctx.fillText('0', cx-6, cy-R-8);
  ctx.fillText('1', cx-6, cy+R+20);
  const x=Math.sin(q.th)*Math.cos(q.ph), y=Math.cos(q.th), z=Math.sin(q.th)*Math.sin(q.ph);
  const px=cx+x*R, py=cy-y*R*0.92+z*R*0.18;
  ctx.strokeStyle='#173e48'; ctx.lineWidth=2.4;
  ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py); ctx.stroke();
  ctx.fillStyle='#8a5a32'; ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2); ctx.fill();
}
$('theta').oninput=$('phi').oninput=drawBloch;
document.querySelectorAll('[data-prep]').forEach(b=>b.onclick=()=>{
  const m={ '0':[0,0], '1':[180,0], '+':[90,0], '-':[90,180], 'i':[90,90], '-i':[90,270] }[b.dataset.prep];
  $('theta').value=m[0]; $('phi').value=m[1]; drawBloch();
});
let hAmps=[C(1,0),C(0,0)], hCounts=[0,0];
function renderH(){
  $('hState').textContent='0 side: '+cfmt(hAmps[0])+'   1 side: '+cfmt(hAmps[1]);
  const tot=hCounts[0]+hCounts[1];
  $('hShots').textContent=String(tot);
  const max=Math.max(1,hCounts[0],hCounts[1]);
  $('hBars').innerHTML=[0,1].map(i=>{
    const h=Math.max(8,(hCounts[i]/max)*150);
    return '<div class="bar" style="height:'+h+'px">'+hCounts[i]+'<span>'+i+'</span></div>';
  }).join('');
}
$('hApply').onclick=()=>{
  const a=hAmps[0], b=hAmps[1], s=1/Math.sqrt(2);
  hAmps=[cscale(cadd(a,b),s), cscale(csub(a,b),s)];
  $('hTalk').textContent='Mixed. Now look.';
  renderH();
};
$('hReset').onclick=()=>{ hAmps=[C(1,0),C(0,0)]; hCounts=[0,0]; $('hLast').textContent='—'; $('hTalk').textContent='Back to 0.'; renderH(); };
function takeShot(){
  const i=measureState(hAmps);
  hCounts[i]++; $('hLast').textContent=String(i);
  $('hTalk').textContent='You got '+i+'. Look many times to see the mix.';
}
$('hShot').onclick=()=>{ takeShot(); renderH(); };
$('hMany').onclick=()=>{ for(let k=0;k<200;k++) takeShot(); renderH(); };
renderH();
let e = [C(1,0),C(0,0),C(0,0),C(0,0)];
let eCounts=[0,0,0,0];
function eH0(){
  const s=1/Math.sqrt(2);
  const n=[C(),C(),C(),C()];
  n[0]=cscale(cadd(e[0],e[2]),s);
  n[1]=cscale(cadd(e[1],e[3]),s);
  n[2]=cscale(csub(e[0],e[2]),s);
  n[3]=cscale(csub(e[1],e[3]),s);
  e=n;
}
function eCnot(){ const t=e[2]; e[2]=e[3]; e[3]=t; }
function renderBell(){
  const labs=['00','01','10','11'];
  $('bellState').textContent = labs.map((L,i)=>L+': '+cfmt(e[i])).join('    ');
  const ps=e.map(cabs2);
  ['b00','b01','b10','b11'].forEach((id,i)=>$(id).textContent=(ps[i]*100).toFixed(0)+'%');
  const max=Math.max(1,...eCounts);
  $('bellBars').innerHTML=eCounts.map((c,i)=>'<div class="bar" style="height:'+Math.max(8,c/max*150)+'px">'+c+'<span>'+labs[i]+'</span></div>').join('');
}
$('bellReset').onclick=()=>{ e=[C(1,0),C(0,0),C(0,0),C(0,0)]; eCounts=[0,0,0,0]; $('bellTalk').textContent='Two zeros.'; renderBell(); };
$('bellH').onclick=()=>{ eH0(); $('bellTalk').textContent='First coin is in the air.'; renderBell(); };
$('bellCnot').onclick=()=>{ eCnot(); $('bellTalk').textContent='Linked.'; renderBell(); };
$('bellPrep').onclick=()=>{ e=[C(1,0),C(0,0),C(0,0),C(0,0)]; eH0(); eCnot(); $('bellTalk').textContent='Pair ready. Look.'; renderBell(); };
$('bellShot').onclick=()=>{ const i=measureState(e); eCounts[i]++; $('bellTalk').textContent='You got '+['00','01','10','11'][i]+'.'; renderBell(); };
$('bellMany').onclick=()=>{ for(let k=0;k<200;k++) eCounts[measureState(e)]++; renderBell(); };
renderBell();
