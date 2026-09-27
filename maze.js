(() => {
"use strict";
const $ = id => document.getElementById(id);
const canvas = $('mazeCanvas');
if(!canvas) return;
const ctx = canvas.getContext('2d');
let maze=[], size=15, running=false, solution=null, explored=new Set(), frontier=new Set(), pathSet=new Set();
let heat=new Map();
const configs={ easy:{size:15,speed:24}, medium:{size:31,speed:10}, hard:{size:61,speed:3} };
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function log(s){
  const box=$('mazeLog');
  if(!box) return;
  box.insertAdjacentHTML('beforeend','<div>'+s+'</div>');
  box.scrollTop=box.scrollHeight;
}
function talk(s){ const g=$('mazeGuide'); if(g) g.textContent=s; }
function key(r,c){return r+','+c}
function coords(k){const [r,c]=k.split(',').map(Number);return [r,c]}
function generate(){
  if(running)return;
  size=configs[$('mazeDiff').value].size;
  maze=Array.from({length:size},()=>Array(size).fill(1));
  const stack=[[1,1]];
  maze[1][1]=0;
  while(stack.length){
    const [r,c]=stack[stack.length-1];
    const dirs=[[2,0],[-2,0],[0,2],[0,-2]].sort(()=>Math.random()-.5);
    let moved=false;
    for(const [dr,dc] of dirs){
      const nr=r+dr,nc=c+dc;
      if(nr>0&&nr<size-1&&nc>0&&nc<size-1&&maze[nr][nc]===1){
        maze[r+dr/2][c+dc/2]=0; maze[nr][nc]=0;
        stack.push([nr,nc]);moved=true;break;
      }
    }
    if(!moved)stack.pop();
  }
  const loopChance=$('mazeDiff').value==='easy'?0.03:$('mazeDiff').value==='medium'?0.075:0.12;
  for(let r=1;r<size-1;r+=2)for(let c=1;c<size-1;c+=2){
    if(Math.random()<loopChance){
      const options=[];
      if(maze[r+1]&&maze[r+1][c]===1)options.push([r+1,c]);
      if(maze[r-1]&&maze[r-1][c]===1)options.push([r-1,c]);
      if(maze[r][c+1]===1)options.push([r,c+1]);
      if(maze[r][c-1]===1)options.push([r,c-1]);
      if(options.length){const [a,b]=options[Math.floor(Math.random()*options.length)];maze[a][b]=0}
    }
  }
  maze[1][1]=0; maze[size-2][size-2]=0;
  solution=null;explored.clear();frontier.clear();pathSet.clear();heat.clear();
  updateStats();draw();
  $('mazeStatus').textContent='New maze';
  $('mazeLog').innerHTML='';
  log('New maze ready');
  talk('Press Find way.');
}
function heatColor(p){
  const t=Math.min(1,p*8);
  const r=Math.round(244-t*180);
  const g=Math.round(239-t*80);
  const b=Math.round(223-t*40);
  return 'rgb('+r+','+g+','+b+')';
}
function draw(){
  const w=canvas.width,h=canvas.height,cell=Math.min(w,h)/size;
  ctx.fillStyle='#efe8d6';ctx.fillRect(0,0,w,h);
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    const k=key(r,c),x=c*cell,y=r*cell;
    let col=maze[r][c]?'#171612':'#f4efdf';
    if(heat.has(k)) col=heatColor(heat.get(k));
    if(explored.has(k) && !heat.has(k)) col='#7a9aa3';
    if(frontier.has(k)) col='#c9a15b';
    if(pathSet.has(k)) col='#4f7a5b';
    if(r===1&&c===1)col='#2a6f78';
    if(r===size-2&&c===size-2)col='#8a3d38';
    ctx.fillStyle=col;ctx.fillRect(x,y,Math.ceil(cell)+.5,Math.ceil(cell)+.5);
  }
}
function updateStats(){
  const open=maze.length?maze.flat().filter(x=>x===0).length:0;
  $('mazeCells').textContent=String(size*size);
  $('mazeOpen').textContent=String(open);
  $('mazeExplored').textContent=String(explored.size);
  $('mazeFrontier').textContent=String(frontier.size);
  $('mazeLen').textContent=solution?String(solution.length-1):'\u2014';
}
function neighbors(r,c){
  const out=[];
  for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const nr=r+dr,nc=c+dc;
    if(nr>=0&&nr<size&&nc>=0&&nc<size&&maze[nr][nc]===0)out.push([nr,nc]);
  }
  return out;
}
function reconstruct(parent){
  const end=key(size-2,size-2),start=key(1,1),out=[];
  let cur=end;
  while(cur!==null){out.push(cur);if(cur===start)break;cur=parent.get(cur)}
  return out.reverse();
}
function bfsPath(){
  const start=key(1,1),goal=key(size-2,size-2);
  const q=[[1,1]], parent=new Map([[start,null]]);
  let qi=0;
  while(qi<q.length){
    const [r,c]=q[qi++], k=key(r,c);
    if(k===goal) return {parent, ok:true};
    for(const [nr,nc] of neighbors(r,c)){
      const nk=key(nr,nc);
      if(!parent.has(nk)){ parent.set(nk,k); q.push([nr,nc]); }
    }
  }
  return {parent, ok:parent.has(goal)};
}
async function classical(){
  const start=key(1,1),goal=key(size-2,size-2);
  const q=[[1,1]],parent=new Map([[start,null]]);
  let qi=0; explored.clear();frontier.clear();pathSet.clear();heat.clear();
  $('mazeStatus').textContent='Walking';
  talk('One square at a time.');
  log('Normal search = hall by hall (BFS).');
  while(qi<q.length&&running){
    const [r,c]=q[qi++],k=key(r,c);
    explored.add(k);
    for(const [nr,nc] of neighbors(r,c)){
      const nk=key(nr,nc);
      if(!parent.has(nk)){parent.set(nk,k);q.push([nr,nc]);frontier.add(nk)}
    }
    frontier.delete(k);updateStats();draw();
    if(k===goal)break;
    await sleep(configs[$('mazeDiff').value].speed);
  }
  if(parent.has(goal)){
    solution=reconstruct(parent);solution.forEach(k=>pathSet.add(k));
    $('mazeProb').textContent='path';$('mazeBar').style.width='100%';
    log('Path length '+(solution.length-1)+'.');
    talk('Green is the way.');
  }else {
    log('No path.');
    talk('No path. New maze.');
  }
  $('mazeStatus').textContent='Done';running=false;draw();updateStats();
}
async function quantum(){
  const cells=[]; const index=new Map();
  for(let r=0;r<size;r++) for(let c=0;c<size;c++){
    if(maze[r][c]===0){ index.set(key(r,c), cells.length); cells.push([r,c]); }
  }
  const n=cells.length;
  const startI=index.get(key(1,1)), goalI=index.get(key(size-2,size-2));
  if(startI==null || goalI==null){ log('Bad maze'); running=false; return; }
  const adj=cells.map(([r,c])=>neighbors(r,c).map(([nr,nc])=>index.get(key(nr,nc))).filter(j=>j!=null));
  const deg=adj.map(a=>Math.max(1,a.length));
  let psi=new Float64Array(n); psi[startI]=1;
  const iters=+$('mazeIters').value;
  const groverK=Math.max(1, Math.floor(Math.PI/4*Math.sqrt(n)));
  explored.clear();frontier.clear();pathSet.clear();heat.clear();solution=null;
  $('mazeStatus').textContent='Wave';
  talk('A number sits on every open square. The wave moves.');
  log('Wave search on '+n+' open squares.');
  log('Each step: move wave to neighbour squares, then boost the end square.');
  log('Laptop math. Not a quantum chip. Path at the end is drawn the normal way.');
  log('Boost recipe length if the end were hidden: about '+groverK+' (\u03c0/4)\u221aN');
  for(let step=1; step<=iters && running; step++){
    const next=new Float64Array(n);
    for(let i=0;i<n;i++){
      next[i]+=psi[i]*0.2;
      const s=Math.sqrt(deg[i]);
      for(const j of adj[i]) next[j]+=psi[i]/Math.sqrt(deg[j])/s;
    }
    let ss=0; for(let i=0;i<n;i++) ss+=next[i]*next[i];
    const n1=Math.sqrt(ss)||1;
    for(let i=0;i<n;i++) psi[i]=next[i]/n1;
    if(Math.abs(psi[goalI])>1e-8){
      psi[goalI]*=-1;
      let mean=0; for(let i=0;i<n;i++) mean+=psi[i]; mean/=n;
      for(let i=0;i<n;i++) psi[i]=2*mean-psi[i];
      ss=0; for(let i=0;i<n;i++) ss+=psi[i]*psi[i];
      const n2=Math.sqrt(ss)||1;
      for(let i=0;i<n;i++) psi[i]/=n2;
    }
    heat.clear(); explored.clear(); frontier.clear();
    let live=0;
    for(let i=0;i<n;i++){
      const p=psi[i]*psi[i];
      if(p>1e-5){
        const [r,c]=cells[i]; const k=key(r,c);
        heat.set(k,p); explored.add(k); live++;
      }
    }
    const pGoal=psi[goalI]*psi[goalI];
    $('mazeIter').textContent=String(step);
    $('mazeProb').textContent=(pGoal*100).toFixed(2)+'%';
    $('mazeBar').style.width=Math.min(100,pGoal*100*4)+'%';
    $('mazeFrontier').textContent=String(live);
    updateStats(); draw();
    if(step===1) log('Start square holds the whole wave.');
    if(step%10===0) log('Step '+step+' \u00b7 P(end)='+(pGoal*100).toFixed(2)+'%');
    await sleep(Math.max(2,configs[$('mazeDiff').value].speed));
  }
  const pack=bfsPath();
  if(pack.ok){
    solution=reconstruct(pack.parent);
    solution.forEach((k,i)=>setTimeout(()=>{pathSet.add(k);draw();},Math.min(i*4,1200)));
    $('mazeLen').textContent=String(solution.length-1);
    log('Look: one path is drawn with normal hall-walk, length '+(solution.length-1)+'.');
    talk('Green path is the readout. Teal/brown is the wave.');
  }else {
    log('No path.');
    talk('No path. New maze.');
  }
  $('mazeStatus').textContent='Done'; running=false; updateStats(); draw();
}
async function solve(){
  if(running)return;
  if(!maze.length) generate();
  running=true;
  $('mazeIter').textContent='0';$('mazeProb').textContent='\u2014';$('mazeBar').style.width='0%';
  if($('mazeSolver').value==='classical')await classical();else await quantum();
}
function clearRun(){
  if(running)return;explored.clear();frontier.clear();pathSet.clear();heat.clear();solution=null;
  $('mazeIter').textContent='0';$('mazeProb').textContent='\u2014';$('mazeBar').style.width='0%';$('mazeLen').textContent='\u2014';
  $('mazeStatus').textContent='Cleared';draw();updateStats();talk('Cleared.');
}
window.mazeEnsure = function(){
  if(!maze.length) generate();
  else {
    const box=canvas.getBoundingClientRect();
    if(box.width) draw();
  }
};
$('mazeGenerate').addEventListener('click',generate);
$('mazeSolve').addEventListener('click',solve);
$('mazeClear').addEventListener('click',clearRun);
$('mazePanic').addEventListener('click',async()=>{generate();await sleep(50);solve()});
$('mazeIters').addEventListener('input',e=>$('mazeIterText').textContent=e.target.value);
$('mazeShots').addEventListener('input',e=>$('mazeShotText').textContent=e.target.value);
$('mazeDiff').addEventListener('change',generate);
})();
