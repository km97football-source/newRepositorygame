const canvas = document.getElementById('viewport');
const ctx = canvas.getContext('2d');
const radarCanvas = document.getElementById('radar-canvas');
const radarCtx = radarCanvas.getContext('2d');
const overlay = document.getElementById('overlay');
const gameoverOverlay = document.getElementById('gameover-overlay');
const hubFloor = document.getElementById('hub-floor');
const hubTheme = document.getElementById('hub-theme');
const hubEnemies = document.getElementById('hub-enemies');
const floorLabel = document.getElementById('floor-label');
const statusText = document.getElementById('status-text');
const healthFill = document.getElementById('health-fill');
const ammoCount = document.getElementById('ammo-count');
const restartButton = document.getElementById('restart-button');
const gameoverText = document.getElementById('gameover-text');
const introOverlay = document.getElementById('intro-overlay');
const enterElevatorButton = document.getElementById('enter-elevator-button');

const MAP_SIZE = 20;
const TILE_SIZE = 120;
const worldSize = MAP_SIZE * TILE_SIZE;
const MAX_ENEMIES = 4;
const FOV = Math.PI / 3;
const RAY_COUNT = 110;
const MAX_VIEW_DISTANCE = 2200;
const AUDIO_ENABLED = true;

const themes = [
  {
    name: 'Abandoned Mall',
    wall: '#292431',
    floor: '#121214',
    ceiling: '#17181c',
    fog: 'rgba(15,20,35,0.68)',
    ambient: '#4c3b49',
    trapChance: 0.05,
    falseSignal: 0.12,
    monsterStyle: 'mall',
    accent1: '#c67cff',
    accent2: '#5cd7ff',
  },
  {
    name: 'Dark Forest',
    wall: '#121d14',
    floor: '#0b1110',
    ceiling: '#141a13',
    fog: 'rgba(6,13,11,0.72)',
    ambient: '#214138',
    trapChance: 0.12,
    falseSignal: 0.24,
    accent1: '#7bd28b',
    accent2: '#8ce6d2',
    monsterStyle: 'forest',
  },
  {
    name: 'Office Maze',
    wall: '#262c35',
    floor: '#14181e',
    ceiling: '#1f232c',
    fog: 'rgba(16,18,26,0.7)',
    ambient: '#52596f',
    trapChance: 0.08,
    falseSignal: 0.16,
    monsterStyle: 'office',
    accent1: '#f2c04d',
    accent2: '#a5c9ff',
  },
  {
    name: 'Underground Garage',
    wall: '#181920',
    floor: '#101214',
    ceiling: '#121416',
    fog: 'rgba(8,11,14,0.72)',
    ambient: '#3d4454',
    trapChance: 0.1,
    falseSignal: 0.18,
    monsterStyle: 'garage',
    accent1: '#d1a66f',
    accent2: '#4fc7b8',
  },
  {
    name: 'Sewer System',
    wall: '#101518',
    floor: '#091114',
    ceiling: '#101619',
    fog: 'rgba(8,10,12,0.74)',
    ambient: '#223944',
    trapChance: 0.14,
    falseSignal: 0.22,
    monsterStyle: 'sewer',
    accent1: '#6bc8c3',
    accent2: '#c3e477',
  },
  {
    name: 'Luxury Mansion',
    wall: '#2b1f20',
    floor: '#151014',
    ceiling: '#1f1618',
    fog: 'rgba(15,10,20,0.66)',
    ambient: '#6a3953',
    trapChance: 0.06,
    falseSignal: 0.08,
    monsterStyle: 'mansion',
    accent1: '#ffd8b2',
    accent2: '#ff93c6',
  },
];

const enemyTypes = [
  {
    id: 'watcher',
    displayName: 'Watcher',
    color: '#f7f7f8',
    size: 36,
    speed: 1.0,
    noise: 0.02,
  },
  {
    id: 'crawler',
    displayName: 'Crawler',
    color: '#dcc7c7',
    size: 28,
    speed: 1.8,
    noise: 0.04,
  },
  {
    id: 'smiler',
    displayName: 'Smiler',
    color: '#e8d4d9',
    size: 34,
    speed: 1.2,
    noise: 0.03,
  },
  {
    id: 'tall',
    displayName: 'Tall Man',
    color: '#d3d4d7',
    size: 48,
    speed: 0.85,
    noise: 0.01,
  },
  {
    id: 'static',
    displayName: 'Static Child',
    color: '#f1f1f1',
    size: 26,
    speed: 1.4,
    noise: 0.05,
  },
];

const state = {
  mode: 'intro',
  floor: 1,
  theme: themes[0],
  map: [],
  objects: [],
  traps: [],
  enemies: [],
  player: { x: TILE_SIZE * 2, y: TILE_SIZE * 10, angle: 0, health: 100, ammo: 12, reserve: 36 },
  reloadTimer: 0,
  fireTimer: 0,
  shotFlash: 0,
  noiseAlpha: 0,
  screenShake: 0,
  hubPulse: 0,
  elevatorShake: 0,
  mirrorGlitch: 0,
  lastElevatorReflection: 0,
  falseSignals: [],
};

const input = {
  forward: false,
  backward: false,
  strafeLeft: false,
  strafeRight: false,
  turnLeft: false,
  turnRight: false,
  crouch: false,
  reload: false,
  firing: false,
};

let lastTime = 0;
let audio = null;
let musicOsc = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initAudio() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audio = ctx;
  } catch (err) {
    audio = null;
  }
}

function playTone(freq, duration, type = 'sine', volume = 0.06) {
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}

function playNoise(duration, volume = 0.04) {
  if (!audio) return;
  const buffer = audio.createBuffer(1, audio.sampleRate * duration, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.25;
  }
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const gain = audio.createGain();
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(audio.destination);
  source.start();
}

function startElevatorMusic() {
  if (!audio) return;
  stopElevatorMusic();
  musicOsc = audio.createOscillator();
  const gain = audio.createGain();
  musicOsc.type = 'triangle';
  musicOsc.frequency.value = 54;
  gain.gain.value = 0.04;
  musicOsc.connect(gain);
  gain.connect(audio.destination);
  musicOsc.start();
}

function stopElevatorMusic() {
  if (musicOsc) {
    musicOsc.stop();
    musicOsc = null;
  }
}

function placeWall(x, y) {
  if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) return;
  state.map[y][x] = 1;
}

function isWall(x, y) {
  if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) return true;
  return state.map[y][x] === 1;
}

function buildMallLevel() {
  state.map = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(1));
  const hall = (x1, y1, x2, y2) => {
    for (let x = x1; x <= x2; x++) {
      for (let y = y1; y <= y2; y++) {
        state.map[y][x] = 0;
      }
    }
  };

  hall(2, 7, 17, 12);
  hall(2, 2, 17, 5);
  hall(2, 14, 17, 17);
  hall(8, 7, 11, 17);
  hall(6, 11, 13, 13);

  for (let y = 8; y <= 11; y++) {
    placeWall(8, y);
    placeWall(11, y);
  }
  for (let x = 4; x <= 15; x += 4) {
    placeWall(x, 2);
    placeWall(x, 5);
    placeWall(x, 14);
    placeWall(x, 17);
  }
  for (let y = 8; y <= 11; y += 3) {
    placeWall(4, y);
    placeWall(15, y);
  }

  state.objects = [];
  state.traps = [];
  state.falseSignals = [];

  for (let x = 3; x < MAP_SIZE - 3; x += 3) {
    for (let y = 3; y < MAP_SIZE - 3; y += 5) {
      if (!isWall(x, y) && Math.random() > 0.5) {
        state.objects.push({ x, y, size: 0.9 });
      }
    }
  }
  for (let i = 0; i < 8; i += 1) {
    const tx = 3 + Math.floor(randomRange(0, 12));
    const ty = 3 + Math.floor(randomRange(0, 12));
    if (!isWall(tx, ty)) {
      state.traps.push({ x: tx, y: ty });
    }
  }
}

function buildRandomLevel() {
  state.map = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(1));
  for (let y = 1; y < MAP_SIZE - 1; y++) {
    for (let x = 1; x < MAP_SIZE - 1; x++) {
      state.map[y][x] = Math.random() > 0.32 ? 0 : 1;
    }
  }
  for (let pass = 0; pass < 4; pass++) {
    const next = state.map.map((row) => row.slice());
    for (let y = 1; y < MAP_SIZE - 1; y++) {
      for (let x = 1; x < MAP_SIZE - 1; x++) {
        const walls = countNeighbors(x, y);
        next[y][x] = walls >= 5 ? 1 : 0;
      }
    }
    state.map = next;
  }
  carvePath(2, 10, 17, 10);
  state.objects = [];
  state.traps = [];
  state.falseSignals = [];
  for (let x = 2; x < MAP_SIZE - 2; x += 3) {
    for (let y = 2; y < MAP_SIZE - 2; y += 3) {
      if (!isWall(x, y) && Math.random() > 0.6) state.objects.push({ x, y, size: 0.8 });
    }
  }
  for (let i = 0; i < 10; i += 1) {
    const tx = 2 + Math.floor(randomRange(0, MAP_SIZE - 4));
    const ty = 2 + Math.floor(randomRange(0, MAP_SIZE - 4));
    if (!isWall(tx, ty) && Math.random() > 0.5) {
      state.traps.push({ x: tx, y: ty });
    }
  }
}

function countNeighbors(x, y) {
  let count = 0;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      if (ox === 0 && oy === 0) continue;
      if (isWall(x + ox, y + oy)) count += 1;
    }
  }
  return count;
}

function carvePath(x1, y1, x2, y2) {
  let x = x1;
  let y = y1;
  while (x !== x2 || y !== y2) {
    state.map[y][x] = 0;
    if (x < x2) x += 1;
    else if (x > x2) x -= 1;
    if (y < y2) y += 1;
    else if (y > y2) y -= 1;
  }
}

function createEnemies() {
  state.enemies = [];
  const count = clamp(state.floor, 1, MAX_ENEMIES);
  const availableTypes = enemyTypes.slice(0, Math.min(state.floor + 1, enemyTypes.length));
  for (let i = 0; i < count; i += 1) {
    const type = availableTypes[Math.floor(randomRange(0, availableTypes.length))];
    let x, y;
    do {
      x = 2 + Math.floor(randomRange(0, MAP_SIZE - 4));
      y = 2 + Math.floor(randomRange(0, MAP_SIZE - 4));
    } while (isWall(x, y) || distance({ x: x * TILE_SIZE, y: y * TILE_SIZE }, state.player) < TILE_SIZE * 4);
    state.enemies.push({
      id: type.id,
      type,
      x: x * TILE_SIZE + TILE_SIZE / 2,
      y: y * TILE_SIZE + TILE_SIZE / 2,
      dir: randomRange(0, Math.PI * 2),
      speed: type.speed + state.floor * 0.12,
      health: 1 + Math.floor(state.floor / 2),
      state: 'idle',
      timer: randomRange(0.4, 1.8),
      visible: false,
      flash: 0,
      targetX: null,
      targetY: null,
    });
  }
}

function showIntro() {
  state.mode = 'intro';
  introOverlay.classList.remove('hidden');
  overlay.classList.add('hidden');
  gameoverOverlay.classList.add('hidden');
  state.player = { ...state.player, health: clamp(state.player.health, 0, 100) };
  statusText.textContent = 'Click anywhere to enter the elevator.';
}

function showHub() {
  state.mode = 'hub';
  introOverlay.classList.add('hidden');
  overlay.classList.remove('hidden');
  gameoverOverlay.classList.add('hidden');
  state.player = { ...state.player, health: clamp(state.player.health, 0, 100) };
  state.theme = themes[(state.floor - 1) % themes.length];
  state.hubPulse = 1.0;
  state.screenShake = 0;
  state.mirrorGlitch = 0;
  hubFloor.textContent = state.floor;
  hubTheme.textContent = state.theme.name;
  hubEnemies.textContent = clamp(state.floor, 1, MAX_ENEMIES);
  statusText.textContent = 'Press ENTER to descend into the floor.';
  startElevatorMusic();
}

function startFloor() {
  state.mode = 'playing';
  overlay.classList.add('hidden');
  introOverlay.classList.add('hidden');
  stopElevatorMusic();
  state.theme = themes[(state.floor - 1) % themes.length];
  if (state.floor === 1) buildMallLevel(); else buildRandomLevel();
  state.player = { x: TILE_SIZE * 2.5, y: TILE_SIZE * 10, angle: Math.PI * 0.06, health: state.player.health, ammo: state.player.ammo, reserve: state.player.reserve };
  state.reloadTimer = 0;
  state.fireTimer = 0;
  state.shotFlash = 0;
  state.noiseAlpha = 0;
  state.mirrorGlitch = 0;
  state.player.crouch = false;
  createEnemies();
  state.falseSignals = Array.from({ length: 6 }, () => ({ x: randomRange(40, canvas.width - 40), y: randomRange(40, canvas.height - 40), alpha: randomRange(0.14, 0.28) }));
  statusText.textContent = `Floor ${state.floor} - ${state.theme.name}; use cover and radar to survive.`;
}

function finishFloor() {
  state.floor += 1;
  state.player.ammo = Math.min(state.player.ammo + 4, 12);
  state.player.reserve += 12;
  showHub();
}

function triggerGameOver(text) {
  state.mode = 'gameover';
  gameoverText.textContent = text;
  gameoverOverlay.classList.remove('hidden');
  stopElevatorMusic();
  statusText.textContent = 'You fell to the horrors of the floor.';
}

function restartRun() {
  state.mode = 'hub';
  state.floor = 1;
  state.player.health = 100;
  state.player.ammo = 12;
  state.player.reserve = 36;
  showHub();
}

function attemptReload() {
  if (state.reloadTimer > 0 || state.player.ammo >= 12 || state.player.reserve <= 0) return;
  state.reloadTimer = 1.8;
  statusText.textContent = 'Reloading...';
  playTone(240, 0.18, 'square', 0.08);
}

function shoot() {
  if (state.fireTimer > 0 || state.reloadTimer > 0 || state.player.ammo <= 0) return;
  state.player.ammo -= 1;
  state.fireTimer = 0.22;
  state.shotFlash = 1.0;
  state.noiseAlpha = 1.0;
  state.screenShake = 0.16;
  state.mirrorGlitch = 0.08;
  playTone(1100, 0.04, 'square', 0.16);
  playNoise(0.05, 0.08);

  const hit = state.enemies.some((enemy) => {
    const dx = enemy.x - state.player.x;
    const dy = enemy.y - state.player.y;
    const ang = Math.atan2(dy, dx);
    let delta = Math.abs(ang - state.player.angle);
    if (delta > Math.PI) delta = Math.abs(delta - Math.PI * 2);
    const dist = Math.hypot(dx, dy);
    if (delta < 0.18 && dist < 720) {
      enemy.health -= 1;
      enemy.flash = 1.0;
      if (enemy.health <= 0) playTone(280, 0.18, 'sawtooth', 0.1);
      return true;
    }
    return false;
  });

  if (!hit) statusText.textContent = 'Missed. The monsters are unsettled.';
}

function canMove(x, y) {
  const gx = Math.floor(x / TILE_SIZE);
  const gy = Math.floor(y / TILE_SIZE);
  return !isWall(gx, gy);
}

function updatePlayer(dt) {
  let speed = input.crouch ? 120 : 200;
  if (state.mode !== 'playing') return;

  if (input.turnLeft) state.player.angle -= dt * 1.6;
  if (input.turnRight) state.player.angle += dt * 1.6;
  let vx = 0;
  let vy = 0;
  if (input.forward) {
    vx += Math.cos(state.player.angle);
    vy += Math.sin(state.player.angle);
  }
  if (input.backward) {
    vx -= Math.cos(state.player.angle);
    vy -= Math.sin(state.player.angle);
  }

  if (input.strafeLeft) {
    vx += Math.cos(state.player.angle - Math.PI / 2);
    vy += Math.sin(state.player.angle - Math.PI / 2);
  }
  if (input.strafeRight) {
    vx += Math.cos(state.player.angle + Math.PI / 2);
    vy += Math.sin(state.player.angle + Math.PI / 2);
  }

  const mag = Math.hypot(vx, vy);
  if (mag > 0) {
    vx /= mag;
    vy /= mag;
    const nx = state.player.x + vx * speed * dt;
    const ny = state.player.y + vy * speed * dt;
    if (canMove(nx, ny)) {
      state.player.x = clamp(nx, 24, worldSize - 24);
      state.player.y = clamp(ny, 24, worldSize - 24);
    }
  }

  state.player.angle = (state.player.angle + Math.PI * 2) % (Math.PI * 2);
}

function updateEnemies(dt) {
  state.enemies.forEach((enemy) => {
    if (enemy.health <= 0) return;
    enemy.timer -= dt;
    if (enemy.flash > 0) enemy.flash = Math.max(0, enemy.flash - dt * 2.4);
    const dist = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
    const dirToPlayer = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);

    if (dist < TILE_SIZE * 1.2) {
      enemy.state = 'attack';
      if (enemy.timer <= 0) {
        enemy.timer = 0.8;
        state.player.health -= 18;
        playTone(150, 0.08, 'sawtooth', 0.1);
        statusText.textContent = 'A creature tore into you!';
      }
    } else {
      enemy.state = 'chase';
      enemy.targetX = state.player.x;
      enemy.targetY = state.player.y;
      if (enemy.timer <= 0) enemy.timer = 0.5;
    }

    if (enemy.state === 'chase' || enemy.state === 'idle') {
      const tx = enemy.targetX || enemy.x;
      const ty = enemy.targetY || enemy.y;
      const dx = tx - enemy.x;
      const dy = ty - enemy.y;
      const d = Math.hypot(dx, dy);
      if (d > 8) {
        enemy.dir = Math.atan2(dy, dx);
        const speedMult = enemy.state === 'chase' ? 1.35 : 1.0;
        const speed = enemy.speed * speedMult;
        const nx = enemy.x + Math.cos(enemy.dir) * speed * dt;
        const ny = enemy.y + Math.sin(enemy.dir) * speed * dt;
        if (canMove(nx, ny)) {
          enemy.x = nx;
          enemy.y = ny;
        } else if (enemy.timer <= 0) {
          enemy.targetX = enemy.x + randomRange(-TILE_SIZE, TILE_SIZE);
          enemy.targetY = enemy.y + randomRange(-TILE_SIZE, TILE_SIZE);
          enemy.timer = randomRange(0.8, 1.4);
        }
      }
    }

    if (enemy.health <= 0) {
      enemy.state = 'dead';
      enemy.timer = 0;
    }
  });
}

function updateLevel(dt) {
  if (state.mode !== 'playing') return;
  updatePlayer(dt);
  updateEnemies(dt);
  if (input.firing) shoot();
  if (state.reloadTimer > 0) {
    state.reloadTimer -= dt;
    if (state.reloadTimer <= 0) {
      const need = 12 - state.player.ammo;
      const take = Math.min(need, state.player.reserve);
      state.player.ammo += take;
      state.player.reserve -= take;
      statusText.textContent = 'Reload complete.';
    }
  }
  if (state.fireTimer > 0) state.fireTimer -= dt;
  if (state.shotFlash > 0) state.shotFlash = Math.max(0, state.shotFlash - dt * 4);
  if (state.noiseAlpha > 0) state.noiseAlpha = Math.max(0, state.noiseAlpha - dt * 1.5);
  if (state.screenShake > 0) state.screenShake = Math.max(0, state.screenShake - dt * 0.26);
  if (state.hubPulse > 0) state.hubPulse = Math.max(0, state.hubPulse - dt * 0.48);
  if (state.mirrorGlitch > 0) state.mirrorGlitch = Math.max(0, state.mirrorGlitch - dt * 0.18);

  if (state.player.health <= 0) {
    triggerGameOver('Your body could not withstand the horrors.');
  }
  if (state.enemies.every((enemy) => enemy.health <= 0)) {
    finishFloor();
  }
}

function draw() {
  resize();
  ctx.save();
  if (state.screenShake > 0) {
    const magnitude = state.screenShake * 8;
    const dx = (Math.random() - 0.5) * magnitude;
    const dy = (Math.random() - 0.5) * magnitude;
    ctx.translate(dx, dy);
  }
  if (state.mode === 'playing') drawFloorScene();
  else drawElevator();
  ctx.restore();
  if (state.mode === 'playing') drawAimCursor();
  drawHUD();
}

function drawElevator() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#05070b';
  ctx.fillRect(0, 0, w, h);

  const noise = state.mirrorGlitch > 0 ? 50 : 0;
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = `rgba(120,120,120,${0.03 + i * 0.006})`;
    ctx.fillRect(0, h * 0.2 + i * 14 + noise * 0.01, w, 12);
  }

  ctx.fillStyle = '#11131a';
  ctx.fillRect(w * 0.1, h * 0.12, w * 0.8, h * 0.76);
  ctx.fillStyle = '#181b20';
  ctx.fillRect(w * 0.13, h * 0.15, w * 0.74, h * 0.7);

  ctx.strokeStyle = '#23272f';
  ctx.lineWidth = 3;
  ctx.strokeRect(w * 0.13, h * 0.15, w * 0.74, h * 0.7);

  ctx.fillStyle = '#1f2229';
  ctx.fillRect(w * 0.13, h * 0.15, w * 0.74, h * 0.12);
  ctx.fillStyle = '#ff3a3a';
  ctx.fillRect(w * 0.55, h * 0.175, w * 0.12, h * 0.02);

  ctx.fillStyle = '#9aa1b8';
  ctx.font = '600 22px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FLOOR INDICATOR', w * 0.5, h * 0.22);
  ctx.font = '700 88px Inter, sans-serif';
  ctx.fillStyle = '#ff5f5f';
  ctx.fillText(`F${String(state.floor).padStart(2, '0')}`, w * 0.5, h * 0.33);

  ctx.fillStyle = '#101316';
  ctx.fillRect(w * 0.2, h * 0.35, w * 0.6, h * 0.5);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(w * 0.23, h * 0.38, w * 0.54, h * 0.0);

  ctx.fillStyle = '#1f2229';
  for (let row = 0; row < 7; row++) {
    ctx.fillRect(w * 0.22, h * 0.38 + row * 52, w * 0.56, 22);
  }

  ctx.fillStyle = '#b5c2d8';
  ctx.font = '600 20px Inter, sans-serif';
  ctx.fillText('Rusty metal panels, exposed wiring, flickering lights.', w * 0.5, h * 0.47);
  ctx.fillText('Listen for the groan of the cage before the doors open.', w * 0.5, h * 0.51);

  const pulse = Math.sin(performance.now() * 0.016) * state.hubPulse * 0.28;
  ctx.fillStyle = `rgba(255,95,95,${0.06 + pulse})`;
  ctx.fillRect(w * 0.2, h * 0.86, w * 0.6, 4);

  if (state.mirrorGlitch > 0) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.translate(w * 0.5 + Math.sin(performance.now() * 0.005) * 14, h * 0.4);
    drawHorrorFace(w * 0.16, h * 0.34, 0.6, 0.6, 0.2);
    ctx.restore();
  }

  ctx.fillStyle = '#e8f0ff';
  ctx.font = '700 16px Inter, sans-serif';
  ctx.fillText('ELEVATOR SAFE ZONE', w * 0.5, h * 0.82);
}

function drawHorrorFace(x, y, scale, alpha, mouthOpen) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#f9f9fb';
  ctx.beginPath();
  ctx.ellipse(0, 0, 58, 78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.ellipse(-22, -16, 12, 18, 0, 0, Math.PI * 2);
  ctx.ellipse(22, -16, 12, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff4b4b';
  ctx.beginPath();
  ctx.arc(0, 18, 22, 0, Math.PI, false);
  ctx.lineTo(22, 18);
  ctx.lineTo(22, 18 + (mouthOpen ? 22 : 4));
  ctx.lineTo(-22, 18 + (mouthOpen ? 22 : 4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFloorScene() {
  const w = canvas.width;
  const h = canvas.height;
  const ceilingGradient = ctx.createLinearGradient(0, 0, 0, h / 2);
  ceilingGradient.addColorStop(0, state.theme.ceiling);
  ceilingGradient.addColorStop(1, '#111317');
  ctx.fillStyle = ceilingGradient;
  ctx.fillRect(0, 0, w, h / 2);

  const floorGradient = ctx.createLinearGradient(0, h / 2, 0, h);
  floorGradient.addColorStop(0, '#13161b');
  floorGradient.addColorStop(0.35, state.theme.floor);
  floorGradient.addColorStop(1, '#08090c');
  ctx.fillStyle = floorGradient;
  ctx.fillRect(0, h / 2, w, h / 2);

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let row = 1; row < 12; row += 1) {
    const y = h / 2 + (h / 2) * (row / 12);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let x = 0; x < w; x += 88) {
    ctx.fillRect(x, 0, 6, h / 2);
  }

  const stride = w / RAY_COUNT;
  for (let i = 0; i < RAY_COUNT; i++) {
    const rayAngle = state.player.angle - FOV / 2 + (FOV * i) / RAY_COUNT;
    let distanceToWall = 0;
    let hitWall = false;

    const eyeX = Math.cos(rayAngle);
    const eyeY = Math.sin(rayAngle);

    while (!hitWall && distanceToWall < MAX_VIEW_DISTANCE) {
      distanceToWall += 12;
      const testX = Math.floor((state.player.x + eyeX * distanceToWall) / TILE_SIZE);
      const testY = Math.floor((state.player.y + eyeY * distanceToWall) / TILE_SIZE);
      if (testX < 0 || testX >= MAP_SIZE || testY < 0 || testY >= MAP_SIZE) {
        hitWall = true;
        distanceToWall = MAX_VIEW_DISTANCE;
      } else if (isWall(testX, testY)) {
        hitWall = true;
      }
    }

    const ceiling = (h / 2.0) - h / distanceToWall;
    const floor = h - ceiling;
    const shade = clamp(distanceToWall / MAX_VIEW_DISTANCE, 0, 1);
    let wallColor = `rgba(${32 + shade * 90}, ${28 + shade * 72}, ${38 + shade * 90}, 1)`;
    if (Math.floor(i / 14) % 3 === 0) {
      wallColor = `rgba(${180 + shade * 20}, ${118 - shade * 26}, ${255 - shade * 110}, 1)`;
    }
    if (Math.floor(i / 23) % 5 === 0) {
      wallColor = `rgba(${96 + shade * 60}, ${196 - shade * 90}, ${255 - shade * 120}, 1)`;
    }
    ctx.fillStyle = wallColor;
    ctx.fillRect(i * stride, ceiling, stride + 1, floor - ceiling);

    if (Math.floor(i / 18) % 7 === 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.08 + (1 - shade) * 0.12})`;
      ctx.fillRect(i * stride, ceiling + 14, stride + 1, Math.min(16, floor - ceiling - 28));
    }
  }

  drawFloorLines();
  drawObjects();
  drawEnemies();
  drawGun();
  drawEffects();
  drawFog();
  drawVignette();
}

function drawObjects() {
  state.objects.forEach((obj) => {
    drawCellShadow(obj.x, obj.y, '#2c2332');
  });
  state.traps.forEach((trap) => {
    drawCellShadow(trap.x, trap.y, 'rgba(190,60,60,0.42)');
  });
}

function drawCellShadow(cellX, cellY, color) {
  const cx = cellX * TILE_SIZE + TILE_SIZE / 2;
  const cy = cellY * TILE_SIZE + TILE_SIZE / 2;
  const d = Math.hypot(cx - state.player.x, cy - state.player.y);
  if (d > 1800) return;
  const ang = Math.atan2(cy - state.player.y, cx - state.player.x);
  const diff = Math.abs(((ang - state.player.angle + Math.PI) % (Math.PI * 2)) - Math.PI);
  if (diff > FOV / 2) return;
  const depth = clamp(1 - d / 1800, 0.12, 0.96);
  const screenX = canvas.width / 2 + (diff / (FOV / 2)) * canvas.width * 0.55 * (ang > state.player.angle ? 1 : -1);
  const size = TILE_SIZE * depth * 0.4;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.ellipse(screenX, canvas.height * 0.55, size, size * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawEnemies() {
  const sorted = state.enemies.slice().sort((a, b) => b.health - a.health);
  sorted.forEach((enemy) => {
    if (enemy.health <= 0) return;
    const dx = enemy.x - state.player.x;
    const dy = enemy.y - state.player.y;
    const ang = Math.atan2(dy, dx);
    let diff = ang - state.player.angle;
    diff = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (Math.abs(diff) > FOV / 2) return;
    const dist = Math.hypot(dx, dy);
    const scale = clamp(60 / dist, 0.16, 1.2);
    const screenX = canvas.width / 2 + Math.tan(diff) * canvas.width * 0.32;
    const screenY = canvas.height * 0.5 + 120 * scale;
    drawCreature(enemy, screenX, screenY, scale, dist);
  });
}

function drawCreature(enemy, x, y, scale, dist) {
  const base = 1 - clamp(dist / 1200, 0, 0.85);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const bodyColor = enemy.type.color;
  ctx.globalAlpha = 0.96;

  if (enemy.id === 'watcher' || enemy.id === 'tall') {
    const height = enemy.id === 'tall' ? 220 : 180;
    const sway = Math.sin(performance.now() * 0.003 + enemy.x) * 4 * base;
    ctx.fillStyle = '#16171c';
    ctx.fillRect(-14, -height, 28, height - 32);
    ctx.fillStyle = '#1f1c23';
    ctx.beginPath();
    ctx.ellipse(0, -height - 24, 30, 42, sway * 0.01, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#07070a';
    ctx.fillRect(-26, -height + 4, 52, 18);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-12, -height - 30, 8, 0, Math.PI * 2);
    ctx.arc(12, -height - 30, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(-16, -height - 34, 8, 16);
    ctx.fillRect(8, -height - 34, 8, 16);
    ctx.strokeStyle = '#ff4b4b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-20, -height + 6);
    ctx.quadraticCurveTo(0, -height + 40, 20, -height + 6);
    ctx.stroke();
    if (enemy.id === 'tall') {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-26, -height + 2);
      ctx.lineTo(-46, -height + 64);
      ctx.moveTo(26, -height + 2);
      ctx.lineTo(46, -height + 64);
      ctx.stroke();
    }
  } else if (enemy.id === 'crawler') {
    const step = Math.sin(performance.now() * 0.01 + enemy.x) * 12;
    ctx.fillStyle = '#1b1a1f';
    ctx.beginPath();
    ctx.ellipse(0, -30, 38, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-32, -14);
    ctx.quadraticCurveTo(-56, 12, -50, 44);
    ctx.lineTo(-42, 40);
    ctx.lineTo(-24, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(32, -14);
    ctx.quadraticCurveTo(56, 12, 50, 44);
    ctx.lineTo(42, 40);
    ctx.lineTo(24, 2);
    ctx.fill();
    ctx.fillStyle = '#e8e9ee';
    ctx.beginPath();
    ctx.ellipse(0, -44, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(-14, -52, 10, 20);
    ctx.fillRect(4, -52, 10, 20);
    ctx.fillStyle = '#ff5d5d';
    ctx.fillRect(-8, -24, 16, 6);
  } else if (enemy.id === 'smiler') {
    const peek = Math.sin(performance.now() * 0.009 + enemy.y) * 6;
    ctx.fillStyle = '#1b1314';
    ctx.fillRect(-18, -64, 36, 56);
    ctx.fillStyle = '#f3e7e7';
    ctx.beginPath();
    ctx.ellipse(0, -78, 28, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(-14, -92, 10, 26);
    ctx.fillRect(4, -92, 10, 26);
    ctx.strokeStyle = '#ff6a6a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-18, -60);
    ctx.quadraticCurveTo(0, -20 + peek, 18, -60);
    ctx.stroke();
    ctx.fillStyle = '#111';
    ctx.fillRect(-24, -64, 48, 20);
  } else if (enemy.id === 'static') {
    const pulse = Math.abs(Math.sin(performance.now() * 0.018 + enemy.x));
    ctx.globalAlpha = 0.85 - pulse * 0.32;
    ctx.fillStyle = '#f8f8fd';
    ctx.beginPath();
    ctx.ellipse(0, -56, 22, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(-10, -64, 8, 16);
    ctx.fillRect(2, -64, 8, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-14, -30);
    ctx.lineTo(0, -18 + pulse * 6);
    ctx.lineTo(14, -30);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (enemy.flash > 0) {
    ctx.fillStyle = `rgba(255, 120, 120, ${enemy.flash * 0.35})`;
    ctx.beginPath();
    ctx.arc(0, -40, 40, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawGun() {
  const w = canvas.width;
  const h = canvas.height;
  const sway = Math.sin(performance.now() * 0.01) * 4 * state.shotFlash;
  const crouchOffset = input.crouch ? 18 : 0;
  ctx.save();
  ctx.translate(w * 0.5 + sway, h * 0.72 + crouchOffset);

  // left hand
  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(-96, 12, 34, 48);
  ctx.fillStyle = '#e5e5e5';
  ctx.fillRect(-88, 20, 18, 30);

  // right hand
  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(62, 12, 34, 48);
  ctx.fillStyle = '#e5e5e5';
  ctx.fillRect(70, 20, 18, 30);

  // gun body
  ctx.fillStyle = '#101113';
  ctx.fillRect(-120, -28, 240, 80);
  ctx.fillStyle = '#f8f8f8';
  ctx.fillRect(-76, -32, 140, 64);
  ctx.fillStyle = '#2f3135';
  ctx.fillRect(-118, -24, 30, 48);
  ctx.fillRect(22, -20, 40, 36);

  ctx.fillStyle = '#2d2d34';
  ctx.fillRect(-64, 16, 46, 20);
  ctx.fillRect(14, 16, 46, 20);
  ctx.fillStyle = '#121316';
  ctx.fillRect(-60, 8, 10, 24);
  ctx.fillRect(38, 8, 10, 24);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-40, -32, 80, 12);
  ctx.fillRect(-40, -12, 20, 36);

  if (state.shotFlash > 0) {
    ctx.fillStyle = `rgba(255, 220, 140, ${state.shotFlash})`;
    ctx.beginPath();
    ctx.moveTo(24, -16);
    ctx.lineTo(78, 0);
    ctx.lineTo(24, 16);
    ctx.closePath();
    ctx.fill();
  }

  if (input.crouch) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(-72, -12, 144, 4);
  }

  ctx.restore();
}

function drawAimCursor() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.88)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy);
  ctx.lineTo(cx - 6, cy);
  ctx.moveTo(cx + 16, cy);
  ctx.lineTo(cx + 6, cy);
  ctx.moveTo(cx, cy - 16);
  ctx.lineTo(cx, cy - 6);
  ctx.moveTo(cx, cy + 16);
  ctx.lineTo(cx, cy + 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawEffects() {
  if (state.noiseAlpha > 0) {
    ctx.fillStyle = `rgba(255,255,255,${state.noiseAlpha * 0.025})`;
    for (let i = 0; i < 12; i += 1) {
      const y = randomRange(0, canvas.height);
      ctx.fillRect(0, y, canvas.width, 2);
    }
  }
}

function drawFloorLines() {
  const w = canvas.width;
  const h = canvas.height;
  const startY = h / 2;
  ctx.lineWidth = 1;

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 3; i += 1) {
    const offset = (i - 1) * 60;
    ctx.beginPath();
    ctx.moveTo(w / 2 + offset, startY + 30);
    ctx.lineTo(w / 2 + offset, h - 90);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let i = 1; i < 14; i += 1) {
    const y = startY + (h / 2) * (i / 14);
    ctx.beginPath();
    ctx.moveTo(w * 0.14, y);
    ctx.lineTo(w * 0.86, y - i * 1.6);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 7; i += 1) {
    const y = startY + (h / 2) * (i / 7);
    ctx.fillRect(w * 0.48, y, w * 0.04, 4);
  }
}

function drawFog() {
  const w = canvas.width;
  const h = canvas.height;
  const fogGradient = ctx.createLinearGradient(0, h * 0.35, 0, h);
  fogGradient.addColorStop(0, 'rgba(20, 24, 34, 0.0)');
  fogGradient.addColorStop(1, state.theme.fog);
  ctx.fillStyle = fogGradient;
  ctx.fillRect(0, h * 0.35, w, h * 0.65);
}

function drawVignette() {
  const w = canvas.width;
  const h = canvas.height;
  const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.75);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawHUD() {
  floorLabel.textContent = `FLOOR ${String(state.floor).padStart(2, '0')}`;
  healthFill.style.transform = `scaleX(${clamp(state.player.health / 100, 0, 1)})`;
  ammoCount.textContent = `${state.player.ammo} / ${state.player.reserve}`;
  radarCtx.clearRect(0, 0, radarCanvas.width, radarCanvas.height);
  radarCtx.fillStyle = '#071019';
  radarCtx.fillRect(0, 0, radarCanvas.width, radarCanvas.height);
  radarCtx.fillStyle = 'rgba(255,255,255,0.1)';
  radarCtx.strokeRect(0, 0, radarCanvas.width, radarCanvas.height);

  const scale = radarCanvas.width / worldSize;
  state.enemies.forEach((enemy) => {
    if (enemy.health <= 0) return;
    radarCtx.fillStyle = 'rgba(255,70,70,0.92)';
    radarCtx.beginPath();
    radarCtx.arc(enemy.x * scale, enemy.y * scale, 4, 0, Math.PI * 2);
    radarCtx.fill();
  });
  state.falseSignals.forEach((signal) => {
    radarCtx.fillStyle = `rgba(255,255,255,${signal.alpha})`;
    radarCtx.beginPath();
    radarCtx.arc(signal.x, signal.y, 3, 0, Math.PI * 2);
    radarCtx.fill();
  });
  radarCtx.fillStyle = '#6bfb7f';
  radarCtx.beginPath();
  radarCtx.arc(state.player.x * scale, state.player.y * scale, 5, 0, Math.PI * 2);
  radarCtx.fill();
}

function mainLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.033);
  lastTime = timestamp;
  updateLevel(dt);
  draw();
  requestAnimationFrame(mainLoop);
}

function handleKey(event, enabled) {
  if (event.repeat) return;
  switch (event.code) {
    case 'KeyW':
      input.forward = enabled;
      break;
    case 'KeyS':
      input.backward = enabled;
      break;
    case 'KeyA':
      input.turnLeft = enabled;
      break;
    case 'KeyD':
      input.turnRight = enabled;
      break;
    case 'KeyQ':
      input.strafeLeft = enabled;
      break;
    case 'KeyE':
      input.strafeRight = enabled;
      break;
    case 'ArrowLeft':
      input.turnLeft = enabled;
      break;
    case 'ArrowRight':
      input.turnRight = enabled;
      break;
    case 'KeyC':
    case 'ControlLeft':
      input.crouch = enabled;
      break;
    case 'KeyR':
      if (enabled) attemptReload();
      break;
    case 'Enter':
      if (!enabled) return;
      if (state.mode === 'intro') showHub();
      if (state.mode === 'hub') startFloor();
      if (state.mode === 'gameover') restartRun();
      break;
  }
}

function setupEvents() {
  window.addEventListener('keydown', (event) => handleKey(event, true));
  window.addEventListener('keyup', (event) => handleKey(event, false));
  window.addEventListener('mousedown', (event) => {
    if (event.button === 0 && state.mode === 'playing') input.firing = true;
  });
  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) input.firing = false;
  });
  window.addEventListener('resize', resize);
  introOverlay.addEventListener('click', () => {
    if (state.mode === 'intro') showHub();
  });
  enterElevatorButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (state.mode === 'intro') showHub();
  });
  restartButton.addEventListener('click', restartRun);
}

function init() {
  resize();
  initAudio();
  setupEvents();
  showIntro();
  requestAnimationFrame(mainLoop);
}

init();
