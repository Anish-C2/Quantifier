/* Toy PIN hunt */
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
 ctx.fillStyle='#766f61';ctx.font='14px Georgia';ctx.fillText('chance this is the right number',9,18);
}
function qnorm(){let s=0;for(const z of state)s+=z.r*z.r+z.i*z.i;return s}
function fillTables(){
 const c=activeConfig(); const classical=mode==='classical';
 $('N').textContent=fmt(c.N);$('Q').textContent=c.Q;$('entropy').textContent=Math.log2(c.N).toFixed(2)+' bits';
 $('optimal').textContent=fmt(c.OPT);$('dimension').textContent=fmt(c.DIM);$('memory').textContent=(c.DIM*16/1024/1024).toFixed(2)+' MB';
 $('classAvg').textContent=fmt(c.N/2);$('quantumQueries').textContent=fmt(c.OPT);$('sqrtN').textContent=Math.sqrt(c.N).toFixed(2);
 $('ratio').textContent=(c.N/2/c.OPT).toFixed(1)+'x';
 const rows=[
  ['Lock size',classical?'4 numbers':'5 numbers',classical?'Normal hunt types codes':'New hunt makes the right number strong','SET'],
  ['How many codes',fmt(c.N),classical?'10,000 toy codes':'100,000 toy codes','SET'],
  ['Tiny switches',String(c.Q),'enough to name every code','MATH'],
  ['Smart steps',fmt(c.OPT),'much less than the whole pile','MATH'],
  ['Normal average tries',fmt(c.N/2),'about half the pile','MATH'],
  ['Fewer checks?',(c.N/2/c.OPT).toFixed(1)+'x','new hunt vs normal hunt','IDEA']
 ];
 $('execTable').innerHTML=rows.map(r=>'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td></tr>').join('');
}
function configure(){
 const c=activeConfig();N=c.N;Q=c.Q;DIM=c.DIM;OPT=c.OPT;targetIndex=c.target;
 const classical=mode==='classical';
 $('targetLabel').textContent=classical?'Go back to New hunt for the 5-digit lock':'Secret 5-digit number';
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
 if(!(targetIndex>=0 && targetIndex<N)) { log('Use 5 digits. Like 31415.','e'); running=false; return; }
 const initialAmp=1/Math.sqrt(N);
 state=Array.from({length:DIM},(_,i)=>i<N?({r:initialAmp,i:0}):({r:0,i:0}));
 history=[];runStart=performance.now();
 $('engine').textContent='HUNTING';$('status').textContent='WORKING';$('log').innerHTML='';
 log('Looking at '+fmt(N)+' toy numbers together');
 log('Wrong numbers get weak. The right number gets strong.');
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
  if(k===1)log('Marked the secret number.');
  if(k===Math.floor(OPT/2))log('Halfway. The right number is getting strong.','ok');
  if(k%25===0)log('Step '+k+' of '+OPT);
  draw(); setTimeout(step,12);
 }
 step();
}
function measure(){
 const c=activeConfig();let r=Math.random(),acc=0,measured=0;
 for(let i=0;i<c.N;i++){acc+=state[i].r*state[i].r+state[i].i*state[i].i;if(r<=acc){measured=i;break}}
 const code=String(measured).padStart(5,'0'),p=state[targetIndex].r**2+state[targetIndex].i**2;
 $('shots').textContent='1';$('engine').textContent='LOOKED';$('status').textContent='DONE';
 $('resultCode').textContent=code;$('resultStatus').textContent='Chance it was right: '+(p*100).toFixed(1)+'%';$('result').classList.add('show');
 if(measured===targetIndex){ log('Found it: '+code,'ok'); $('ai').textContent='Found the suitcase number. This is not a real password.'; }
 else { log('Got a different number. Try again.','w'); $('ai').textContent='Not this time. Press RESET, then START.'; }
 running=false;$('status').textContent='DONE';fillTables();draw();
}
async function sha256(s){let b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function classicalRun(){
 if(running)return;mode='classical';configure();reset();configure();running=true;
 const target=String(activeConfig().target).padStart(4,'0'),targetHash=await sha256(target);
 $('engine').textContent='TYPING';$('status').textContent='ONE BY ONE';$('log').innerHTML='';$('result').classList.remove('show');
 $('ai').textContent='Normal hunt types 0000, then 0001, then 0002.';
 let found='',tested=0,t0=performance.now();log('Hiding the number');
 for(let i=0;i<CN;i++){
   let candidate=String(i).padStart(4,'0');tested=i+1;
   if(await sha256(candidate)===targetHash){found=candidate;break}
   if(i%1000===0){$('tested').textContent=fmt(tested);$('liveTime').textContent=Math.round(performance.now()-t0)+' ms';log('Tried '+fmt(tested)+' of '+fmt(CN));await new Promise(r=>setTimeout(r,0))}
 }
 let ms=performance.now()-t0;$('engine').textContent='FOUND';$('status').textContent='DONE';$('tested').textContent=fmt(tested);
 $('resultCode').textContent=found;$('resultStatus').textContent='Tried '+fmt(tested)+' numbers';$('result').classList.add('show');
 log('Found '+found,'ok');
 $('ai').textContent='Normal hunt found the suitcase number. A real password is much longer.';
 running=false;fillTables();
}
$('qmode').onclick=()=>{mode='quantum';$('qmode').classList.add('active');$('cmode').classList.remove('active');$('run').textContent='START';configure();reset();configure()}
$('cmode').onclick=()=>{mode='classical';$('cmode').classList.add('active');$('qmode').classList.remove('active');$('run').textContent='START';configure();reset();configure()}
$('run').onclick=()=>mode==='quantum'?quantumRun():classicalRun();
$('prepare').onclick=()=>{reset();configure();log('Ready','ok')};
$('secret').oninput=configure;
$('classicalSecret').oninput=configure;
window.addEventListener('resize', ()=>{ try{drawBloch()}catch(e){} try{draw()}catch(e){} try{mazeEnsure()}catch(e){} });
configure();reset();
if(!location.hash) location.replace('#/overview');
else show(parseHash());
