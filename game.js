const ART = {
  home: 'assets/01-home.webp', folds: 'assets/02-folds.webp', howto: 'assets/03-howto.webp',
  about: 'assets/04-about.webp', game: 'assets/05-game.webp', pause: 'assets/06-pause.webp',
  result_a: 'assets/07-result-a.webp', result_b: 'assets/07-result-b.webp', result_c: 'assets/07-result-c.webp'
};
const CONFIG = Object.assign({ mode: 'local', supabaseUrl: '', supabaseKey: '' }, window.XQ_CONFIG || {});
const ONLINE = () => CONFIG.mode === 'supabase' && !!CONFIG.supabaseUrl && !!CONFIG.supabaseKey;
const uid = () => (self.crypto && crypto.randomUUID ? crypto.randomUUID() : 'p-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
async function xqInsert(table, row) {
  const r = await fetch(CONFIG.supabaseUrl.replace(/\/+$/, '') + '/rest/v1/' + table, {
    method: 'POST',
    headers: { apikey: CONFIG.supabaseKey, Authorization: 'Bearer ' + CONFIG.supabaseKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(row)
  });
  if (!r.ok) throw new Error(await r.text());
  return true;
}
function xqBox(){ try{ return JSON.parse(localStorage.getItem('xq-results') || '[]'); }catch{ return []; } }
function xqSave(box){ try{ localStorage.setItem('xq-results', JSON.stringify(box)); }catch{} }
async function flushQueue(){
  if(!ONLINE()) return;
  const box = xqBox(); let changed = false;
  for(const it of box){
    if(it.sent) continue;
    const { sent, ...row } = it;
    try{ await xqInsert('results', row); it.sent = true; changed = true; }catch{ break; }
  }
  if(changed) xqSave(box);
}
const laneX = [.285, .43, .57, .715], colors = ['#62c8f4','#f5b84f','#f05c91','#8c62ed'];
const bg = document.querySelector('#background'), ui = document.querySelector('#ui');
const canvas = document.querySelector('#playfield'), ctx = canvas.getContext('2d');
const music = document.querySelector('#music');
let notes = [], screen = 'login', startAt = 0, pausedAt = 0, pausedTotal = 0, playing = false;
let score = 0, exact = 0, late = 0, miss = 0, combo = 0, maxCombo = 0, raf = 0;
let player = JSON.parse(sessionStorage.getItem('xun-player') || 'null');
let finished = false;

fetch('chart.json').then(r => r.json()).then(x => notes = x.notes.map(n => ({...n, hit:false})));
function fit(){ canvas.width = 1280; canvas.height = 720; }
addEventListener('resize', fit); fit();
function addHot(x,y,w,h,fn,label='') { const b=document.createElement('button'); b.className='hotspot'; b.style.cssText=`left:${x*100}%;top:${y*100}%;width:${w*100}%;height:${h*100}%`; b.ariaLabel=label; b.onclick=fn; ui.append(b); return b; }
function show(target){ screen=target; playing=target==='game'; bg.src=target==='login'?ART.home:ART[target]; ui.replaceChildren(); cancelAnimationFrame(raf); ctx.clearRect(0,0,1280,720);
  if(target==='login') loginUI(); else if(target==='home') home(); else if(['folds','howto','about'].includes(target)) nav(target); else if(target==='game') gameUI(); else if(target==='pause') pauseUI(); else resultUI();
}
function loginUI(){
  const panel=document.createElement('form'); panel.className='login-panel'; panel.innerHTML=`
    <div class="login-kicker">阿宫腔节奏体验</div><h1>入戏登记</h1><p>请填写简单信息，数据仅保存在本地研究后台。</p>
    <div class="form-grid"><label>姓名<input name="name" maxlength="20" required placeholder="请输入姓名"></label><label>年龄<input name="age" type="number" min="6" max="100" required placeholder="请输入年龄"></label>
    <label>是否接触过阿宫腔<select name="agong"><option>从未接触</option><option>听说过</option><option>观看或学习过</option></select></label>
    <label>平时听戏频率<select name="frequency"><option>几乎不听</option><option>偶尔</option><option>每月数次</option><option>经常</option></select></label>
    <label class="wide">是否了解皮影戏<select name="shadow"><option>不了解</option><option>略有了解</option><option>比较了解</option></select></label></div>
    <button class="enter" type="submit">确认 · 入戏</button><div class="form-status" aria-live="polite"></div>`;
  panel.onsubmit=async e=>{ e.preventDefault(); const data=Object.fromEntries(new FormData(panel)); data.age=Number(data.age); data.created_at=new Date().toISOString(); const status=panel.querySelector('.form-status'); status.textContent='正在登记…';
    player=Object.assign({id:uid()},data);
    if(ONLINE()){
      try{ await xqInsert('players', player); }
      catch{ status.textContent='网络较慢，成绩将先存在本机。'; }
    }
    sessionStorage.setItem('xun-player',JSON.stringify(player)); show('home'); };
  ui.append(panel);
}
function home(){ addHot(.09,.62,.27,.20,()=>show('folds'),'入戏'); addHot(.68,.37,.14,.10,()=>show('home'),'戏台'); addHot(.68,.48,.14,.10,()=>show('folds'),'折目'); addHot(.68,.59,.14,.10,()=>show('howto'),'玩法'); addHot(.68,.70,.14,.10,()=>show('about'),'关于'); }
function nav(active){ addHot(.28,.86,.12,.11,()=>show('home'),'戏台'); addHot(.41,.86,.12,.11,()=>show('folds'),'折目'); addHot(.54,.86,.12,.11,()=>show('howto'),'玩法'); addHot(.67,.86,.12,.11,()=>show('about'),'关于'); if(active==='folds') addHot(.69,.18,.17,.17,startGame,'开嗓'); }
function reset(){ score=exact=late=miss=combo=maxCombo=0; finished=false; notes.forEach(n=>n.hit=false); pausedTotal=0; }
function startGame(){ reset(); startAt=performance.now()/1000; show('game'); music.currentTime=0; music.play().catch(()=>{}); }
function gameUI(){ addHot(.91,.005,.085,.13,pauseGame,'暂停');
  const end=document.createElement('button');end.className='end-early';end.textContent='提前结束';end.onclick=()=>{if(confirm('确定提前结束本局并生成当前成绩吗？'))finish();};ui.append(end);
  const hud=document.createElement('div'); hud.className='hud'; hud.id='score'; hud.textContent=String(score).padStart(7,'0'); ui.append(hud);
  const f=document.createElement('div'); f.className='feedback'; f.id='feedback'; ui.append(f);
  for(let i=0;i<4;i++){ const lane=document.createElement('button'); lane.className='lane'; lane.style.left=`${(0.12+i*.19)*100}%`; lane.onclick=()=>hit(i); ui.append(lane);
    const p=document.createElement('button'); p.className='pad'; p.textContent=['D','F','J','K'][i]; p.style.cssText=`left:${(20.5+i*14.5)}%;--c:${colors[i]}`; p.onclick=()=>hit(i); ui.append(p); }
  raf=requestAnimationFrame(loop);
}
function time(){ return music.duration && !music.paused ? music.currentTime : performance.now()/1000-startAt-pausedTotal; }
function feedback(t){ const el=document.querySelector('#feedback'); if(!el)return; el.textContent=t; clearTimeout(feedback.t); feedback.t=setTimeout(()=>el&&(el.textContent=''),260); }
function hit(lane){ if(!playing)return; const t=time(); let best=null, d=.29; for(const n of notes){ if(n.hit||n.lane!==lane)continue; const nd=Math.abs(n.time-t); if(nd<d){best=n;d=nd;} } if(!best){feedback('空');return;} best.hit=true; combo++; maxCombo=Math.max(maxCombo,combo); if(d<=.12){exact++;score+=1000+combo*10;feedback('正');}else{late++;score+=500+combo*5;feedback('随');} const s=document.querySelector('#score'); if(s)s.textContent=String(score).padStart(7,'0'); }
function loop(){ if(!playing)return; const t=time(); for(const n of notes){if(!n.hit&&n.time<t-.3){n.hit=true;miss++;combo=0;feedback('失');}} draw(t); if(notes.length&&t>notes.at(-1).time+1.5)return finish(); raf=requestAnimationFrame(loop); }
function draw(t){ ctx.clearRect(0,0,1280,720); for(const n of notes){if(n.hit)continue; const dt=n.time-t;if(dt<-.3||dt>1.65)continue; const q=1-dt/1.65,x=laneX[n.lane]*1280,y=(.14+(.685-.14)*q)*720; ctx.save(); ctx.globalAlpha=.28;ctx.fillStyle=colors[n.lane];ctx.beginPath();ctx.arc(x,y,40,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=colors[n.lane];ctx.lineWidth=4;ctx.stroke(); ctx.restore();} }
function pauseGame(){ playing=false;pausedAt=performance.now()/1000;music.pause();show('pause'); }
function pauseUI(){ addHot(.42,.36,.16,.11,resume,'继续'); addHot(.42,.48,.16,.11,startGame,'重新开始'); addHot(.42,.60,.16,.11,finishFromPause,'出戏并评分'); addHot(.91,.005,.085,.13,resume,'继续'); }
function resume(){ pausedTotal+=performance.now()/1000-pausedAt;show('game');music.play().catch(()=>{}); }
function finishFromPause(){finish();}
function grade(){
  const processed=Math.max(1,exact+late+miss), accuracy=(exact+late*.5)/processed, completion=Math.min(1,processed/Math.max(1,notes.length));
  const stable=accuracy*.75+completion*.25;
  return stable>=.85?'A':stable>=.60?'B':'C';
}
function finish(){ if(finished)return; finished=true; playing=false;music.pause(); const g=grade(); show('result_'+g.toLowerCase()); saveResult(g); }
async function saveResult(g){
  const status=document.querySelector('#save-status'); if(status)status.textContent='正在保存成绩…';
  if(!player){if(status)status.textContent='未找到玩家登记信息';return;}
  const processed=exact+late+miss, payload={player_id:player.id,name:player.name,age:player.age,agong:player.agong,frequency:player.frequency,shadow:player.shadow,grade:g,score,exact,late,miss,max_combo:maxCombo,processed,total_notes:notes.length,completion:Math.round(processed/Math.max(1,notes.length)*100),finished_early:processed<notes.length,finished_at:new Date().toISOString()};
  const box=xqBox(); box.push(Object.assign({sent:false},payload)); xqSave(box);
  if(!ONLINE()){ if(status)status.textContent='✓ 成绩已记在本机'; return; }
  try{await xqInsert('results',payload);box[box.length-1].sent=true;xqSave(box);if(status)status.textContent='✓ 成绩已保存';}
  catch{if(status)status.textContent='网络异常，成绩已存在本机，下次进入自动补传';}
}
function resultUI(){
  addHot(.39,.68,.22,.10,startGame,'重新开始'); addHot(.39,.80,.22,.10,()=>show('folds'),'返回菜单');
  const g=grade(), stars=g==='A'?'★★★':g==='B'?'★★☆':'★☆☆';
  const processed=exact+late+miss, complete=Math.round(processed/Math.max(1,notes.length)*100);
  const d=document.createElement('section');d.className='result-card';d.innerHTML=`<div class="result-title">本局结果</div><div class="result-grade">${g}</div><div class="result-stars">${stars}</div><div class="result-score">${String(score).padStart(7,'0')}</div><div class="result-stats"><span>正 <b>${exact}</b></span><span>随 <b>${late}</b></span><span>失 <b>${miss}</b></span></div><div class="result-combo">最大连击 ${maxCombo} · 完成度 ${complete}%</div><div id="save-status" class="save-status">准备保存成绩…</div>`;ui.append(d);
}
addEventListener('keydown',e=>{ const i={d:0,f:1,j:2,k:3}[e.key.toLowerCase()];if(i!==undefined)hit(i);if(e.key==='Escape')screen==='game'?pauseGame():screen==='pause'?resume():show('home'); });
document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
show(player?'home':'login');
flushQueue();
