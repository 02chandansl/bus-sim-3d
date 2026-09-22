const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const passengersEl = document.getElementById('passengers');
const fuelEl = document.getElementById('fuel');
const timeEl = document.getElementById('time');
const W = canvas.width;
const H = canvas.height;
const ROAD_TOP = 90;
const ROAD_BOTTOM = H - 20;
const stops = [
  { name: 'Central', x: 0, z: 300, board: 5, drop: 3 },
  { name: 'Old Market', x: -1.2, z: 490, board: 4, drop: 2 },
  { name: 'Rivergate', x: 1.2, z: 680, board: 6, drop: 4 },
  { name: 'Harbor', x: .2, z: 870, board: 3, drop: 5 },
  { name: 'Museum', x: -.8, z: 1060, board: 7, drop: 3 },
  { name: 'Station East', x: 1.3, z: 1250, board: 8, drop: 2 }
];
const input = { left: false, right: false, accel: false, brake: false };
const state = { progress: 0, busX: 0, targetX: 0, speed: 0, fuel: 100, score: 0, passengers: 0, capacity: 12, time: 0, stop: 0, stopped: false, complete: false, gameOver: false };
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function formatTime(s) { return `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`; }
function hud() { scoreEl.textContent = Math.round(state.score); passengersEl.textContent = `${state.passengers}/${state.capacity}`; fuelEl.textContent = `${Math.max(0, Math.round(state.fuel))}%`; timeEl.textContent = formatTime(state.time); }
function controls() {
  if (state.gameOver) return;
  if (input.left) state.targetX -= .9;
  if (input.right) state.targetX += .9;
  if (input.accel) state.speed += .22;
  if (input.brake) state.speed -= .45;
  state.targetX = clamp(state.targetX, -2.8, 2.8);
  state.speed = clamp(state.speed, 0, 28);
  state.busX += (state.targetX - state.busX) * .08;
  state.progress += state.speed * .65;
  state.time += 1 / 60;
  state.fuel -= .03 + state.speed * .008;
  if (state.fuel <= 0) { state.fuel = 0; state.speed *= .85; state.gameOver = true; }
}
function serviceStops() {
  const stop = stops[state.stop];
  if (!stop) { state.complete = state.progress > 1400; return; }
  if (Math.abs(state.progress - stop.z) < 26 && !state.stopped) {
    state.stopped = true;
    const boarding = Math.min(stop.board, state.capacity - state.passengers);
    stop.board -= boarding; state.passengers += boarding; state.score += boarding * 18;
    const drop = Math.min(stop.drop, state.passengers);
    stop.drop -= drop; state.passengers -= drop; state.score += drop * 25;
    if (stop.board + stop.drop === 0) { state.stop++; state.stopped = false; }
  }
  if (state.progress > stop.z + 90) state.stopped = false;
}
function cloud(x, y, w, h) { ctx.beginPath(); ctx.arc(x, y, h, 0, Math.PI * 2); ctx.arc(x + w * .4, y - 10, h * .9, 0, Math.PI * 2); ctx.arc(x + w * .8, y, h * .85, 0, Math.PI * 2); ctx.fill(); }
function background() {
  ctx.fillStyle = '#9ad4ff'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#98d0f5'; ctx.fillRect(0, 0, W, ROAD_TOP + 30);
  for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(255,255,255,.6)'; cloud((i * 170 + state.progress * .3 % 220) - 40, 80 + i % 2 * 18, 32, 18); }
  ctx.fillStyle = '#3d5c73'; ctx.fillRect(0, ROAD_TOP + 20, W, H - ROAD_TOP - 10);
  for (let i = 0; i < 10; i++) { const width = 26 + i % 4 * 24; const height = 40 + i * 17 % 90; const x = i * 104 + state.progress * .5 % 90 - 40; ctx.fillStyle = i % 2 ? '#1a2a3d' : '#23364b'; ctx.fillRect(x, ROAD_BOTTOM - height, width, height); }
}
function road() {
  ctx.fillStyle = '#3d3d40'; ctx.beginPath(); ctx.moveTo(W/2-90, ROAD_TOP); ctx.lineTo(W/2+90, ROAD_TOP); ctx.lineTo(W/2+330, ROAD_BOTTOM); ctx.lineTo(W/2-330, ROAD_BOTTOM); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e7e7e7'; ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) { const t = i / 12, y1 = ROAD_TOP + t * (ROAD_BOTTOM - ROAD_TOP), y2 = ROAD_TOP + (t + .05) * (ROAD_BOTTOM - ROAD_TOP); const d1 = 90 + t * 240, d2 = 90 + (t + .05) * 240; ctx.beginPath(); ctx.moveTo(W/2-d1,y1); ctx.lineTo(W/2-d2,y2); ctx.moveTo(W/2+d1,y1); ctx.lineTo(W/2+d2,y2); ctx.stroke(); }
  ctx.strokeStyle = '#f6d365'; ctx.lineWidth = 4; for (let i = 0; i < 8; i++) { const t = i / 8; ctx.beginPath(); ctx.moveTo(W/2-6, ROAD_TOP+t*(ROAD_BOTTOM-ROAD_TOP)); ctx.lineTo(W/2+6, ROAD_TOP+(t+.08)*(ROAD_BOTTOM-ROAD_TOP)); ctx.stroke(); }
}
function project(x, z) { const p = 180 / (180 + z); return { x: W/2 + (x * 240 + state.busX * 130) * p, y: ROAD_TOP + (H - ROAD_TOP) * (1 - p), p }; }
function drawStop(stop) { const p = project(stop.x, stop.z - state.progress); if (p.y < ROAD_TOP - 40 || p.y > H) return; ctx.fillStyle = stop.board ? '#ffd166' : '#7ef0a4'; ctx.fillRect(p.x-10,p.y-18,20,18); ctx.fillStyle='#111827';ctx.fillRect(p.x-18,p.y+6,36,8);ctx.fillStyle='#fff';ctx.font='12px Arial';ctx.fillText(stop.name,p.x-34,p.y-26);ctx.fillText(`${stop.board} waiting`,p.x-26,p.y+20); }
function bus() { const p = project(state.busX, 0); ctx.save(); ctx.translate(p.x,p.y); ctx.fillStyle='#f4bd3d';ctx.fillRect(-42,-18,84,38);ctx.fillStyle='#1f2a44';ctx.fillRect(-12,-12,24,24);ctx.fillStyle='#d9edf7';[-34,22].forEach(x=>{ctx.fillRect(x,-12,12,12);ctx.fillRect(x,6,12,12);});ctx.fillStyle='#32373d';ctx.fillRect(-44,-6,8,14);ctx.fillRect(36,-6,8,14);ctx.restore(); }
function info() { const active = stops[state.stop]; ctx.fillStyle='rgba(7,12,20,.55)';ctx.fillRect(18,18,240,80);ctx.strokeStyle='rgba(255,255,255,.18)';ctx.strokeRect(18,18,240,80);ctx.fillStyle='#edf6ff';ctx.font='bold 16px Arial';ctx.fillText('Route stop',32,42);ctx.font='18px Arial';ctx.fillStyle='#67d6ff';ctx.fillText(active ? active.name : 'Route complete',32,68);ctx.font='14px Arial';ctx.fillStyle='#dfeefb';ctx.fillText(`Speed: ${state.speed.toFixed(1)} km/h`,32,86); }
function overlay() { if (!state.gameOver && !state.complete) return; ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(0,0,W,H);ctx.fillStyle=state.complete?'#7ef0a4':'#fff';ctx.font='bold 42px Arial';ctx.fillText(state.complete?'Route Complete!':'Route Failed',W/2-(state.complete?170:145),H/2-20);ctx.font='20px Arial';ctx.fillStyle='#fff';ctx.fillText(state.complete?`Final score: ${Math.round(state.score)}`:'Fuel depleted. Restart to try again.',W/2-150,H/2+25); }
function loop() { if (!state.gameOver && !state.complete) { controls(); serviceStops(); hud(); } ctx.clearRect(0,0,W,H); background(); road(); stops.forEach(drawStop); bus(); info(); overlay(); requestAnimationFrame(loop); }
window.addEventListener('keydown', e => { const k=e.key.toLowerCase(); if(e.key==='ArrowLeft'||k==='a')input.left=true;if(e.key==='ArrowRight'||k==='d')input.right=true;if(e.key==='ArrowUp'||k==='w')input.accel=true;if(e.key==='ArrowDown'||k==='s'||e.code==='Space')input.brake=true; });
window.addEventListener('keyup', e => { const k=e.key.toLowerCase(); if(e.key==='ArrowLeft'||k==='a')input.left=false;if(e.key==='ArrowRight'||k==='d')input.right=false;if(e.key==='ArrowUp'||k==='w')input.accel=false;if(e.key==='ArrowDown'||k==='s'||e.code==='Space')input.brake=false; });
hud(); requestAnimationFrame(loop);
