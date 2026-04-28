const gameCanvas = document.getElementById('game-canvas');
const ctx = gameCanvas.getContext('2d');

const ui = {
  menuScreen: document.getElementById('menu-screen'),
  hubScreen: document.getElementById('hub-screen'),
  missionScreen: document.getElementById('mission-screen'),
  uiOrigin: document.getElementById('ui-origin'),
  uiAlignment: document.getElementById('ui-alignment'),
  uiPower: document.getElementById('ui-power'),
  uiReputation: document.getElementById('ui-reputation'),
  uiPlanet: document.getElementById('ui-planet'),
  uiCurrentMission: document.getElementById('ui-current-mission'),
  uiLog: document.getElementById('ui-log'),
  missionList: document.getElementById('mission-list'),
  planetList: document.getElementById('planet-list'),
  startMissionButton: document.getElementById('start-mission-button'),
  travelButton: document.getElementById('travel-button'),
  gameHealth: document.getElementById('game-health'),
  gameEnemies: document.getElementById('game-enemies'),
  gameFlight: document.getElementById('game-flight'),
  gameAbility: document.getElementById('game-ability')
};

const keys = {};
const state = {
  mode: 'menu',
  selectedMissionIndex: 0,
  selectedPlanetIndex: 0,
  fightPhase: false
};

const originProfiles = {
  EarthHero: {
    label: 'Earth Hero',
    alignment: 'Hero',
    reputation: 20,
    intro: 'A defender from Earth: protect civilians and fight invaders.'
  },
  ViltrumiteConqueror: {
    label: 'Viltrumite Conqueror',
    alignment: 'Conqueror',
    reputation: -20,
    intro: 'A Viltrum warrior: conquer worlds and crush resistance.'
  }
};

const planets = [
  { name: 'Earth', requiredPower: 1, unlocked: true, description: 'Home world with cities and heroes.' },
  { name: 'Viltrum', requiredPower: 10, unlocked: false, description: 'Imperial training ground and conquest staging.' },
  { name: 'Zenotra', requiredPower: 20, unlocked: false, description: 'Alien civilization with strong defenders.' },
  { name: 'Nexion', requiredPower: 35, unlocked: false, description: 'War-torn planet caught in rebellion.' }
];

const missions = [
  { name: 'Rescue Civilians', planet: 'Earth', alignment: 'Hero', requiredPower: 1, rewardXP: 3, rewardRep: 10, description: 'Save civilians from a collapsed district.' },
  { name: 'Stop Bank Robbery', planet: 'Earth', alignment: 'Hero', requiredPower: 3, rewardXP: 5, rewardRep: 15, description: 'Take down a villain crew stealing tech.' },
  { name: 'Conquerive Strike', planet: 'Viltrum', alignment: 'Conqueror', requiredPower: 5, rewardXP: 7, rewardRep: -15, description: 'Break rebel morale with a display of power.' },
  { name: 'Assault the Defender', planet: 'Viltrum', alignment: 'Conqueror', requiredPower: 12, rewardXP: 12, rewardRep: -25, description: 'Defeat the champion guarding the citadel.' },
  { name: 'Alien Ambassador', planet: 'Zenotra', alignment: 'Hero', requiredPower: 18, rewardXP: 15, rewardRep: 20, description: 'Protect an ambassador from assassination.' },
  { name: 'Ruthless Subjugation', planet: 'Zenotra', alignment: 'Conqueror', requiredPower: 22, rewardXP: 18, rewardRep: -30, description: 'Crush the strongest defenders and enslave the world.' },
  { name: 'Liberate the Uprising', planet: 'Nexion', alignment: 'Hero', requiredPower: 32, rewardXP: 22, rewardRep: 30, description: 'Free the planet from Viltrumite occupation.' },
  { name: 'Dominate the Rebellion', planet: 'Nexion', alignment: 'Conqueror', requiredPower: 35, rewardXP: 25, rewardRep: -35, description: 'Destroy the rebellion and claim the planet.' }
];

const abilities = [
  { name: 'Shockwave', requiredPower: 5, alignment: 'Hybrid', description: 'A radial strike that damages all nearby enemies.' },
  { name: 'Gravity Punch', requiredPower: 10, alignment: 'Conqueror', description: 'A powerful strike that stuns and launches enemies.' },
  { name: 'Aerial Burst', requiredPower: 20, alignment: 'Hybrid', description: 'A charged aerial blast that clears the battlefield.' }
];

const player = {
  origin: null,
  alignment: null,
  strength: 5,
  speed: 5,
  durability: 5,
  combatSkill: 5,
  flightControl: 5,
  reputation: 0,
  powerLevel: 0,
  planet: 'Earth',
  health: 100,
  maxHealth: 100,
  flight: false,
  specialAvailable: true,
  x: 90,
  y: 250,
  width: 24,
  height: 36,
  attackCooldown: 0
};

let enemies = [];
let currentMission = null;
let logLines = [];

function log(message) {
  logLines.unshift(message);
  if (logLines.length > 10) logLines.pop();
  ui.uiLog.textContent = logLines.join('\n');
}

function computePower() {
  player.powerLevel = player.strength + player.speed + player.durability + player.combatSkill + player.flightControl;
}

function refreshHub() {
  computePower();
  ui.uiOrigin.textContent = originProfiles[player.origin].label;
  ui.uiAlignment.textContent = player.alignment;
  ui.uiPower.textContent = player.powerLevel;
  ui.uiReputation.textContent = player.reputation;
  ui.uiPlanet.textContent = player.planet;
  ui.uiCurrentMission.textContent = currentMission ? currentMission.name : 'None';
  renderMissionList();
  renderPlanetList();
}

function getAvailableMissions() {
  return missions.filter(m => m.planet === player.planet && m.requiredPower <= player.powerLevel && (m.alignment === player.alignment || m.alignment === 'Hybrid'));
}

function getAvailablePlanets() {
  return planets.filter(planet => planet.unlocked);
}

function renderMissionList() {
  const available = getAvailableMissions();
  if (available.length === 0) {
    ui.missionList.innerHTML = '<div class="list-item">No missions available.</div>';
    state.selectedMissionIndex = 0;
    return;
  }

  state.selectedMissionIndex = Math.min(state.selectedMissionIndex, available.length - 1);
  ui.missionList.innerHTML = available.map((mission, index) => `
    <div class="list-item ${index === state.selectedMissionIndex ? 'selected' : ''}" data-index="${index}">
      <strong>${mission.name}</strong> (${mission.requiredPower})<br>
      ${mission.description}
    </div>
  `).join('');

  ui.missionList.querySelectorAll('.list-item').forEach(item => {
    item.addEventListener('click', () => {
      state.selectedMissionIndex = Number(item.dataset.index);
      renderMissionList();
    });
  });
}

function renderPlanetList() {
  const available = getAvailablePlanets();
  state.selectedPlanetIndex = Math.min(state.selectedPlanetIndex, available.length - 1);
  ui.planetList.innerHTML = available.map((planet, index) => `
    <div class="list-item ${index === state.selectedPlanetIndex ? 'selected' : ''}" data-index="${index}">
      <strong>${planet.name}</strong> (power ${planet.requiredPower})<br>
      ${planet.description}
    </div>
  `).join('');

  ui.planetList.querySelectorAll('.list-item').forEach(item => {
    item.addEventListener('click', () => {
      state.selectedPlanetIndex = Number(item.dataset.index);
      renderPlanetList();
    });
  });
}

function setMode(mode) {
  state.mode = mode;
  ui.menuScreen.classList.toggle('active', mode === 'menu');
  ui.hubScreen.classList.toggle('active', mode === 'hub');
  ui.missionScreen.classList.toggle('active', mode === 'mission');
}

function chooseOrigin(originKey) {
  player.origin = originKey;
  player.alignment = originProfiles[originKey].alignment;
  player.reputation = originProfiles[originKey].reputation;
  player.planet = 'Earth';
  player.health = player.maxHealth;
  computePower();
  currentMission = null;
  log(`Origin selected: ${originProfiles[originKey].label}`);
  log(originProfiles[originKey].intro);
  if (originKey === 'ViltrumiteConqueror') {
    player.strength += 2;
    player.durability += 1;
  } else {
    player.speed += 1;
    player.combatSkill += 1;
  }
  computePower();
  refreshHub();
  setMode('hub');
}

function unlockPlanets() {
  planets.forEach(planet => {
    if (!planet.unlocked && player.powerLevel >= planet.requiredPower) {
      planet.unlocked = true;
      log(`${planet.name} unlocked!`);
    }
  });
}

function travelToPlanet() {
  const available = getAvailablePlanets();
  if (available.length === 0) return;
  const planet = available[state.selectedPlanetIndex];
  if (!planet) return;
  player.planet = planet.name;
  refreshHub();
  log(`Traveled to ${planet.name}.`);
}

function startMission() {
  const available = getAvailableMissions();
  if (!available.length) return;
  currentMission = available[state.selectedMissionIndex];
  if (!currentMission) return;
  log(`Starting mission: ${currentMission.name}`);
  beginMission(currentMission);
}

function beginMission(mission) {
  player.health = player.maxHealth;
  player.flight = false;
  player.specialAvailable = true;
  player.attackCooldown = 0;
  player.x = 90;
  player.y = 250;
  enemies = createEnemiesForMission(mission);
  setMode('mission');
  updateGameInfo();
}

function createEnemiesForMission(mission) {
  const enemyCount = Math.min(5, 2 + Math.floor(mission.rewardXP / 4));
  const list = [];
  for (let i = 0; i < enemyCount; i++) {
    const level = Math.max(1, Math.floor(player.powerLevel / 6)) + i;
    list.push({
      x: 520 + Math.random() * 320,
      y: 40 + Math.random() * 400,
      width: 28,
      height: 36,
      health: 12 + level * 8,
      maxHealth: 12 + level * 8,
      speed: 1.2 + level * 0.25,
      damage: 4 + level,
      color: mission.alignment === 'Hero' ? '#ff784f' : '#ffcd3c',
      name: `Enemy ${i + 1}`
    });
  }
  return list;
}

function updateGameInfo() {
  ui.gameHealth.textContent = `${Math.max(0, Math.floor(player.health))}/${player.maxHealth}`;
  ui.gameEnemies.textContent = enemies.length;
  ui.gameFlight.textContent = player.flight ? 'ON' : 'OFF';
  ui.gameAbility.textContent = player.specialAvailable ? 'Ready' : 'Recharge';
}

function updatePlayer(delta) {
  const speed = player.flight ? player.speed * 1.5 : player.speed;
  if (keys.ArrowLeft) player.x -= speed * delta;
  if (keys.ArrowRight) player.x += speed * delta;
  if (keys.ArrowUp) player.y -= speed * delta;
  if (keys.ArrowDown) player.y += speed * delta;
  player.x = Math.max(20, Math.min(gameCanvas.width - player.width - 20, player.x));
  player.y = Math.max(20, Math.min(gameCanvas.height - player.height - 20, player.y));

  if (keys.z && player.attackCooldown <= 0) {
    performAttack();
  }

  if (keys.x && player.specialAvailable) {
    performSpecial();
  }

  if (player.attackCooldown > 0) {
    player.attackCooldown -= delta * 20;
  }
}

function performAttack() {
  player.attackCooldown = 1;
  enemies.forEach(enemy => {
    const hit = collide(player, enemy, 50);
    if (hit) {
      enemy.health -= 8 + player.strength * 1.4;
    }
  });
}

function performSpecial() {
  player.specialAvailable = false;
  const ability = unlockedAbility();
  if (!ability) {
    log('No special ability available yet.');
    return;
  }
  log(`Using special: ${ability.name}`);
  if (ability.name === 'Shockwave') {
    enemies.forEach(enemy => {
      enemy.health -= 12 + player.combatSkill * 1.8;
    });
  } else if (ability.name === 'Gravity Punch') {
    enemies.forEach(enemy => {
      if (collide(player, enemy, 100)) {
        enemy.health -= 20 + player.strength * 2;
      }
    });
  } else if (ability.name === 'Aerial Burst') {
    enemies.forEach(enemy => {
      enemy.health -= 14 + player.flightControl * 2;
    });
  }
  setTimeout(() => {
    player.specialAvailable = true;
  }, 4500);
}

function unlockedAbility() {
  const available = abilities.filter(ability => player.powerLevel >= ability.requiredPower && (ability.alignment === 'Hybrid' || ability.alignment === player.alignment));
  return available[available.length - 1] || null;
}

function updateEnemies(delta) {
  enemies = enemies.filter(enemy => enemy.health > 0);
  enemies.forEach(enemy => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 8) {
      enemy.x += (dx / dist) * enemy.speed * delta * 30;
      enemy.y += (dy / dist) * enemy.speed * delta * 30;
    }
    if (dist < 40) {
      player.health -= enemy.damage * delta * 0.8;
    }
  });
}

function collide(a, b, range = 0) {
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;
  const dist = Math.hypot(ax - bx, ay - by);
  return dist <= range + 12;
}

function drawMission() {
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  ctx.fillStyle = mapColor();
  ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
  drawStars();

  ctx.fillStyle = '#6ec1ff';
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillStyle = '#0a0';
  ctx.fillRect(player.x + 6, player.y + 8, 12, 4);
  ctx.fillRect(player.x + 6, player.y + 24, 12, 4);

  enemies.forEach(enemy => {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    const barWidth = (enemy.health / enemy.maxHealth) * enemy.width;
    ctx.fillStyle = '#222';
    ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4);
    ctx.fillStyle = '#ff4d4d';
    ctx.fillRect(enemy.x, enemy.y - 8, barWidth, 4);
  });

  ctx.fillStyle = '#fff';
  ctx.font = '16px Inter';
  ctx.fillText(currentMission.name, 16, 28);
  ctx.fillText(currentMission.description, 16, 50);
}

function mapColor() {
  if (player.planet === 'Earth') return '#203c5e';
  if (player.planet === 'Viltrum') return '#2a1820';
  if (player.planet === 'Zenotra') return '#12383f';
  return '#291b2f';
}

function drawStars() {
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect((i * 45) % gameCanvas.width, (i * 33) % gameCanvas.height, 2, 2);
  }
}

function updateGame(delta) {
  updatePlayer(delta);
  updateEnemies(delta);
  updateGameInfo();
  drawMission();

  if (player.health <= 0) {
    log('Mission failed. You were defeated.');
    setMode('hub');
    return;
  }

  if (enemies.length === 0) {
    log(`Mission complete: ${currentMission.name}`);
    player.reputation += currentMission.rewardRep;
    player.strength += currentMission.rewardXP > 5 ? 1 : 0;
    player.combatSkill += currentMission.rewardXP > 8 ? 1 : 0;
    player.durability += currentMission.rewardXP > 10 ? 1 : 0;
    computePower();
    unlockPlanets();
    currentMission = null;
    refreshHub();
    setMode('hub');
  }
}

function gameLoop(timestamp) {
  const delta = 0.016;
  if (state.mode === 'mission') {
    updateGame(delta);
  }
  requestAnimationFrame(gameLoop);
}

function initEvents() {
  document.getElementById('hero-button').addEventListener('click', () => chooseOrigin('EarthHero'));
  document.getElementById('viltrumite-button').addEventListener('click', () => chooseOrigin('ViltrumiteConqueror'));
  ui.startMissionButton.addEventListener('click', startMission);
  ui.travelButton.addEventListener('click', travelToPlanet);

  document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
    if (event.key === 'f') {
      player.flight = !player.flight;
      log(`Flight ${player.flight ? 'enabled' : 'disabled'}.`);
    }
    if (event.key === 'Escape' && state.mode === 'mission') {
      log('Returned to hub. Mission abandoned.');
      setMode('hub');
    }
  });

  document.addEventListener('keyup', (event) => {
    delete keys[event.key];
  });
}

function start() {
  initEvents();
  setMode('menu');
  computePower();
  renderMissionList();
  renderPlanetList();
  requestAnimationFrame(gameLoop);
}

start();
