const homeScreen = document.getElementById("home-screen");
const gameScreen = document.getElementById("game-screen");
const teaserScreen = document.getElementById("teaser-screen");
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const gameTitle = document.getElementById("game-title");
const gameHint = document.getElementById("game-hint");
const statusEl = document.getElementById("status");
const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popup-title");
const popupText = document.getElementById("popup-text");
const popupBtn = document.getElementById("popup-btn");
const backBtn = document.getElementById("back-btn");
const menuMessage = document.getElementById("menu-message");
const levelButtons = [...document.querySelectorAll(".level-btn")];
const particles = document.getElementById("particles");

const W = canvas.width;
const H = canvas.height;
const keys = new Set();
const saveKey = "tenToTwentySavedSpotsV2";
const completed = new Set(JSON.parse(localStorage.getItem(saveKey) || "[]"));

const COLORS = {
  ink: "#080712", night: "#10152a", plum: "#30152e", rose: "#c63f5c", coral: "#ff7b54",
  teal: "#38c6b4", sky: "#7ed7e6", gold: "#f8cf68", cream: "#fff1d6",
  green: "#7cff9b", danger: "#ff5a6d", orange: "#f89a2c"
};

const fruitColors = {
  pomegranate: "#c63f5c", orange: "#f89a2c", grape: "#7a3fc7", berry: "#8b2d63",
  lemonMint: "#98d65c", mango: "#ffc247", peach: "#ffb08a", apple: "#9bd36a", watermelon: "#44b866"
};

const assets = {
  juiceLogo: asset("logo_juice_palace.png"), egyptian: asset("egyptian.png"), mountain: asset("scene_mountain.png"),
  cruise: asset("scene_cruise.png"), coast: asset("coast_guard.png"), chairs: asset("chairs.png"),
  rav4: asset("rav4.png"), jojo: asset("jojo.png"), digicam: asset("digicam.png")
};

let currentLevel = 1;
let raf = null;
let last = 0;
let time = 0;
let done = false;
let current = null;
let floating = [];
let hearts = [];
let mouse = { x: 0, y: 0, down: false };

function asset(src) {
  const a = { img: new Image(), ready: false, missing: false };
  a.img.onload = () => a.ready = true;
  a.img.onerror = () => a.missing = true;
  a.img.src = src;
  return a;
}

function ambientParticle() {
  const el = document.createElement("span");
  el.className = "particle";
  el.textContent = ["♥", "♡", "✦", "·"][Math.floor(Math.random() * 4)];
  el.style.left = `${Math.random() * 100}vw`;
  el.style.animationDuration = `${7 + Math.random() * 9}s`;
  el.style.fontSize = `${10 + Math.random() * 12}px`;
  el.style.color = [COLORS.gold, COLORS.rose, COLORS.teal, COLORS.cream][Math.floor(Math.random() * 4)];
  particles.appendChild(el);
  setTimeout(() => el.remove(), 17000);
}
setInterval(ambientParticle, 800);
for (let i = 0; i < 8; i++) setTimeout(ambientParticle, i * 150);

levelButtons.forEach(btn => btn.addEventListener("click", () => startLevel(Number(btn.dataset.level))));
backBtn.addEventListener("click", goHome);
popupBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
  completed.add(currentLevel);
  localStorage.setItem(saveKey, JSON.stringify([...completed]));
  stopLoop();
  if (completed.size >= 3) showTeaser(); else goHome();
});

window.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  keys.add(k);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
  if (currentLevel === 3 && (k === "e" || k === " ")) attemptPhoto();
});
window.addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));
canvas.addEventListener("pointerdown", e => { mouse.down = true; mouse = { ...point(e), down: true }; handlePointer(mouse); });
canvas.addEventListener("pointermove", e => { mouse = { ...point(e), down: mouse.down }; if (currentLevel === 3 && mouse.down) current.target = { x: mouse.x, y: mouse.y }; });
window.addEventListener("pointerup", () => mouse.down = false);

function updateMenu() {
  levelButtons.forEach(btn => btn.classList.toggle("done", completed.has(Number(btn.dataset.level))));
  menuMessage.textContent = completed.size ? `${completed.size}/3 memories saved.` : "Pick a spot to start.";
}
updateMenu();

function startLevel(level) {
  currentLevel = level;
  done = false;
  time = 0;
  floating = [];
  hearts = [];
  homeScreen.classList.add("hidden");
  teaserScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  document.body.classList.add("game-mode");
  if (level === 1) setupJuice();
  if (level === 2) setupMountain();
  if (level === 3) setupCruise();
  stopLoop();
  startLoop();
}

function goHome() {
  popup.classList.add("hidden");
  gameScreen.classList.add("hidden");
  teaserScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
  document.body.classList.remove("game-mode");
  stopLoop();
  updateMenu();
}
function showTeaser(){ gameScreen.classList.add("hidden"); homeScreen.classList.add("hidden"); teaserScreen.classList.remove("hidden"); document.body.classList.remove("game-mode"); updateMenu(); }
function setHint(t){ gameHint.textContent = t; }
function setStatus(t){ statusEl.innerHTML = t.replace(/\n/g,"<br>"); }
function shake(){ canvas.classList.remove("shake"); void canvas.offsetWidth; canvas.classList.add("shake"); }
function fail(t){ if(done) return; current.hearts--; shake(); floatText(t, W/2, 110, COLORS.danger); if(current.hearts <= 0){ resetCurrent(); } }
function resetCurrent(){ setHint("Resetting this tiny disaster."); setTimeout(() => startLevel(currentLevel), 700); }
function win(text){ if(done) return; done = true; popupTitle.textContent = "saved"; popupText.textContent = text; popup.classList.remove("hidden"); burst(W/2, H/2, 24); }

/* LEVEL 1 */
function setupJuice(){
  gameTitle.textContent = "نسبة وتناسب";
  setHint("Build نسبة وتناسب before he confidently ruins it.");
  current = {
    level:1, phase:"pick", hearts:3, recipe:["pomegranate","orange","grape","berry"], selected:[],
    ratio:false, timer:45, workerTimer:2.2, workerLine:"رمان صح؟ الباقي easy.",
    ratioMarker:0, ratioDir:1, ratioTries:2, spotTimer:18,
    ingredients:[
      item("pomegranate",100,380), item("orange",215,450), item("grape",335,380), item("berry",455,450),
      item("lemonMint",575,380,true), item("mango",695,450), item("peach",815,380), item("watermelon",860,470)
    ],
    spots:[{x:650,y:305,w:128,h:76,good:true,label:"quiet shade"},{x:510,y:390,w:110,h:68,label:"too close"},{x:810,y:390,w:104,h:64,label:"wet sand"}],
  };
}
function item(name,x,y,bonus=false){ return {name,x,y,bonus}; }
function juicePointer(p){
  if(current.phase === "pick"){
    const hit = current.ingredients.find(i => dist(p.x,p.y,i.x,i.y)<48);
    if(!hit) return;
    if(hit.bonus){ floatText("tempting, but not this one", hit.x, hit.y-55, COLORS.gold); current.workerLine = "ليمون نعناع؟ والله قوي… بس مش ده."; return; }
    if(current.selected.includes(hit.name)){ floatText("already in", hit.x, hit.y-55, COLORS.teal); return; }
    if(current.recipe.includes(hit.name)){
      current.selected.push(hit.name); current.workerLine = workerLine(); floatText(labelFruit(hit.name), hit.x, hit.y-55, COLORS.green); burst(hit.x, hit.y, 8);
      if(current.selected.length === current.recipe.length){ current.phase="ratio"; setHint("Stop the marker inside the sweet spot."); }
    } else fail("wrong fruit");
  } else if(current.phase === "ratio") {
    const sweet = current.ratioMarker > .42 && current.ratioMarker < .62;
    if(sweet){ current.phase="spot"; setHint("Claim the calm shade when the walkway clears."); burst(W/2,325,16); }
    else { current.ratioTries--; current.workerLine = "أنا قلتلكم النسبة حساسة."; shake(); if(current.ratioTries<=0) fail("off ratio"); }
  } else if(current.phase === "spot"){
    const s = current.spots.find(s=>inside(p,s)); if(!s) return;
    if(!s.good){ fail(s.label); return; }
    if(spotBlocked()){ fail("wait for the walkway"); return; }
    win("The order survived, the shade stayed empty, and Lemon Mint can wait for next time.");
  }
}
function updateJuice(dt){
  current.timer -= dt;
  if(current.phase === "pick"){
    current.workerTimer -= dt;
    if(current.workerTimer <= 0){ current.workerLine = workerLine(); current.workerTimer = 2.8 + Math.random()*2; }
    setStatus(`ORDER ${current.selected.length}/4\n${heartText(current.hearts)}`);
    if(current.timer <= 0) fail("ice melted");
  }
  if(current.phase === "ratio"){
    current.ratioMarker += current.ratioDir * dt * .8;
    if(current.ratioMarker < 0 || current.ratioMarker > 1){ current.ratioDir *= -1; current.ratioMarker = clamp(current.ratioMarker,0,1); }
    setStatus(`نسبة ${current.ratioTries} tries\n${heartText(current.hearts)}`);
  }
  if(current.phase === "spot"){
    current.spotTimer -= dt;
    setStatus(`${spotBlocked()?"WAIT":"CLEAR"}\n${heartText(current.hearts)}`);
    if(current.spotTimer <= 0) fail("spot taken");
  }
}
function workerLine(){ return ["رمان صح؟ الباقي easy.","أنا فاكرها… تقريبًا.","لا تثقوا في ذاكرتكم أكثر مني.","رمان موجود، خلاص نص الشغل خلص.","البرتقال كان ولا ليمون؟ عادي بنزبطها."][Math.floor(Math.random()*5)]; }
function spotBlocked(){ const x = 712 + Math.sin(time*1.7)*110; return Math.abs(x-710)<55; }
function drawJuice(){
  drawBeachBg(); drawJuiceShop();
  if(current.phase === "pick") { drawIngredients(); drawDrinkCup(); }
  if(current.phase === "ratio") drawRatio();
  if(current.phase === "spot") { drawBeachSpots(); drawCrowd(); drawImageMaybe(assets.chairs,690,325,92,54); }
  drawHearts(W-150,28,current.hearts); drawFloating(); drawBursts();
}
function drawBeachBg(){
  const sky=ctx.createLinearGradient(0,0,0,270); sky.addColorStop(0,"#17345f"); sky.addColorStop(.55,"#db6d50"); sky.addColorStop(1,"#f4b067"); ctx.fillStyle=sky; ctx.fillRect(0,0,W,270);
  circle(815,80,38,COLORS.gold); ctx.fillStyle="#1292ad"; ctx.fillRect(0,210,W,170);
  wave(230,"rgba(255,255,255,.25)"); wave(280,"rgba(255,255,255,.18)");
  ctx.fillStyle="#d8ad62"; ctx.fillRect(0,375,W,165);
  for(let i=0;i<70;i++){ctx.fillStyle="rgba(255,245,190,.18)";ctx.fillRect((i*137)%W,390+((i*59)%130),2,1)}
}
function drawJuiceShop(){
  ctx.fillStyle="#124e5f"; ctx.fillRect(54,125,395,190); ctx.fillStyle="#0d3441"; ctx.fillRect(78,160,345,138); ctx.fillStyle=COLORS.coral; ctx.fillRect(54,125,395,22);
  ctx.fillStyle="#7d1f3a"; ctx.fillRect(105,230,275,50); ctx.strokeStyle=COLORS.gold; ctx.strokeRect(105,230,275,50); drawImageMaybe(assets.juiceLogo,118,236,248,38);
  drawImageMaybe(assets.egyptian,380,195,100,136); bubble(472,78,current.workerLine,270);
}
function drawIngredients(){
  current.ingredients.forEach(i=>{ const picked=current.selected.includes(i.name); ctx.fillStyle=picked?"rgba(124,255,155,.2)":"rgba(8,7,18,.58)"; ctx.fillRect(i.x-42,i.y-38,84,76); ctx.strokeStyle=picked?COLORS.green:i.bonus?COLORS.gold:"rgba(255,241,214,.32)"; ctx.lineWidth= picked?3:2; ctx.strokeRect(i.x-42,i.y-38,84,76); drawFruit(i.name,i.x,i.y-4); ctx.fillStyle=picked?COLORS.green:COLORS.cream; ctx.font="bold 10px Trebuchet MS"; center(labelFruit(i.name),i.x,i.y+31); });
}
function drawDrinkCup(){
  panel(510,150,330,116,"نسبة وتناسب");
  current.recipe.forEach((name,idx)=>{ const on=current.selected.includes(name); ctx.fillStyle=on?fruitColors[name]:"rgba(255,241,214,.16)"; ctx.fillRect(536+idx*70,196,52,35); ctx.strokeStyle="rgba(255,241,214,.32)"; ctx.strokeRect(536+idx*70,196,52,35); ctx.fillStyle=COLORS.cream; ctx.font="bold 9px Trebuchet MS"; center(on?labelFruit(name):"?",562+idx*70,254); });
}
function drawRatio(){
  drawDrinkCup(); panel(310,330,340,110,"نسبة وتناسب"); ctx.fillStyle="rgba(0,0,0,.45)"; ctx.fillRect(350,385,260,20); ctx.fillStyle="rgba(124,255,155,.8)"; ctx.fillRect(350+260*.42,385,260*.20,20); ctx.fillStyle=COLORS.gold; ctx.fillRect(350+260*current.ratioMarker-5,378,10,34); ctx.fillStyle=COLORS.cream; ctx.font="bold 13px Trebuchet MS"; center("click/tap when balanced",480,430);
}
function drawBeachSpots(){
  current.spots.forEach(s=>{ const blocked=s.good&&spotBlocked(); ctx.fillStyle=s.good?(blocked?"rgba(255,90,109,.24)":"rgba(248,207,104,.34)"):"rgba(255,255,255,.11)"; ctx.fillRect(s.x,s.y,s.w,s.h); ctx.strokeStyle=s.good?(blocked?COLORS.danger:COLORS.gold):"rgba(255,241,214,.25)"; ctx.lineWidth=3; ctx.strokeRect(s.x,s.y,s.w,s.h); ctx.fillStyle=COLORS.cream; ctx.font="bold 10px Trebuchet MS"; center(s.good?(blocked?"WAIT":"CLAIM"):s.label.toUpperCase(),s.x+s.w/2,s.y+s.h-12); });
}
function drawCrowd(){ const cx=712+Math.sin(time*1.7)*110, cy=340; for(let i=0;i<3;i++){person(cx+i*20-20,cy,i===1?COLORS.teal:COLORS.rose)} dashed(600,342,875,342); }

/* LEVEL 2 */
function setupMountain(){
  gameTitle.textContent = "the parked promise";
  setHint("Park Jojo, set the spot, keep it together.");
  current = { level:2, phase:"park", hearts:3, vibe:100, timer:35, car:{x:120,y:405}, target:{x:252,y:405}, wind:7,
    setup:["chairs","drinks","fries","steak","digicam","cards"], step:0, unstable:null,
    items:[box("chairs",180,345,100,58),box("drinks",312,352,82,55),box("fries",430,352,82,55),box("steak",548,352,88,55),box("digicam",670,350,96,58),box("cards",805,352,82,55)],
    photo:{marker:0,dir:1,tries:2}, cards:makeCards(), open:[], lock:false
  };
}
function box(id,x,y,w,h){return{id,x,y,w,h,done:false,shake:0}}
function makeCards(){ const labs=shuffle(["Q♥","K♠","fries","fries","steak","steak","cam","cam","RAV4","Jojo","RAV4","Jojo"]); return labs.map((label,i)=>({label,i,open:false,matched:false,x:275+(i%4)*104,y:250+Math.floor(i/4)*76,w:72,h:56})); }
function mountainPointer(p){
  if(current.phase==="park"){
    if(dist(p.x,p.y,current.car.x,current.car.y)<90) current.car.x += 42;
    if(Math.abs(current.car.x-current.target.x)<18){ current.phase="setup"; setHint("Place the tiny setup in the right order."); burst(230,370,18); }
  } else if(current.phase==="setup"){
    if(current.unstable && inside(p,current.unstable)){ current.unstable=null; current.vibe=Math.min(100,current.vibe+8); floatText("saved",p.x,p.y-25,COLORS.green); return; }
    const hit=current.items.find(i=>inside(p,i)); if(!hit) return;
    const expected=current.setup[current.step];
    if(hit.id===expected){ hit.done=true; current.step++; floatText(vibeLine(hit.id), hit.x+hit.w/2, hit.y-10, COLORS.gold); if(current.step>=current.setup.length){ current.phase="photo"; setHint("Frame the mountain with the digicam."); } }
    else { current.vibe-=12; shake(); floatText("not yet", hit.x+hit.w/2, hit.y-10, COLORS.danger); if(current.vibe<=0) fail("vibe dropped"); }
  } else if(current.phase==="photo"){
    const ok=current.photo.marker>.44&&current.photo.marker<.58; if(ok){ current.phase="cards"; setHint("Find the couple pair: Q♥ + K♠."); burst(W/2,H/2,16); } else { current.photo.tries--; shake(); if(current.photo.tries<=0) fail("blurry photo"); }
  } else if(current.phase==="cards"){
    const c=current.cards.find(c=>inside(p,c)&&!c.open&&!c.matched); if(c) openCard(c);
  }
}
function openCard(c){ if(current.lock||current.open.length>=2) return; c.open=true; current.open.push(c); if(current.open.length<2) return; current.lock=true; const [a,b]=current.open; setTimeout(()=>{ if(currentLevel!==2||!current)return; const couple=(a.label==="Q♥"&&b.label==="K♠")||(a.label==="K♠"&&b.label==="Q♥"); if(a.label===b.label||couple){ a.matched=b.matched=true; burst((a.x+b.x)/2,(a.y+b.y)/2,10); if(couple) win("Jojo stayed parked, the mountain held still, and the cards understood the assignment."); } else { a.open=b.open=false; current.vibe-=8; shake(); } current.open=[]; current.lock=false; },520); }
function updateMountain(dt){
  if(current.phase==="park") setStatus(`PARK JOJO\n${heartText(current.hearts)}`);
  if(current.phase==="setup"){
    current.timer-=dt; current.wind-=dt; setStatus(`SETUP ${current.step}/6\nVIBE ${Math.ceil(current.vibe)}`);
    if(current.wind<=0&&!current.unstable){ const doneItems=current.items.filter(i=>i.done); if(doneItems.length){ current.unstable=doneItems[Math.floor(Math.random()*doneItems.length)]; current.unstable.shake=1.2; setHint("Wind. Tap the shaky item."); } current.wind=6+Math.random()*4; }
    if(current.unstable){ current.unstable.shake-=dt; if(current.unstable.shake<=0){ current.vibe-=10; current.unstable=null; shake(); } }
    if(current.timer<=0) fail("sunset rushed it");
  }
  if(current.phase==="photo"){ current.photo.marker+=current.photo.dir*dt*.7; if(current.photo.marker<0||current.photo.marker>1){current.photo.dir*=-1; current.photo.marker=clamp(current.photo.marker,0,1)} setStatus(`DIGICAM ${current.photo.tries}\n${heartText(current.hearts)}`); }
  if(current.phase==="cards") setStatus(`CARDS\nVIBE ${Math.ceil(current.vibe)}`);
}
function drawMountain(){
  drawImageCover(assets.mountain,0,0,W,H,()=>drawMountainFallback()); ctx.fillStyle="rgba(8,7,18,.22)"; ctx.fillRect(0,0,W,H);
  drawCars(); if(current.phase!=="park") drawSetupBase(); if(current.phase==="setup") drawSetupItems(); if(current.phase==="photo") drawPhotoFrame(); if(current.phase==="cards") drawCardGame(); drawHearts(W-150,28,current.hearts); drawFloating(); drawBursts();
}
function drawCars(){ drawImageMaybe(assets.rav4,235,392,100,58,()=>car(285,420,"RAV4","#fff")); drawImageMaybe(assets.jojo,current.car.x,current.car.y-28,86,56,()=>car(current.car.x+42,current.car.y,"Jojo","#777")); if(current.phase!=="park"){ drawPixelHeart(275,365,COLORS.rose,.7+Math.sin(time*5)*.1); } }
function drawSetupBase(){ ctx.fillStyle="rgba(8,7,18,.36)"; ctx.fillRect(0,430,W,110); ctx.fillStyle="#803a44"; ctx.fillRect(250,292,460,190); ctx.strokeStyle=COLORS.gold; ctx.lineWidth=3; ctx.strokeRect(250,292,460,190); }
function drawSetupItems(){ current.items.forEach(it=>{ const exp=it.id===current.setup[current.step], bad=current.unstable===it; const wob=bad?Math.sin(time*35)*4:0; ctx.save(); ctx.translate(wob,0); ctx.fillStyle=it.done?"rgba(124,255,155,.18)":exp?"rgba(248,207,104,.22)":"rgba(8,7,18,.5)"; ctx.fillRect(it.x,it.y,it.w,it.h); ctx.strokeStyle=bad?COLORS.danger:it.done?COLORS.green:exp?COLORS.gold:"rgba(255,241,214,.28)"; ctx.lineWidth=3; ctx.strokeRect(it.x,it.y,it.w,it.h); drawIcon(it.id,it.x+it.w/2,it.y+25); ctx.fillStyle=COLORS.cream; ctx.font="bold 10px Trebuchet MS"; center(it.done?"DONE":it.id.toUpperCase(),it.x+it.w/2,it.y+it.h-8); ctx.restore(); }); }
function drawPhotoFrame(){ drawSetupBase(); drawIcon("digicam",470,372); panel(290,96,380,110,"DIGICAM"); ctx.strokeStyle="rgba(255,241,214,.85)"; ctx.lineWidth=5; ctx.strokeRect(330,128,300,135); ctx.fillStyle="rgba(0,0,0,.45)"; ctx.fillRect(350,310,260,18); ctx.fillStyle="rgba(124,255,155,.8)"; ctx.fillRect(350+260*.44,310,260*.14,18); ctx.fillStyle=COLORS.gold; ctx.fillRect(350+260*current.photo.marker-4,302,8,34); ctx.fillStyle=COLORS.cream; ctx.font="bold 13px Trebuchet MS"; center("tap when the view feels right",480,360); }
function drawCardGame(){ drawSetupBase(); current.cards.forEach(c=>{ const face=c.open||c.matched; ctx.fillStyle=face?COLORS.cream:"#3b1d39"; ctx.fillRect(c.x,c.y,c.w,c.h); ctx.strokeStyle=c.matched?COLORS.green:COLORS.gold; ctx.lineWidth=2; ctx.strokeRect(c.x,c.y,c.w,c.h); ctx.fillStyle=face?COLORS.plum:COLORS.gold; ctx.font="bold 18px Trebuchet MS"; center(face?c.label:"?",c.x+c.w/2,c.y+34); }); }
function vibeLine(id){ return {chairs:"our spot",drinks:"cold enough",fries:"important",steak:"steaks got higher",digicam:"evidence",cards:"couple pair"}[id]||"done"; }

/* LEVEL 3 */
function setupCruise(){
  gameTitle.textContent = "quiet evidence";
  setHint("Take moments quietly. Don’t get seen. Press E/Space or tap the camera.");
  current = { level:3, hearts:3, player:{x:120,y:440,r:18}, target:null, guard:{x:840,y:390,dir:-1}, alert:0, boost:100, timer:88, cameraCooldown:0,
    moments:[{x:230,y:370,t:"wave"},{x:350,y:468,t:"blur"},{x:510,y:390,t:"smile"},{x:640,y:474,t:"almost"},{x:790,y:425,t:"reflection"},{x:875,y:360,t:"secret"}].map(m=>({...m,done:false})), wake:[] };
}
function cruisePointer(p){ current.target={x:p.x,y:p.y}; if(dist(p.x,p.y,72,470)<55) attemptPhoto(); }
function attemptPhoto(){ if(currentLevel!==3||done||!current||current.cameraCooldown>0) return; current.cameraCooldown=.8; const hit=current.moments.find(m=>!m.done&&dist(current.player.x,current.player.y,m.x,m.y)<54); if(hit && !inLight(current.player.x,current.player.y)){ hit.done=true; current.alert=Math.max(0,current.alert-18); floatText(photoLine(hit.t),hit.x,hit.y-28,COLORS.gold); burst(hit.x,hit.y,14); } else { current.alert=Math.min(100,current.alert+16); floatText("bad frame",current.player.x,current.player.y-40,COLORS.danger); shake(); } }
function updateCruise(dt){
  current.timer-=dt; current.cameraCooldown=Math.max(0,current.cameraCooldown-dt); moveCruise(dt); moveGuard(dt); updateAlert(dt); current.wake.forEach(w=>w.age+=dt); current.wake=current.wake.filter(w=>w.age<.9);
  const saved=current.moments.filter(m=>m.done).length; setStatus(`PHOTOS ${saved}/6\n${heartText(current.hearts)}`); if(saved>=current.moments.length) win("The patrol missed it, but the digicam kept every tiny proof."); if(current.timer<=0) fail("cruise drifted away");
}
function moveCruise(dt){ let dx=0,dy=0; if(keys.has("a")||keys.has("arrowleft"))dx--; if(keys.has("d")||keys.has("arrowright"))dx++; if(keys.has("w")||keys.has("arrowup"))dy--; if(keys.has("s")||keys.has("arrowdown"))dy++; if(dx===0&&dy===0&&current.target){dx=current.target.x-current.player.x;dy=current.target.y-current.player.y;if(Math.hypot(dx,dy)<8){current.target=null;dx=dy=0}} const len=Math.hypot(dx,dy)||1; const boosting=(keys.has("shift")&&current.boost>0&&(dx||dy)); const speed=boosting?205:128; if(dx||dy){current.player.x+=(dx/len)*speed*dt;current.player.y+=(dy/len)*speed*dt;current.wake.push({x:current.player.x-22,y:current.player.y+18,age:0});} current.boost=clamp(current.boost+(boosting?-38:18)*dt,0,100); current.player.x=clamp(current.player.x,54,906); current.player.y=clamp(current.player.y,338,508); }
function moveGuard(dt){ const g=current.guard; const chase=current.alert>55; if(chase){g.x+=Math.sign(current.player.x-g.x)*75*dt;g.y+=Math.sign(current.player.y-g.y)*45*dt}else{g.x+=g.dir*(70+current.moments.filter(m=>m.done).length*7)*dt;g.y+=Math.sin(time*1.4)*18*dt;if(g.x<540)g.dir=1;if(g.x>890)g.dir=-1} g.x=clamp(g.x,515,905);g.y=clamp(g.y,345,490); }
function updateAlert(dt){ const seen=inLight(current.player.x,current.player.y); if(seen){current.alert+=38*dt; setHint("Spotlight. Break line of sight.");} else current.alert-=28*dt; current.alert=clamp(current.alert,0,100); if(current.alert>=100){ current.hearts--; current.alert=15; current.player.x=120; current.player.y=440; current.target=null; shake(); if(current.hearts<=0) resetCurrent(); } }
function light(){ const g=current.guard; const base=Math.PI+Math.sin(time*1.25)*.62; const follow=clamp(current.alert/100,0,.75); const playerA=Math.atan2(current.player.y-g.y,current.player.x-g.x); return {x:g.x-14,y:g.y+4,angle:lerpAngle(base,playerA,follow),range:255,width:.42}; }
function inLight(x,y){ const l=light(); const dx=x-l.x,dy=y-l.y,r=Math.hypot(dx,dy); if(r>l.range||r<18) return false; return Math.abs(angleDiff(Math.atan2(dy,dx),l.angle))<l.width; }
function drawCruise(){
  drawImageCover(assets.cruise,0,0,W,H,()=>drawCruiseFallback()); ctx.fillStyle="rgba(3,10,28,.34)"; ctx.fillRect(0,0,W,H); drawWater(); drawPhotoMoments(); drawSpotlight(); drawWake(); drawCoupleBoat(); drawGuard(); drawCameraButton(); panel(26,24,245,122,"DIGICAM"); drawBar(52,74,150,14,current.moments.filter(m=>m.done).length/current.moments.length,COLORS.teal,"PHOTOS"); drawBar(52,106,150,14,current.alert/100,current.alert>65?COLORS.danger:COLORS.gold,"ALERT"); drawBar(52,138,150,14,current.boost/100,COLORS.coral,"BOOST"); drawHearts(W-150,28,current.hearts); drawFloating(); drawBursts();
}
function drawWater(){ for(let i=0;i<7;i++) wave(330+i*30,`rgba(126,215,230,${.18-i*.015})`); }
function drawPhotoMoments(){ current.moments.forEach((m,i)=>{ if(m.done) return; ctx.strokeStyle="rgba(248,207,104,.5)"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(m.x,m.y,26+Math.sin(time*3+i)*3,0,Math.PI*2); ctx.stroke(); drawIcon("digicam",m.x,m.y); }); }
function drawSpotlight(){ const l=light(); ctx.save(); ctx.translate(l.x,l.y); ctx.rotate(l.angle); const grd=ctx.createLinearGradient(0,0,l.range,0); grd.addColorStop(0,"rgba(255,240,150,.32)"); grd.addColorStop(.75,"rgba(255,240,150,.12)"); grd.addColorStop(1,"rgba(255,240,150,0)"); ctx.fillStyle=grd; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(l.range,Math.tan(l.width)*l.range); ctx.lineTo(l.range,-Math.tan(l.width)*l.range); ctx.closePath(); ctx.fill(); ctx.restore(); }
function drawWake(){ current.wake.forEach(w=>{ctx.strokeStyle=`rgba(255,255,255,${(1-w.age/.9)*.4})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(w.x,w.y,10+w.age*22,.2,Math.PI-.2);ctx.stroke();}); }
function drawCoupleBoat(){ const p=current.player; ctx.fillStyle="#f6f1e8"; ctx.fillRect(p.x-28,p.y-8,56,22); ctx.fillStyle=COLORS.teal; ctx.fillRect(p.x-33,p.y+12,66,6); ctx.fillStyle=COLORS.coral; ctx.fillRect(p.x-14,p.y-24,12,20); ctx.fillStyle=COLORS.sky; ctx.fillRect(p.x+4,p.y-24,12,20); ctx.fillStyle=COLORS.cream; ctx.fillRect(p.x-14,p.y-35,11,11); ctx.fillRect(p.x+5,p.y-35,11,11); drawPixelHeart(p.x-7,p.y-48,COLORS.rose,.5); }
function drawGuard(){ const g=current.guard; drawImageMaybe(assets.coast,g.x-36,g.y-36,72,72,()=>{ctx.fillStyle="#eff6fb";ctx.fillRect(g.x-34,g.y-8,68,24);ctx.fillStyle="#0f3654";ctx.fillRect(g.x-22,g.y-29,40,23);ctx.fillStyle=COLORS.danger;ctx.fillRect(g.x-39,g.y+15,78,6);}); }
function drawCameraButton(){ ctx.fillStyle=current.cameraCooldown>0?"rgba(255,255,255,.2)":"rgba(248,207,104,.9)"; ctx.beginPath(); ctx.arc(72,470,38,0,Math.PI*2); ctx.fill(); drawIcon("digicam",72,470); }
function photoLine(t){ return {wave:"the wave kept still",blur:"blurry but cute",smile:"caught it",almost:"almost",reflection:"tiny reflection",secret:"saved quietly"}[t]; }

/* LOOP */
function startLoop(){ last=performance.now(); const loop=(now)=>{ const dt=Math.min((now-last)/1000,.05); last=now; time+=dt; updateShared(dt); if(!done){ if(currentLevel===1) updateJuice(dt); if(currentLevel===2) updateMountain(dt); if(currentLevel===3) updateCruise(dt); } draw(); raf=requestAnimationFrame(loop); }; loop(last); }
function stopLoop(){ if(raf) cancelAnimationFrame(raf); raf=null; }
function updateShared(dt){ floating.forEach(f=>f.age+=dt); floating=floating.filter(f=>f.age<1.2); hearts.forEach(h=>{h.age+=dt; h.x+=h.vx*dt; h.y+=h.vy*dt;}); hearts=hearts.filter(h=>h.age<.9); }
function draw(){ ctx.clearRect(0,0,W,H); ctx.imageSmoothingEnabled=false; if(currentLevel===1) drawJuice(); if(currentLevel===2) drawMountain(); if(currentLevel===3) drawCruise(); }
function handlePointer(p){ if(done) return; if(currentLevel===1) juicePointer(p); if(currentLevel===2) mountainPointer(p); if(currentLevel===3) cruisePointer(p); }

/* HELPERS */
function point(e){ const r=canvas.getBoundingClientRect(); return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}; }
function clamp(n,a,b){ return Math.max(a,Math.min(b,n)); }
function dist(x1,y1,x2,y2){ return Math.hypot(x1-x2,y1-y2); }
function inside(p,r){ return p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h; }
function center(t,x,y){ ctx.textAlign="center"; ctx.fillText(t,x,y); ctx.textAlign="left"; }
function circle(x,y,r,c){ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); }
function panel(x,y,w,h,title){ ctx.fillStyle="rgba(8,7,18,.72)";ctx.fillRect(x,y,w,h);ctx.strokeStyle="rgba(248,207,104,.38)";ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);ctx.fillStyle=COLORS.gold;ctx.font="bold 12px Trebuchet MS";ctx.fillText(title,x+16,y+28); }
function drawBar(x,y,w,h,v,c,label){ v=clamp(v,0,1); ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(x,y,w,h);ctx.fillStyle=c;ctx.fillRect(x,y,w*v,h);ctx.strokeStyle="rgba(255,241,214,.36)";ctx.strokeRect(x,y,w,h);ctx.fillStyle=COLORS.cream;ctx.font="bold 10px Trebuchet MS";ctx.fillText(label,x+w+10,y+h-2); }
function drawHearts(x,y,n){ ctx.fillStyle="rgba(8,7,18,.66)";ctx.fillRect(x,y,112,34);ctx.strokeStyle="rgba(255,241,214,.28)";ctx.strokeRect(x,y,112,34); for(let i=0;i<3;i++) drawPixelHeart(x+15+i*32,y+8,i<n?COLORS.rose:"rgba(255,241,214,.22)",.7); }
function heartText(n){ return "♥".repeat(n)+"♡".repeat(3-n); }
function drawPixelHeart(x,y,c,s=1){ ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.fillStyle=c; [[4,0],[12,0],[0,4],[4,4],[8,4],[12,4],[16,4],[0,8],[4,8],[8,8],[12,8],[16,8],[4,12],[8,12],[12,12],[8,16]].forEach(([a,b])=>ctx.fillRect(a,b,4,4)); ctx.restore(); }
function drawImageMaybe(a,x,y,w,h,fallback){ if(a.ready) ctx.drawImage(a.img,x,y,w,h); else if(fallback) fallback(); }
function drawImageCover(a,x,y,w,h,fallback){ if(!a.ready){ if(fallback) fallback(); return; } const img=a.img, sc=Math.max(w/img.naturalWidth,h/img.naturalHeight), sw=w/sc, sh=h/sc; ctx.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,x,y,w,h); }
function bubble(x,y,t,w=250){ ctx.fillStyle="rgba(255,241,214,.94)"; ctx.fillRect(x,y,w,58); ctx.strokeStyle=COLORS.plum;ctx.lineWidth=2;ctx.strokeRect(x,y,w,58); ctx.fillStyle=COLORS.plum;ctx.font="bold 17px Trebuchet MS";center(t,x+w/2,y+36); }
function wave(y,c){ ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<=W;x+=8){const yy=y+Math.sin(x*.024+time*1.8)*6;if(x===0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy)}ctx.stroke(); }
function dashed(x1,y1,x2,y2){ ctx.strokeStyle="rgba(255,241,214,.28)"; ctx.setLineDash([8,8]); ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke(); ctx.setLineDash([]); }
function person(x,y,c){ctx.fillStyle=c;ctx.fillRect(x-6,y-18,12,22);ctx.fillStyle=COLORS.cream;ctx.fillRect(x-5,y-30,10,10)}
function car(x,y,label,c){ ctx.fillStyle=c;ctx.fillRect(x-42,y-20,84,28);ctx.fillStyle="#111";ctx.fillRect(x-25,y+4,16,16);ctx.fillRect(x+18,y+4,16,16);ctx.fillStyle=COLORS.gold;ctx.font="bold 9px Trebuchet MS";center(label,x,y-26); }
function drawFruit(n,x,y){ const c=fruitColors[n]||COLORS.gold; if(n==="lemonMint"){circle(x-8,y,18,"#f8df55");circle(x+12,y-2,16,"#3cb371");} else {circle(x,y,22,c);ctx.fillStyle="rgba(255,255,255,.22)";ctx.fillRect(x-10,y-12,10,8);} }
function labelFruit(n){ return {pomegranate:"Pomegranate",orange:"Orange",grape:"Grape",berry:"Berry",lemonMint:"Lemon Mint",mango:"Mango",peach:"Peach",watermelon:"Watermelon",apple:"Apple"}[n]||n; }
function drawIcon(id,x,y){ if(id==="chairs"){drawImageMaybe(assets.chairs,x-35,y-20,70,40,()=>{ctx.fillStyle="#333";ctx.fillRect(x-28,y-12,24,28);ctx.fillStyle="#aaa";ctx.fillRect(x+5,y-12,24,28);});return;} if(id==="digicam"){drawImageMaybe(assets.digicam,x-24,y-18,48,36,()=>{ctx.fillStyle="#1b1f2a";ctx.fillRect(x-24,y-14,48,28);ctx.fillStyle=COLORS.sky;ctx.fillRect(x-5,y-6,14,14);ctx.fillStyle="#343a4c";ctx.fillRect(x-18,y-21,16,7);});return;} if(id==="fries"){ctx.fillStyle=COLORS.rose;ctx.fillRect(x-14,y,y+0?28:28,26);ctx.fillStyle=COLORS.gold;for(let i=0;i<5;i++)ctx.fillRect(x-11+i*5,y-16+(i%2)*3,4,24);return;} if(id==="steak"){ctx.fillStyle="#6d2c35";ctx.beginPath();ctx.ellipse(x,y,30,18,-.18,0,Math.PI*2);ctx.fill();ctx.strokeStyle=COLORS.coral;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+7,y,12,.5,2.7);ctx.stroke();return;} if(id==="drinks"){ctx.fillStyle=COLORS.teal;ctx.fillRect(x-20,y-18,16,34);ctx.fillStyle=COLORS.coral;ctx.fillRect(x+5,y-18,16,34);return;} if(id==="cards"){ctx.fillStyle=COLORS.cream;ctx.fillRect(x-22,y-18,24,32);ctx.fillRect(x,y-24,24,32);ctx.strokeStyle=COLORS.plum;ctx.strokeRect(x-22,y-18,24,32);ctx.strokeRect(x,y-24,24,32);return;} }
function drawMountainFallback(){ const sky=ctx.createLinearGradient(0,0,0,430);sky.addColorStop(0,"#132942");sky.addColorStop(.65,"#9a6d69");sky.addColorStop(1,"#d4a46b");ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);ctx.fillStyle="#23334d";tri(80,430,500,75,850,430);ctx.fillStyle="#31405a";tri(0,430,220,130,430,430);ctx.fillStyle="#2f5b49";ctx.fillRect(0,408,W,132); }
function drawCruiseFallback(){ const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#03051d");g.addColorStop(.58,"#12285a");g.addColorStop(1,"#071a31");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);circle(805,62,30,COLORS.cream);ctx.fillStyle="#0d5a78";ctx.fillRect(0,318,W,222); }
function tri(a,b,c,d,e,f){ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.lineTo(e,f);ctx.closePath();ctx.fill();}
function floatText(t,x,y,c){ floating.push({t,x,y,c,age:0}); }
function drawFloating(){ floating.forEach(f=>{ctx.globalAlpha=1-f.age/1.2;ctx.fillStyle=f.c;ctx.font="bold 14px Trebuchet MS";center(f.t,f.x,f.y-f.age*24);ctx.globalAlpha=1;}); }
function burst(x,y,n){ for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2; hearts.push({x,y,vx:Math.cos(a)*(40+Math.random()*80),vy:Math.sin(a)*(40+Math.random()*80)-30,age:0}); } }
function drawBursts(){ hearts.forEach(h=>{ctx.globalAlpha=1-h.age/.9;drawPixelHeart(h.x,h.y,COLORS.rose,.35);ctx.globalAlpha=1;}); }
function shuffle(a){ return [...a].sort(()=>Math.random()-.5); }
function angleDiff(a,b){ return Math.atan2(Math.sin(a-b),Math.cos(a-b)); }
function lerpAngle(a,b,t){ return a+angleDiff(b,a)*t; }
