const ROUTES = [
  {id:'overview', label:'Overview', title:'Opening hall'},
  {id:'qubits', label:'Qubit', title:'The qubit'},
  {id:'superposition', label:'Superposition', title:'Superposition'},
  {id:'gates', label:'Gates', title:'Quantum gates'},
  {id:'entanglement', label:'Entangle', title:'Entanglement'},
  {id:'interference', label:'Interfere', title:'Interference'},
  {id:'deutsch', label:'Deutsch', title:'Deutsch algorithm'},
  {id:'grover', label:'Grover', title:'Grover search lab'},
  {id:'compare', label:'Compare', title:'Classical vs quantum'},
  {id:'notation', label:'Notation', title:'Notation wall'},
  {id:'maze', label:'Q-Maze', title:'Q-MAZE laboratory'}
];
const $ = id => document.getElementById(id);
const nav = $('mainNav');
nav.innerHTML = ROUTES.map(r => '<a href="#/'+r.id+'" data-route="'+r.id+'">'+r.label+'</a>').join('');
$('hallTickets').innerHTML = ROUTES.map((r,i)=>'<a href="#/'+r.id+'"><div class="n">Hall '+String(i+1).padStart(2,'0')+'</div><div class="t">'+r.title+'</div><div class="d">#/'+r.id+'</div></a>').join('');
$('dots').innerHTML = ROUTES.map(r=>'<a href="#/'+r.id+'" data-dot="'+r.id+'" title="'+r.title+'"></a>').join('');
function parseHash(){
  let h = (location.hash||'').replace(/^#\/?/,'').split('?')[0].toLowerCase();
  if(!h || h==='home' || h==='start' || h==='index') return 'overview';
  if(h==='quantum' || h==='lab' || h==='search') return 'grover';
  if(h==='q-maze' || h==='qmaze') return 'maze';
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
  $('stageMeta').textContent = 'Exhibit '+String(i+1).padStart(2,'0')+' / '+String(ROUTES.length).padStart(2,'0')+' \u00b7 '+r.title;
  $('topStats').textContent = 'EXHIBIT '+String(i+1).padStart(2,'0')+' / '+ROUTES.length+' \u00b7 #/'+id;
  const maze = $('mazeFrame');
  if(id==='maze' && maze.getAttribute('src') !== 'maze.html') maze.src = 'maze.html';
  if(id==='qubits') drawBloch();
  if(id==='gates') drawGate();
  if(id==='interference') drawInt();
  if(id==='grover') { try{ draw(); }catch(err){} }
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
const cmul = (a,b)=>C(a.r*b.r-a.i*b.i,a.r*b.i+a.i*b.r);
const cscale = (a,s)=>C(a.r*s,a.i*s);
const cabs2 = a=>a.r*a.r+a.i*a.i;
function cfmt(z){
  const r=z.r.toFixed(3), i=z.i.toFixed(3);
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
  $('thetaVal').textContent=th+'\u00b0'; $('phiVal').textContent=ph+'\u00b0';
  const q=qubitFromAngles(th,ph);
  const p0=cabs2(q.a0), p1=cabs2(q.a1);
  $('p0').textContent=(p0*100).toFixed(1)+'%';
  $('p1').textContent=(p1*100).toFixed(1)+'%';
  $('qubitState').textContent='|psi> = ('+cfmt(q.a0)+') |0>  +  ('+cfmt(q.a1)+') |1>';
  $('qubitExplain').textContent = p1<0.02 ? 'Almost certainly 0 if measured now.' : p0<0.02 ? 'Almost certainly 1 if measured now.' : 'A measurement will snap to 0 or 1 with those probabilities. The arrow itself is not a hidden bit.';
  const cv=$('bloch'), ctx=cv.getContext('2d'), d=devicePixelRatio||1;
  const W=cv.clientWidth, H=cv.clientHeight; cv.width=W*d; cv.height=H*d; ctx.setTransform(d,0,0,d,0,0);
  ctx.clearRect(0,0,W,H);
  const cx=W/2, cy=H/2, R=Math.min(W,H)*0.36;
  ctx.strokeStyle='#b8ad95'; ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx,cy,R,R*0.32,0,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle='#766f61'; ctx.font='12px Georgia';
  ctx.fillText('|0>', cx-8, cy-R-8);
  ctx.fillText('|1>', cx-8, cy+R+16);
  ctx.fillText('|+>', cx+R+8, cy+4);
  ctx.fillText('|->', cx-R-28, cy+4);
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
  $('hState').textContent='|psi> = ('+cfmt(hAmps[0])+') |0>  +  ('+cfmt(hAmps[1])+') |1>';
  const tot=hCounts[0]+hCounts[1];
  $('hShots').textContent=String(tot);
  const max=Math.max(1,hCounts[0],hCounts[1]);
  $('hBars').innerHTML=[0,1].map(i=>{
    const h=Math.max(8,(hCounts[i]/max)*150);
    return '<div class="bar" style="height:'+h+'px">'+hCounts[i]+'<span>|'+i+'></span></div>';
  }).join('');
}
$('hApply').onclick=()=>{
  const a=hAmps[0], b=hAmps[1], s=1/Math.sqrt(2);
  hAmps=[cscale(cadd(a,b),s), cscale(csub(a,b),s)];
  $('hTalk').textContent='Hadamard applied. Amplitudes are now split. Measurement is still in the future.';
  renderH();
};
$('hReset').onclick=()=>{ hAmps=[C(1,0),C(0,0)]; hCounts=[0,0]; $('hLast').textContent='\u2014'; $('hTalk').textContent='Back to |0>.'; renderH(); };
function takeShot(){
  const i=measureState(hAmps);
  hCounts[i]++; $('hLast').textContent='|'+i+'>';
  $('hTalk').textContent='Collapsed to |'+i+'> this shot.';
}
$('hShot').onclick=()=>{ takeShot(); renderH(); };
$('hMany').onclick=()=>{ for(let k=0;k<200;k++) takeShot(); renderH(); };
renderH();
let g=[C(1,0),C(0,0)], lastGate='RESET';
function applyGate(name){
  const a=g[0], b=g[1], s=1/Math.sqrt(2);
  if(name==='R'){ g=[C(1,0),C(0,0)]; lastGate='RESET'; }
  else if(name==='X'){ g=[b,a]; lastGate='X'; }
  else if(name==='Z'){ g=[a,C(-b.r,-b.i)]; lastGate='Z'; }
  else if(name==='H'){ g=[cscale(cadd(a,b),s), cscale(csub(a,b),s)]; lastGate='H'; }
  else if(name==='S'){ g=[a,C(-b.i,b.r)]; lastGate='S'; }
  else if(name==='T'){ const t=Math.PI/4; g=[a, cmul(b,C(Math.cos(t),Math.sin(t)))]; lastGate='T'; }
  drawGate();
}
function drawGate(){
  $('gateState').textContent='|psi> = ('+cfmt(g[0])+') |0>  +  ('+cfmt(g[1])+') |1>';
  $('gateNorm').textContent=(cabs2(g[0])+cabs2(g[1])).toFixed(6);
  $('gateLast').textContent=lastGate;
  const cv=$('gateCanvas'), ctx=cv.getContext('2d'), d=devicePixelRatio||1;
  const W=cv.clientWidth, H=cv.clientHeight; cv.width=W*d; cv.height=H*d; ctx.setTransform(d,0,0,d,0,0);
  ctx.clearRect(0,0,W,H);
  const labels=['Re a','Im a','Re b','Im b'];
  const vals=[g[0].r,g[0].i,g[1].r,g[1].i];
  vals.forEach((v,i)=>{
    const x=30+i*((W-50)/4);
    const mid=H/2, h=v*(H*0.38);
    ctx.fillStyle=v>=0?'#173e48':'#8a5a32';
    ctx.fillRect(x, mid-Math.max(h,0), 36, Math.abs(h)||2);
    ctx.fillStyle='#766f61'; ctx.font='11px Georgia'; ctx.fillText(labels[i], x, H-12);
  });
}
document.querySelectorAll('[data-gate]').forEach(b=>b.onclick=()=>applyGate(b.dataset.gate));
drawGate();
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
  $('bellState').textContent = labs.map((L,i)=>'('+cfmt(e[i])+') |'+L+'>').join('  +  ');
  const ps=e.map(cabs2);
  ['b00','b01','b10','b11'].forEach((id,i)=>$(id).textContent=(ps[i]*100).toFixed(1)+'%');
  const max=Math.max(1,...eCounts);
  $('bellBars').innerHTML=eCounts.map((c,i)=>'<div class="bar" style="height:'+Math.max(8,c/max*150)+'px">'+c+'<span>|'+labs[i]+'></span></div>').join('');
}
$('bellReset').onclick=()=>{ e=[C(1,0),C(0,0),C(0,0),C(0,0)]; eCounts=[0,0,0,0]; $('bellTalk').textContent='Product state |00>.'; renderBell(); };
$('bellH').onclick=()=>{ eH0(); $('bellTalk').textContent='Qubit A is now in superposition, B is still |0>.'; renderBell(); };
$('bellCnot').onclick=()=>{ eCnot(); $('bellTalk').textContent='CNOT copied the superposition onto B.'; renderBell(); };
$('bellPrep').onclick=()=>{ e=[C(1,0),C(0,0),C(0,0),C(0,0)]; eH0(); eCnot(); $('bellTalk').textContent='Bell pair ready. Measure both.'; renderBell(); };
$('bellShot').onclick=()=>{ const i=measureState(e); eCounts[i]++; $('bellTalk').textContent='Shot -> |'+['00','01','10','11'][i]+'>'; renderBell(); };
$('bellMany').onclick=()=>{ for(let k=0;k<200;k++) eCounts[measureState(e)]++; renderBell(); };
renderBell();
function intState(deg){
  const ph=deg*Math.PI/180, s=1/Math.sqrt(2);
  const after = [C(s,0), C(s*Math.cos(ph), s*Math.sin(ph))];
  const a=after[0], b=after[1];
  return [cscale(cadd(a,b),s), cscale(csub(a,b),s)];
}
function drawInt(){
  const deg=+$('phase').value;
  $('phaseVal').textContent=deg+'\u00b0';
  const st=intState(deg);
  const p0=cabs2(st[0]), p1=cabs2(st[1]);
  $('intP0').textContent=(p0*100).toFixed(1)+'%';
  $('intP1').textContent=(p1*100).toFixed(1)+'%';
  $('intTalk').textContent = p0>0.85 ? 'Paths line up. You return to |0>.' : p1>0.85 ? 'Paths anti-align. You land on |1>.' : 'Partial interference.';
  const cv=$('intCanvas'), ctx=cv.getContext('2d'), d=devicePixelRatio||1;
  const W=cv.clientWidth, H=cv.clientHeight; cv.width=W*d; cv.height=H*d; ctx.setTransform(d,0,0,d,0,0);
  ctx.clearRect(0,0,W,H);
  const mid=H/2;
  ctx.strokeStyle='#b8ad95'; ctx.beginPath(); ctx.moveTo(20,mid); ctx.lineTo(W-20,mid); ctx.stroke();
  const R=Math.min(W,H)*0.28;
  const drawPh=(cx,ang,label,col)=>{
    ctx.strokeStyle=col; ctx.lineWidth=2.2;
    ctx.beginPath(); ctx.moveTo(cx,mid); ctx.lineTo(cx+Math.cos(ang)*R, mid-Math.sin(ang)*R); ctx.stroke();
    ctx.fillStyle='#766f61'; ctx.font='12px Georgia'; ctx.fillText(label,cx-10,mid+R+18);
  };
  drawPh(W*0.28, 0, 'path |0>', '#173e48');
  drawPh(W*0.72, deg*Math.PI/180, 'path |1>', '#8a5a32');
}
$('phase').oninput=drawInt;
$('intRun').onclick=drawInt;
$('intPi').onclick=()=>{ $('phase').value=180; drawInt(); };
$('intZero').onclick=()=>{ $('phase').value=0; drawInt(); };
drawInt();
function djRun(){
  const kind=$('djOracle').value;
  let s=[C(0,0),C(1,0),C(0,0),C(0,0)];
  const H0=()=>{ const k=1/Math.sqrt(2); const n=[C(),C(),C(),C()];
    n[0]=cscale(cadd(s[0],s[2]),k); n[1]=cscale(cadd(s[1],s[3]),k);
    n[2]=cscale(csub(s[0],s[2]),k); n[3]=cscale(csub(s[1],s[3]),k); s=n; };
  const H1=()=>{ const k=1/Math.sqrt(2); const n=[C(),C(),C(),C()];
    n[0]=cscale(cadd(s[0],s[1]),k); n[2]=cscale(cadd(s[2],s[3]),k);
    n[1]=cscale(csub(s[0],s[1]),k); n[3]=cscale(csub(s[2],s[3]),k); s=n; };
  const CNOT=()=>{ const t=s[2]; s[2]=s[3]; s[3]=t; };
  const X1=()=>{ let t=s[0]; s[0]=s[1]; s[1]=t; t=s[2]; s[2]=s[3]; s[3]=t; };
  H0(); H1();
  if(kind==='c1') X1();
  else if(kind==='id') CNOT();
  else if(kind==='not'){ X1(); CNOT(); }
  H0();
  const pA0 = cabs2(s[0])+cabs2(s[1]);
  const bit = Math.random()<pA0 ? 0 : 1;
  const verdict = bit===0 ? 'CONSTANT' : 'BALANCED';
  const truth = (kind==='c0'||kind==='c1') ? 'CONSTANT' : 'BALANCED';
  $('djCode').textContent = String(bit)+'  ->  '+verdict;
  $('djStatus').textContent = 'True oracle type: '+truth+' \u00b7 P(A=0) = '+(pA0*100).toFixed(2)+'%';
  $('djResult').classList.add('show');
  $('djState').textContent = 'P(A=0) = '+(pA0*100).toFixed(2)+'%\nP(A=1) = '+((1-pA0)*100).toFixed(2)+'%\nIdeal Deutsch: constant -> 0, balanced -> 1.';
}
$('djRun').onclick=djRun;
