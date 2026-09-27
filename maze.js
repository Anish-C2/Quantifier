(() => {
"use strict";
const $ = id => document.getElementById(id);
const canvas = $('mazeCanvas');
if(!canvas) return;
const ctx = canvas.getContext('2d');
let maze=[], size=15, running=false, solution=null, explored=new Set(), frontier=new Set(), pathSet=new Set();
const configs={ easy:{size:15,speed:18}, medium:{size:31,speed:8}, hard:{size:61,speed:2} };
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
  solution=null;explored.clear();frontier.clear();pathSet.clear();
  updateStats();draw();
  $('mazeStatus').textContent='New maze';
  $('mazeLog').innerHTML='';
  log('New maze ready');
  talk('Press Find way.');
}
function draw(){
  const w=canvas.width,h=canvas.height,cell=Math.min(w,h)/size;
  ctx.fillStyle='#efe8d6';ctx.fillRect(0,0,w,h);
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    const k=key(r,c),x=c*cell,y=r*cell;
    let col=maze[r][c]?'#171612':'#f4efdf';
    if(explored.has(k))col='#7a9aa3';
    if(frontier.has(k))col='#c9a15b';
    if(pathSet.has(k))col='#4f7a5b';
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
  $('mazeLen').textContent=solution?String(solution.length-1):'—';
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
async function classical(){
  const start=key(1,1),goal=key(size-2,size-2);
  const q=[[1,1]],parent=new Map([[start,null]]);
  let qi=0; explored.clear();frontier.clear();pathSet.clear();
  $('mazeStatus').textContent='Walking';
  talk('Walking hall by hall.');
  log('Normal search');
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
    $('mazeProb').textContent='Yes';$('mazeBar').style.width='100%';
    log('Found a way. '+ (solution.length-1) +' steps.');
    talk('Green is the way out.');
  }else {
    log('No way. Make a new maze.');
    talk('No way. Press New maze.');
  }
  $('mazeStatus').textContent='Done';running=false;draw();updateStats();
}
async function quantum(){
  const open=maze.flat().filter(x=>x===0).length;
  const iters=+$('mazeIters').value;
  $('mazeStatus').textContent='Hunting';
  talk('Hunting many halls.');
  log('New search');
  explored.clear();frontier.clear();pathSet.clear();solution=null;
  const start=key(1,1),goal=key(size-2,size-2);
  let layer=[start], parent=new Map([[start,null]]), found=false;
  for(let i=1;i<=iters && !found;i++){
    const next=[];
    for(const k of layer){
      const [r,c]=coords(k); explored.add(k);
      for(const [nr,nc] of neighbors(r,c)){
        const nk=key(nr,nc);
        if(!parent.has(nk)){parent.set(nk,k);next.push(nk);frontier.add(nk)}
        if(nk===goal){found=true;break}
      }
      if(found)break;
    }
    layer=next;
    const targetProb=Math.min(0.999,1-Math.exp(-explored.size/Math.max(1,open)*3.2));
    $('mazeIter').textContent=String(i);
    $('mazeProb').textContent=(targetProb*100).toFixed(0)+'%';
    $('mazeBar').style.width=(targetProb*100)+'%';
    updateStats();draw();
    if(i===1)log('Looking at many halls');
    await sleep(Math.max(2,configs[$('mazeDiff').value].speed));
    frontier.clear();
  }
  if(!found){
    log('Still looking');
    while(layer.length&&!found){
      const next=[];
      for(const k of layer){
        const [r,c]=coords(k);explored.add(k);
        for(const [nr,nc] of neighbors(r,c)){
          const nk=key(nr,nc);
          if(!parent.has(nk)){parent.set(nk,k);next.push(nk)}
          if(nk===goal){found=true;break}
        }
        if(found)break;
      }
      layer=next;
      updateStats();draw();await sleep(1);
    }
  }
  if(parent.has(goal)){
    solution=reconstruct(parent);
    solution.forEach((k,i)=>setTimeout(()=>{pathSet.add(k);draw()},Math.min(i*3,900)));
    const finalP=Math.min(1,explored.size/Math.max(1,open)*1.25);
    $('mazeProb').textContent=(finalP*100).toFixed(0)+'%';
    $('mazeBar').style.width=(finalP*100)+'%';
    $('mazeLen').textContent=String(solution.length-1);
    log('Found a way. '+(solution.length-1)+' steps.');
    talk('Green is the way out.');
  }else {
    log('No way. Make a new maze.');
    talk('No way. Press New maze.');
  }
  $('mazeStatus').textContent='Done';running=false;updateStats();
}
async function solve(){
  if(running)return;
  if(!maze.length) generate();
  running=true;
  $('mazeIter').textContent='0';$('mazeProb').textContent='—';$('mazeBar').style.width='0%';
  if($('mazeSolver').value==='classical')await classical();else await quantum();
}
function clearRun(){
  if(running)return;explored.clear();frontier.clear();pathSet.clear();solution=null;
  $('mazeIter').textContent='0';$('mazeProb').textContent='—';$('mazeBar').style.width='0%';$('mazeLen').textContent='—';
  $('mazeStatus').textContent='Cleared';draw();updateStats();talk('Path cleared. Press Find way.');
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
