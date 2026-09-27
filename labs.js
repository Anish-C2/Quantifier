const ROUTES = [
  {id:'overview', label:'Home', title:'Home'},
  {id:'grover', label:'Password', title:'Password'},
  {id:'maze', label:'Maze', title:'Maze'},
  {id:'slit', label:'Two holes', title:'Double slit'},
  {id:'atom', label:'Atom jump', title:'Atom jumps'},
  {id:'cloud', label:'Cloud', title:'Electron cloud'},
  {id:'bounce', label:'Bouncer', title:'Particle bouncer'}
];
const $ = id => document.getElementById(id);
const nav = $('mainNav');
nav.innerHTML = ROUTES.map(r => '<a href="#/'+r.id+'" data-route="'+r.id+'">'+r.label+'</a>').join('');
$('hallTickets').innerHTML = ROUTES.filter(r=>r.id!=='overview').map(r=>'<a href="#/'+r.id+'"><div class="n">Open</div><div class="t">'+r.title+'</div><div class="d">#/'+r.id+'</div></a>').join('');
$('dots').innerHTML = ROUTES.map(r=>'<a href="#/'+r.id+'" data-dot="'+r.id+'" title="'+r.title+'"></a>').join('');
function parseHash(){
  let h = (location.hash||'').replace(/^#\/?/,'').split('?')[0].toLowerCase();
  if(!h || h==='home' || h==='start' || h==='index') return 'overview';
  if(h==='quantum' || h==='lab' || h==='search' || h==='pin' || h==='password' || h==='passwords' || h==='lock') return 'grover';
  if(h==='q-maze' || h==='qmaze') return 'maze';
  if(h==='doubleslit' || h==='twoslit') return 'slit';
  if(h==='energy' || h==='jumps') return 'atom';
  if(h==='orbital' || h==='electron') return 'cloud';
  if(h==='tunnel' || h==='barrier') return 'bounce';
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
  if(id==='grover') { try{ draw(); }catch(err){} }
  if(id==='maze') { try{ mazeEnsure(); }catch(err){} }
  if(id==='slit') drawSlit();
  if(id==='atom') drawAtom();
  if(id==='cloud') drawCloud();
  if(id==='bounce') drawBounce();
}
window.addEventListener('hashchange', ()=>show(parseHash()));
$('prevBtn').onclick = ()=>{ const i=ROUTES.findIndex(r=>r.id===parseHash()); go(ROUTES[(i-1+ROUTES.length)%ROUTES.length].id); };
$('nextBtn').onclick = ()=>{ const i=ROUTES.findIndex(r=>r.id===parseHash()); go(ROUTES[(i+1)%ROUTES.length].id); };
window.addEventListener('keydown', e=>{
  if(e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if(e.key==='ArrowRight' || e.key==='PageDown') { e.preventDefault(); $('nextBtn').click(); }
  if(e.key==='ArrowLeft' || e.key==='PageUp') { e.preventDefault(); $('prevBtn').click(); }
});
function prepCanvas(id){
  const cv=$(id); if(!cv) return null;
  const ctx=cv.getContext('2d'), d=devicePixelRatio||1;
  const W=cv.clientWidth, H=cv.clientHeight;
  cv.width=W*d; cv.height=H*d; ctx.setTransform(d,0,0,d,0,0);
  return {cv,ctx,W,H};
}

/* Double slit */
let slitCount=2, slitWatch=false, slitHits=new Array(80).fill(0), slitTotal=0, slitMarks=[];
function slitSample(){
  const bins=slitHits.length, gap=+$('slitGap').value;
  if(slitCount===1 || slitWatch){
    const u=Math.random()*2-1;
    const x=u*u*u;
    return Math.max(0, Math.min(bins-1, Math.floor((x*0.55+0.5)*bins)));
  }
  for(let t=0;t<40;t++){
    const x=Math.random()*2-1;
    const env=Math.exp(-x*x*2.2);
    const fr=Math.cos(x*gap*0.22);
    const p=env*fr*fr;
    if(Math.random()<p) return Math.max(0, Math.min(bins-1, Math.floor((x*0.5+0.5)*bins)));
  }
  return Math.floor(bins/2);
}
function fireSlit(n){
  for(let i=0;i<n;i++){
    const b=slitSample();
    slitHits[b]++; slitTotal++;
    slitMarks.push(b);
    if(slitMarks.length>240) slitMarks.shift();
  }
  $('slitHits').textContent=String(slitTotal);
  drawSlit();
}
function drawSlit(){
  const g=prepCanvas('slitCanvas'); if(!g) return;
  const {ctx,W,H}=g;
  ctx.fillStyle='#f9f6ed'; ctx.fillRect(0,0,W,H);
  const srcX=28, wallX=W*0.38, screenX=W-36;
  ctx.fillStyle='#173e48'; ctx.beginPath(); ctx.arc(srcX,H/2,7,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#171612'; ctx.fillRect(wallX-6,16,12,H-32);
  const gap=+$('slitGap').value;
  const mid=H/2, hole=10;
  if(slitCount===1){
    ctx.fillStyle='#f9f6ed'; ctx.fillRect(wallX-7,mid-hole,14,hole*2);
  } else {
    ctx.fillStyle='#f9f6ed';
    ctx.fillRect(wallX-7,mid-gap-hole,14,hole*2);
    ctx.fillRect(wallX-7,mid+gap-hole,14,hole*2);
  }
  if(slitWatch && slitCount===2){
    ctx.strokeStyle='#8a5a32'; ctx.strokeRect(wallX-16,mid-gap-18,32,36);
    ctx.strokeRect(wallX-16,mid+gap-18,32,36);
  }
  ctx.fillStyle='#e8dfcb'; ctx.fillRect(screenX-4,16,10,H-32);
  const max=Math.max(1,...slitHits);
  slitHits.forEach((c,i)=>{
    const y=20+(i/(slitHits.length-1))*(H-40);
    const len=(c/max)*(W*0.28);
    ctx.fillStyle='#173e48';
    ctx.fillRect(screenX-6-len,y-2,len,4);
  });
  slitMarks.slice(-40).forEach((b,i)=>{
    const y=20+(b/(slitHits.length-1))*(H-40);
    ctx.globalAlpha=0.25+i/80;
    ctx.fillStyle='#8a5a32';
    ctx.beginPath(); ctx.arc(screenX+10,y,2.2,0,Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha=1;
  ctx.fillStyle='#766f61'; ctx.font='13px Georgia';
  ctx.fillText('gun', 16, H/2-14);
  ctx.fillText('holes', wallX-16, 14);
  ctx.fillText('screen', screenX-38, 14);
}
function setSlitMode(){
  $('slitOne').classList.toggle('active', slitCount===1);
  $('slitTwo').classList.toggle('active', slitCount===2 && !slitWatch);
  $('slitWatch').classList.toggle('active', slitWatch);
  $('slitMode').textContent = slitWatch ? 'Watching' : (slitCount===1?'One hole':'Two holes');
  $('slitTalk').textContent = slitWatch ? 'Watching kills the stripes.' : (slitCount===1?'One pile. Fire 200.' : 'Two holes. Look for stripes.');
  drawSlit();
}
$('slitOne').onclick=()=>{ slitCount=1; slitWatch=false; setSlitMode(); };
$('slitTwo').onclick=()=>{ slitCount=2; slitWatch=false; setSlitMode(); };
$('slitWatch').onclick=()=>{ slitCount=2; slitWatch=!slitWatch; setSlitMode(); };
$('slitGap').oninput=()=>{ $('slitGapVal').textContent=$('slitGap').value; drawSlit(); };
$('slitFire').onclick=()=>fireSlit(1);
$('slitMany').onclick=()=>fireSlit(200);
$('slitClear').onclick=()=>{ slitHits=new Array(80).fill(0); slitTotal=0; slitMarks=[]; $('slitHits').textContent='0'; drawSlit(); };

/* Atom jumps */
let atomN=1, atomFlash=0, atomColor='#f4efdf', atomLabel='none';
const atomCols=['#c44','#e39b2b','#7cbc4a','#4aa3d9','#7a6adf'];
function drawAtom(){
  const g=prepCanvas('atomCanvas'); if(!g) return;
  const {ctx,W,H}=g;
  ctx.fillStyle='#f9f6ed'; ctx.fillRect(0,0,W,H);
  const cx=W/2, cy=H/2;
  [1,2,3,4].forEach(n=>{
    ctx.strokeStyle = n===atomN ? '#173e48' : '#cfc4ad';
    ctx.lineWidth = n===atomN ? 3 : 1;
    ctx.beginPath(); ctx.arc(cx,cy,28+n*28,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='#766f61'; ctx.font='13px Georgia';
    ctx.fillText('step '+n, cx+32+n*28-20, cy-8);
  });
  ctx.fillStyle='#8a5a32'; ctx.beginPath(); ctx.arc(cx,cy,10,0,Math.PI*2); ctx.fill();
  const R=28+atomN*28;
  const ang=performance.now()/700;
  ctx.fillStyle='#173e48';
  ctx.beginPath(); ctx.arc(cx+Math.cos(ang)*R, cy+Math.sin(ang)*R, 7,0,Math.PI*2); ctx.fill();
  if(atomFlash>0){
    ctx.globalAlpha=atomFlash;
    ctx.fillStyle=atomColor;
    ctx.beginPath(); ctx.arc(cx,cy,R+18,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    atomFlash-=0.04;
  }
  $('atomStep').textContent=String(atomN);
  $('atomLight').textContent=atomLabel;
}
function atomTick(){ if(document.querySelector('.view.on') && document.querySelector('.view.on').dataset.view==='atom') drawAtom(); requestAnimationFrame(atomTick); }
requestAnimationFrame(atomTick);
$('atomAdd').onclick=()=>{
  if(atomN>=4){ $('atomTalk').textContent='Already on the top step.'; return; }
  atomN++; atomFlash=0; atomLabel='none';
  $('atomTalk').textContent='Jumped up to step '+atomN+'.';
  drawAtom();
};
$('atomDrop').onclick=()=>{
  if(atomN<=1){ $('atomTalk').textContent='Already on step 1. Add energy first.'; return; }
  const jump=atomN-1;
  atomN--;
  atomColor=atomCols[Math.min(atomCols.length-1,jump)];
  atomFlash=0.85;
  atomLabel=['red','orange','green','blue'][jump-1]||'light';
  $('atomTalk').textContent='Jumped down. Flash: '+atomLabel+'.';
  drawAtom();
};
$('atomReset').onclick=()=>{ atomN=1; atomFlash=0; atomLabel='none'; $('atomTalk').textContent='Back on step 1.'; drawAtom(); };

/* Electron cloud */
let cloudPts=[];
function cloudPick(kind){
  for(let k=0;k<80;k++){
    const x=(Math.random()*2-1)*3.2, y=(Math.random()*2-1)*3.2;
    const r=Math.hypot(x,y)+1e-6;
    let p=0;
    if(kind==='1s') p=Math.exp(-2.2*r);
    else if(kind==='2s') p=Math.exp(-r)*(1-0.7*r)*(1-0.7*r);
    else p=Math.exp(-1.15*r)*(y*y)/(r*r);
    if(Math.random()<p) return {x,y};
  }
  return {x:0,y:0};
}
function drawCloud(){
  const g=prepCanvas('cloudCanvas'); if(!g) return;
  const {ctx,W,H}=g;
  ctx.fillStyle='#f9f6ed'; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#ddd4c3';
  ctx.beginPath(); ctx.moveTo(W/2,12); ctx.lineTo(W/2,H-12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12,H/2); ctx.lineTo(W-12,H/2); ctx.stroke();
  const S=Math.min(W,H)*0.14;
  cloudPts.forEach(p=>{
    ctx.fillStyle='rgba(23,62,72,0.35)';
    ctx.beginPath(); ctx.arc(W/2+p.x*S, H/2+p.y*S, 2.4,0,Math.PI*2); ctx.fill();
  });
  ctx.fillStyle='#8a5a32'; ctx.beginPath(); ctx.arc(W/2,H/2,4,0,Math.PI*2); ctx.fill();
  $('cloudDots').textContent=String(cloudPts.length);
  $('cloudName').textContent=$('cloudOrb').value;
}
function cloudAdd(n){
  const kind=$('cloudOrb').value;
  for(let i=0;i<n;i++) cloudPts.push(cloudPick(kind));
  $('cloudTalk').textContent=cloudPts.length+' dots. The cloud is the map of looks.';
  drawCloud();
}
$('cloudScan').onclick=()=>cloudAdd(1);
$('cloudMany').onclick=()=>cloudAdd(80);
$('cloudClear').onclick=()=>{ cloudPts=[]; $('cloudTalk').textContent='Cleared. Scan again.'; drawCloud(); };
$('cloudOrb').onchange=()=>{ cloudPts=[]; $('cloudTalk').textContent='New shape. Scan again.'; drawCloud(); };

/* Particle bouncer */
let bounceDots=[], bounceBack=0, bounceThru=0, bounceAnim=null;
function bounceT(){
  const V=+$('bounceH').value, L=+$('bounceW').value, E=5;
  if(E>=V) return 0.82;
  return Math.max(0.01, Math.min(0.95, Math.exp(-0.22*Math.sqrt(V-E)*L)));
}
function drawBounce(){
  const g=prepCanvas('bounceCanvas'); if(!g) return;
  const {ctx,W,H}=g;
  ctx.fillStyle='#f9f6ed'; ctx.fillRect(0,0,W,H);
  const V=+$('bounceH').value, L=+$('bounceW').value;
  const wallW=18+L*6;
  const wallX=W*0.55-wallW/2;
  const wallH=40+V*10;
  const base=H-28;
  ctx.fillStyle='#cfc4ad'; ctx.fillRect(16,base,W-32,4);
  ctx.fillStyle='#171612'; ctx.fillRect(wallX, base-wallH, wallW, wallH);
  ctx.fillStyle='#766f61'; ctx.font='13px Georgia';
  ctx.fillText('wall', wallX, base-wallH-8);
  bounceDots.forEach(p=>{
    ctx.fillStyle=p.side==='thru'?'#355f4a':(p.side==='back'?'#8a5a32':'#173e48');
    ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fill();
  });
}
function launchBounce(){
  const g=prepCanvas('bounceCanvas'); if(!g) return;
  const {W,H}=g;
  const V=+$('bounceH').value, L=+$('bounceW').value;
  const wallW=18+L*6;
  const wallX=W*0.55-wallW/2;
  const T=bounceT();
  const n=40;
  bounceDots=[];
  for(let i=0;i<n;i++){
    bounceDots.push({
      x: 24,
      y: 50+Math.random()*(H-90),
      v: 2.2+Math.random()*1.4,
      pass: Math.random()<T,
      side: 'run',
      done:false
    });
  }
  $('bounceTalk').textContent='Wall is '+(T>0.35?'leaky.':'thick. Some may still sneak.');
  if(bounceAnim) cancelAnimationFrame(bounceAnim);
  function tick(){
    let moving=false;
    bounceDots.forEach(p=>{
      if(p.done) return;
      moving=true;
      if(p.side==='run'){
        p.x+=p.v;
        if(p.x>=wallX){
          if(p.pass) p.side='thru';
          else p.side='back';
        }
      } else if(p.side==='thru'){
        p.x+=p.v;
        if(p.x>W-16){ p.done=true; bounceThru++; }
      } else {
        p.x-=p.v;
        if(p.x<16){ p.done=true; bounceBack++; }
      }
    });
    $('bounceBack').textContent=String(bounceBack);
    $('bounceThru').textContent=String(bounceThru);
    drawBounce();
    if(moving) bounceAnim=requestAnimationFrame(tick);
    else $('bounceTalk').textContent=bounceThru+' went through. '+bounceBack+' bounced.';
  }
  bounceAnim=requestAnimationFrame(tick);
}
$('bounceH').oninput=()=>{ $('bounceHVal').textContent=$('bounceH').value; drawBounce(); };
$('bounceW').oninput=()=>{ $('bounceWVal').textContent=$('bounceW').value; drawBounce(); };
$('bounceGo').onclick=()=>{ bounceBack=0; bounceThru=0; launchBounce(); };
$('bounceClear').onclick=()=>{ bounceDots=[]; bounceBack=0; bounceThru=0; $('bounceBack').textContent='0'; $('bounceThru').textContent='0'; $('bounceTalk').textContent='Cleared.'; drawBounce(); };
