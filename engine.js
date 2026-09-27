/* Grover lab */
const canvas=$('chart'), ctx=canvas.getContext('2d');
let N=100000,Q=17,DIM=1<<17,OPT=Math.floor(Math.PI/4*Math.sqrt(100000));
let state=[],history=[],running=false,mode='quantum',targetIndex=31415,runStart=0;
const QN=100000, QQ=17, QDIM=1<<17, QOPT=Math.floor(Math.PI/4*Math.sqrt(QN));
const CN=10000, CQ=14, CDIM=1<<14, COPT=Math.floor(Math.PI/4*Math.sqrt(CN));
function activeConfig(){
  if(mode==='classical') return {N:CN,Q:CQ,DIM:CDIM,OPT:COPT,target:Number(($('classicalSecret').value||'0').padStart(4,'0'))};
  return {N:QN,Q:QQ,DIM:QDIM,OPT:QOPT,target:Number(($('secret').value||'0').padStart(5,'0'))};
}
function log(m,c=''){const d=document.createElement('div');d.className=c;d.innerHTML='<span class="t">['+new Date().toLocaleTimeString()+']</span> '+m;$('log').appendChild(d);$('log').scrollTop=$('log').scrollHeight}
function fmt(n){return n.toLocaleString()}
function memory(){return (DIM*16/1024/1024).toFixed(2)+' MB'}
function draw(){
 if(!canvas) return;
 const d=devicePixelRatio||1,W=canvas.clientWidth,H=canvas.clientHeight;canvas.width=W*d;canvas.height=H*d;ctx.setTransform(d,0,0,d,0,0);
 ctx.clearRect(0,0,W,H);ctx.strokeStyle='#ddd4c3';ctx.lineWidth=1;
 for(let y=35;y<H;y+=42){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
 if(history.length){ctx.strokeStyle='#173e48';ctx.lineWidth=2;ctx.beginPath();history.forEach((p,i)=>{let x=i/(history.length-1||1)*W,y=H-18-p*(H-45);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()}
 ctx.fillStyle='#766f61';ctx.font='9px monospace';ctx.fillText('P(target)',9,15);
}
function qnorm(){let s=0;for(const z of state)s+=z.r*z.r+z.i*z.i;return s}
function fillTables(){
 const c=activeConfig(); const classical=mode==='classical';
 $('N').textContent=fmt(c.N);$('Q').textContent=c.Q;$('entropy').textContent=Math.log2(c.N).toFixed(2)+' bits';
 $('optimal').textContent=fmt(c.OPT);$('dimension').textContent=fmt(c.DIM);$('memory').textContent=(c.DIM*16/1024/1024).toFixed(2)+' MB';
 $('classAvg').textContent=fmt(c.N/2);$('quantumQueries').textContent=fmt(c.OPT);$('sqrtN').textContent=Math.sqrt(c.N).toFixed(2);
 $('ratio').textContent=(c.N/2/c.OPT).toFixed(1)+'\u00d7';
 const rows=[
  ['Target length',classical?'4 digits':'5 digits',classical?'Classical brute-force demonstration':'Quantum Grover demonstration','CONFIGURED'],
  ['Search space',fmt(c.N),classical?'10^4':'10^5','CONFIGURED'],
  ['Required qubits',String(c.Q),'ceil(log2 N)','CALCULATED'],
  ['Optimal Grover k',fmt(c.OPT),'floor(pi*sqrt(N)/4)','CALCULATED'],
  ['Classical average',fmt(c.N/2),'N/2','CALCULATED'],
  ['Query ratio',(c.N/2/c.OPT).toFixed(2)+'x','(N/2)/k','THEORETICAL']
 ];
 $('execTable').innerHTML=rows.map(r=>'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td></tr>').join('');
}
function configure(){
 const c=activeConfig();N=c.N;Q=c.Q;DIM=c.DIM;OPT=c.OPT;targetIndex=c.target;
 const classical=mode==='classical';
 $('targetLabel').textContent=classical?'Quantum target \u00b7 switch to quantum mode':'Quantum target \u00b7 5 digits';
 $('classicalTargetWrap').style.display=classical?'block':'none';
 $('secret').disabled=classical;
 $('spaceSelect').value=classical?'10000':'100000';
 fillTables();draw();
}
function reset(){
 running=false;history=[];state=[];
 const c=activeConfig();N=c.N;Q=c.Q;DIM=c.DIM;OPT=c.OPT;targetIndex=c.target;
 const initialP=1/N,initialA=1/Math.sqrt(N);
 $('prob').textContent=(initialP*100).toFixed(3)+'%';$('amp').textContent=initialA.toFixed(7);$('other').textContent=initialA.toFixed(7);
 $('liveIter').textContent='0 / '+fmt(OPT);$('liveProb').textContent=(initialP*100).toFixed(3)+'%';
 $('liveAmp').textContent=initialA.toFixed(7);$('liveOther').textContent=initialA.toFixed(7);$('liveNorm').textContent='1.000000';$('liveTime').textContent='0 ms';
 ['oracle','diff','depth'].forEach(id=>$(id).textContent='0');$('norm').textContent='1.000000';$('shots').textContent='0';$('engine').textContent='IDLE';$('status').textContent='READY';
 $('tested').textContent='0';
 $('result').classList.remove('show');$('resultCode').textContent='\u2014';$('log').innerHTML='';
 fillTables();draw();
}
function quantumRun(){
 if(running)return;mode='quantum';configure();reset();configure();running=true;
 const c=activeConfig();N=c.N;Q=c.Q;DIM=c.DIM;OPT=c.OPT;targetIndex=c.target;
 if(!(targetIndex>=0 && targetIndex<N)) { log('Target must be inside the 5-digit space.','e'); running=false; return; }
 const initialAmp=1/Math.sqrt(N);
 state=Array.from({length:DIM},(_,i)=>i<N?({r:initialAmp,i:0}):({r:0,i:0}));
 history=[];runStart=performance.now();
 $('engine').textContent='QUANTUM';$('status').textContent='RUNNING';$('log').innerHTML='';
 log('ALLOCATE '+Q+'-QUBIT REGISTER -> '+fmt(DIM)+' BASIS STATES','ok');
 log('INITIALIZE UNIFORM SUPERPOSITION -> '+fmt(N)+' VALID STATES');
 let k=0;
 function step(){
  if(!running)return;
  if(k>=OPT){measure();return}
  state[targetIndex].r*=-1;state[targetIndex].i*=-1;
  let mr=0,mi=0;for(let j=0;j<N;j++){mr+=state[j].r;mi+=state[j].i}mr/=N;mi/=N;
  for(let j=0;j<N;j++){const z=state[j];z.r=2*mr-z.r;z.i=2*mi-z.i}
  k++;const p=state[targetIndex].r**2+state[targetIndex].i**2;history.push(p);
  const currentNorm=qnorm();
  $('prob').textContent=(p*100).toFixed(3)+'%';$('amp').textContent=state[targetIndex].r.toFixed(7);$('other').textContent=state[targetIndex===0?1:0].r.toFixed(7);
  $('oracle').textContent=k;$('diff').textContent=k;$('depth').textContent=k*2;$('norm').textContent=currentNorm.toFixed(6);
  $('liveIter').textContent=k+' / '+OPT;$('liveProb').textContent=(p*100).toFixed(3)+'%';
  $('liveAmp').textContent=state[targetIndex].r.toFixed(7);$('liveOther').textContent=state[targetIndex===0?1:0].r.toFixed(7);
  $('liveNorm').textContent=currentNorm.toFixed(6);$('liveTime').textContent=Math.round(performance.now()-runStart)+' ms';
  if(k===1)log('ORACLE -> phase inversion on marked basis state');
  if(k===Math.floor(OPT/2))log('INTERFERENCE -> target amplitude crossing the mean','ok');
  if(k%25===0)log('GROVER ITERATION '+k+' / '+OPT);
  draw(); setTimeout(step,12);
 }
 step();
}
function measure(){
 const c=activeConfig();let r=Math.random(),acc=0,measured=0;
 for(let i=0;i<c.N;i++){acc+=state[i].r*state[i].r+state[i].i*state[i].i;if(r<=acc){measured=i;break}}
 const code=String(measured).padStart(5,'0'),p=state[targetIndex].r**2+state[targetIndex].i**2;
 $('shots').textContent='1';$('engine').textContent='MEASURED';$('status').textContent='MEASUREMENT';
 $('resultCode').textContent=code;$('resultStatus').textContent='One probability-weighted measurement \u00b7 P(target) '+(p*100).toFixed(3)+'%';$('result').classList.add('show');
 if(measured===targetIndex){ log('HIT -> '+code,'ok'); $('ai').textContent='Grover amplified the marked state. Measurement landed on the target.'; }
 else { log('Non-target state observed; measurement is still probabilistic.','w'); $('ai').textContent='Close, not certain. Grover makes the target likely, not guaranteed.'; }
 running=false;$('status').textContent='COMPLETE';fillTables();draw();
}
async function sha256(s){let b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function classicalRun(){
 if(running)return;mode='classical';configure();reset();configure();running=true;
 const target=String(activeConfig().target).padStart(4,'0'),targetHash=await sha256(target);
 $('engine').textContent='CLASSICAL';$('status').textContent='BRUTE FORCE';$('log').innerHTML='';$('result').classList.remove('show');
 $('ai').textContent='Classical verifier is hashing a 4-digit candidate space independently.';
 let found='',tested=0,t0=performance.now();log('TARGET STORED AS SHA-256 DIGEST','ok');
 for(let i=0;i<CN;i++){
   let candidate=String(i).padStart(4,'0');tested=i+1;
   if(await sha256(candidate)===targetHash){found=candidate;break}
   if(i%1000===0){$('tested').textContent=fmt(tested);$('liveTime').textContent=Math.round(performance.now()-t0)+' ms';log('BRUTE FORCE -> '+fmt(tested)+' / '+fmt(CN));await new Promise(r=>setTimeout(r,0))}
 }
 let ms=performance.now()-t0;$('engine').textContent='CLASSICAL DONE';$('status').textContent='COMPLETE';$('tested').textContent=fmt(tested);
 $('resultCode').textContent=found;$('resultStatus').textContent='SHA-256 match \u00b7 '+fmt(tested)+' candidates \u00b7 '+ms.toFixed(1)+' ms';$('result').classList.add('show');
 log('HASH MATCH -> '+found,'ok');
 $('ai').textContent='Classical mode hashed candidates until one matched the stored digest. Four digits keeps the live runner responsive.';
 running=false;fillTables();
}
$('qmode').onclick=()=>{mode='quantum';$('qmode').classList.add('active');$('cmode').classList.remove('active');$('run').textContent='RUN QUANTUM EXPERIMENT';configure();reset();configure()}
$('cmode').onclick=()=>{mode='classical';$('cmode').classList.add('active');$('qmode').classList.remove('active');$('run').textContent='RUN CLASSICAL BRUTE FORCE';configure();reset();configure()}
$('run').onclick=()=>mode==='quantum'?quantumRun():classicalRun();
$('prepare').onclick=()=>{reset();configure();log('EXPERIMENT READY','ok')};
$('secret').oninput=configure;
$('classicalSecret').oninput=configure;
window.addEventListener('resize', ()=>{ drawBloch(); drawGate(); drawInt(); draw(); });
configure();reset();
if(!location.hash) location.replace('#/overview');
else show(parseHash());
