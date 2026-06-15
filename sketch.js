// =====================================================
// SURVIVAL WORLD 3D – MINECRAFT STYLE
// Fixed: building, gathering, physics, perf, all bugs
// =====================================================

// --- World ---
let terrain = [];
let cols = 80, rows = 80;
let scl = 40;
let worldW = cols * scl;
let worldD = rows * scl;

// --- Player ---
let px = 0, py = -150, pz = 0;
let velY = 0;
let onGround = false;
const GRAVITY    = 1.6;
const JUMP_FORCE = -20;
const MOVE_SPEED = 7;
const SPRINT_MULT = 1.9;
const PLAYER_HEIGHT = 80;
const REACH = 320;

// --- Camera ---
let yaw = 0;
let pitch = 0;
let pointerLocked = false;

// --- Building ---
// blockMap key = "x,y,z" -> block object for O(1) lookup
let blocks = [];
let blockMap = {};
let blockSize = 50;
let buildPreview  = null;
let deletePreview = null;

// Placement cooldown (frames) – prevents spam, allows hold-to-build
const PLACE_COOLDOWN  = 6;
let   placeCooldown   = 0;
let   deleteCooldown  = 0;

const BLOCK_TYPES = [
  { name: "Wood",   color: [160, 110,  60] },
  { name: "Stone",  color: [130, 130, 130] },
  { name: "Dirt",   color: [120,  80,  40] },
  { name: "Glass",  color: [180, 220, 255] },
  { name: "Brick",  color: [180,  80,  60] },
  { name: "Sand",   color: [220, 200, 130] },
  { name: "Leaf",   color: [ 50, 160,  60] },
];
let selectedSlot = 0;

// --- Resources ---
let inventory = { wood: 10, stone: 10 };
// Per-tree/rock gather cooldown prevents multi-harvest per keypress
let gatherCooldown = 0;
const GATHER_CD = 18; // frames

// --- Time ---
let timeOfDay = 0;

// --- Objects ---
let trees = [];
let rocks = [];

// =====================================================
// BLOCK MAP HELPERS – O(1) lookup
// =====================================================
function blockKey(x, y, z) {
  return x + "," + y + "," + z;
}

function addBlock(x, y, z, color) {
  let k = blockKey(x, y, z);
  if (blockMap[k]) return false; // already occupied
  let b = { x, y, z, color };
  blocks.push(b);
  blockMap[k] = b;
  return true;
}

function removeBlock(x, y, z) {
  let k = blockKey(x, y, z);
  if (!blockMap[k]) return false;
  delete blockMap[k];
  blocks = blocks.filter(b => !(b.x === x && b.y === y && b.z === z));
  return true;
}

function getBlock(x, y, z) {
  return blockMap[blockKey(x, y, z)] || null;
}

// =====================================================
// SETUP
// =====================================================
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  generateTerrain();
  generateObjects();
  frameRate(60);
  noSmooth();

  let cnv = document.querySelector("canvas");
  cnv.addEventListener("click", () => cnv.requestPointerLock());
  document.addEventListener("pointerlockchange", () => {
    pointerLocked = document.pointerLockElement === cnv;
  });
  document.addEventListener("mousemove", (e) => {
    if (!pointerLocked) return;
    yaw   += e.movementX * 0.0022;
    pitch += e.movementY * 0.0022;
    pitch  = constrain(pitch, -PI / 2 + 0.05, PI / 2 - 0.05);
  });
  document.addEventListener("contextmenu", e => e.preventDefault());

  // Scroll wheel to cycle hotbar
  document.addEventListener("wheel", (e) => {
    selectedSlot = (selectedSlot + (e.deltaY > 0 ? 1 : -1) + BLOCK_TYPES.length) % BLOCK_TYPES.length;
  });
}

// =====================================================
// DRAW LOOP
// =====================================================
function draw() {
  timeOfDay += 0.0008;

  let skyBright = map(sin(timeOfDay), -1, 1, 20, 210);
  background(skyBright * 0.45, skyBright * 0.65, skyBright);

  ambientLight(80 + skyBright * 0.45);
  directionalLight(255, 245, 220, -0.5, 1, -0.8);

  applyCamera();
  drawTerrain();
  drawTrees();
  drawRocks();

  // Draw placed blocks
  for (let b of blocks) drawBlock(b, false);

  // Compute and draw preview
  computePreview();
  if (buildPreview)  drawBlock(buildPreview, true);
  if (deletePreview) drawBlockHighlight(deletePreview);

  // Held-button building / deleting
  if (placeCooldown > 0)  placeCooldown--;
  if (deleteCooldown > 0) deleteCooldown--;

  if (mouseIsPressed && mouseButton === LEFT && placeCooldown === 0) {
    if (tryPlaceBlock()) placeCooldown = PLACE_COOLDOWN;
  }
  if (mouseIsPressed && mouseButton === RIGHT && deleteCooldown === 0) {
    if (tryDeleteBlock()) deleteCooldown = PLACE_COOLDOWN;
  }

  // Physics
  movePlayer();
  applyGravity();

  // Gathering cooldown
  if (gatherCooldown > 0) gatherCooldown--;
  checkGathering();

  // HUD
  resetMatrix();
  camera();
  noLights();
  drawHUD();
}

// =====================================================
// CAMERA
// =====================================================
function applyCamera() {
  let eyeX = px;
  let eyeY = py - PLAYER_HEIGHT;
  let eyeZ = pz;

  let lx = cos(pitch) * sin(yaw);
  let ly = sin(pitch);
  let lz = cos(pitch) * cos(yaw);

  camera(eyeX, eyeY, eyeZ,
         eyeX + lx, eyeY + ly, eyeZ + lz,
         0, 1, 0);
  perspective(PI / 3, width / height, 1, 20000);
}

// =====================================================
// MOVEMENT + PHYSICS
// =====================================================
function movePlayer() {
  let speed = MOVE_SPEED * (keyIsDown(SHIFT) ? SPRINT_MULT : 1);

  let fwdX =  sin(yaw);
  let fwdZ =  cos(yaw);
  let rgtX =  cos(yaw);
  let rgtZ = -sin(yaw);

  let dx = 0, dz = 0;
  if (keyIsDown(87)) { dx += fwdX; dz += fwdZ; }
  if (keyIsDown(83)) { dx -= fwdX; dz -= fwdZ; }
  if (keyIsDown(65)) { dx -= rgtX; dz -= rgtZ; }
  if (keyIsDown(68)) { dx += rgtX; dz += rgtZ; }

  let len = sqrt(dx * dx + dz * dz);
  if (len > 0) { dx /= len; dz /= len; }

  px = constrain(px + dx * speed, -worldW / 2, worldW / 2);
  pz = constrain(pz + dz * speed, -worldD / 2, worldD / 2);
}

function applyGravity() {
  velY += GRAVITY;
  py   += velY;

  let gh      = getTerrainHeight(px, pz);
  let groundY = gh;

  onGround = false;

  if (py >= groundY) {
    py       = groundY;
    velY     = 0;
    onGround = true;
  }

  // Land on placed blocks
  for (let b of blocks) {
    let bTop = b.y - blockSize / 2;
    if (abs(px - b.x) < blockSize * 0.55 &&
        abs(pz - b.z) < blockSize * 0.55 &&
        py >= bTop - 2 && py <= bTop + max(velY + 4, 4)) {
      py       = bTop;
      velY     = 0;
      onGround = true;
    }
  }
}

// =====================================================
// INPUT
// =====================================================
function keyPressed() {
  if ((key === " " || keyCode === 32) && onGround) {
    velY     = JUMP_FORCE;
    onGround = false;
  }
  if (key >= "1" && key <= "7") selectedSlot = int(key) - 1;

  // Keyboard fallbacks
  if (key === "f" || key === "F") tryPlaceBlock();
  if (key === "x" || key === "X") tryDeleteBlock();
}

// mousePressed is only for single clicks (not hold)
// hold is handled in draw() above
function mousePressed() {
  if (!pointerLocked) return;
  if (mouseButton === LEFT  && placeCooldown  === 0) { if (tryPlaceBlock())  placeCooldown  = PLACE_COOLDOWN; }
  if (mouseButton === RIGHT && deleteCooldown === 0) { if (tryDeleteBlock()) deleteCooldown = PLACE_COOLDOWN; }
}

// =====================================================
// RAYCASTING – proper face-normal placement
// =====================================================
function computePreview() {
  buildPreview  = null;
  deletePreview = null;

  let eyeX = px;
  let eyeY = py - PLAYER_HEIGHT;
  let eyeZ = pz;

  let rdx = cos(pitch) * sin(yaw);
  let rdy = sin(pitch);
  let rdz = cos(pitch) * cos(yaw);

  // March along ray with fine steps
  let STEPS    = 80;
  let stepSize = REACH / STEPS;

  let prevX = snapG(eyeX);
  let prevY = snapG(eyeY);
  let prevZ = snapG(eyeZ);

  for (let s = 1; s <= STEPS; s++) {
    let rx = eyeX + rdx * stepSize * s;
    let ry = eyeY + rdy * stepSize * s;
    let rz = eyeZ + rdz * stepSize * s;

    let sx = snapG(rx);
    let sy = snapG(ry);
    let sz = snapG(rz);

    let hit = getBlock(sx, sy, sz);
    if (hit) {
      deletePreview = hit;
      // Place on the face we entered from (previous grid cell)
      let bt = BLOCK_TYPES[selectedSlot];
      buildPreview = {
        x: prevX, y: prevY, z: prevZ,
        color: bt.color, ghost: true
      };
      return;
    }

    prevX = sx; prevY = sy; prevZ = sz;
  }

  // No hit – show floating preview at reach end, snapped to grid
  let ex = eyeX + rdx * REACH;
  let ey = eyeY + rdy * REACH;
  let ez = eyeZ + rdz * REACH;
  let bt = BLOCK_TYPES[selectedSlot];
  buildPreview = {
    x: snapG(ex), y: snapG(ey), z: snapG(ez),
    color: bt.color, ghost: true
  };
}

function snapG(v) {
  return round(v / blockSize) * blockSize;
}

// =====================================================
// PLACE / DELETE
// =====================================================
function tryPlaceBlock() {
  if (!buildPreview) return false;

  // Don't place inside the player's bounding box
  let eyeY = py - PLAYER_HEIGHT;
  let dx   = abs(buildPreview.x - px);
  let dz   = abs(buildPreview.z - pz);
  let dy   = abs(buildPreview.y - py);
  if (dx < blockSize * 0.6 && dz < blockSize * 0.6 && dy < PLAYER_HEIGHT + blockSize * 0.5) return false;

  return addBlock(buildPreview.x, buildPreview.y, buildPreview.z,
                  BLOCK_TYPES[selectedSlot].color);
}

function tryDeleteBlock() {
  if (!deletePreview) return false;
  return removeBlock(deletePreview.x, deletePreview.y, deletePreview.z);
}

// =====================================================
// DRAW BLOCKS
// =====================================================
function drawBlock(b, isGhost) {
  push();
  translate(b.x, b.y, b.z);
  if (isGhost) {
    noFill();
    stroke(255, 255, 80, 200);
    strokeWeight(2);
  } else {
    fill(b.color[0], b.color[1], b.color[2]);
    noStroke();
  }
  box(blockSize);
  pop();
}

function drawBlockHighlight(b) {
  push();
  translate(b.x, b.y, b.z);
  noFill();
  stroke(255, 60, 60, 240);
  strokeWeight(3);
  box(blockSize * 1.05);
  pop();
}

// =====================================================
// TERRAIN
// =====================================================
function generateTerrain() {
  let yoff = 0;
  for (let y = 0; y < rows; y++) {
    terrain[y] = [];
    let xoff = 0;
    for (let x = 0; x < cols; x++) {
      terrain[y][x] = map(noise(xoff, yoff), 0, 1, -100, 100);
      xoff += 0.09;
    }
    yoff += 0.09;
  }
}

function getTerrainHeight(wx, wz) {
  let tx = constrain(int(map(wx, -worldW/2, worldW/2, 0, cols-1)), 0, cols-1);
  let tz = constrain(int(map(wz, -worldD/2, worldD/2, 0, rows-1)), 0, rows-1);
  return terrain[tz][tx];
}

function drawTerrain() {
  push();
  noStroke();
  translate(-worldW/2, 0, -worldD/2);
  for (let y = 0; y < rows - 1; y++) {
    beginShape(TRIANGLE_STRIP);
    for (let x = 0; x < cols; x++) {
      let h0 = terrain[y][x];
      let h1 = terrain[y+1][x];
      fill(map(h0, -100, 100, 30, 80), map(h0, -100, 100, 100, 160), 50);
      vertex(x * scl, h0, y * scl);
      fill(map(h1, -100, 100, 30, 80), map(h1, -100, 100, 100, 160), 50);
      vertex(x * scl, h1, (y+1) * scl);
    }
    endShape();
  }
  pop();
}

// =====================================================
// TREES & ROCKS
// =====================================================
function generateObjects() {
  for (let i = 0; i < 220; i++) {
    trees.push({
      x:  random(-worldW/2, worldW/2),
      z:  random(-worldD/2, worldD/2),
      sz: random(35, 70),
      alive: true
    });
  }
  for (let i = 0; i < 90; i++) {
    rocks.push({
      x:  random(-worldW/2, worldW/2),
      z:  random(-worldD/2, worldD/2),
      sz: random(20, 48),
      alive: true
    });
  }
}

function drawTrees() {
  for (let t of trees) {
    if (!t.alive) continue;
    let gh = getTerrainHeight(t.x, t.z);
    push();
    translate(t.x, gh - t.sz * 0.5, t.z);
    fill(110, 75, 35); noStroke();
    cylinder(t.sz * 0.13, t.sz);
    translate(0, -t.sz * 0.75, 0);
    fill(35, 150, 55);
    cone(t.sz * 0.7, t.sz * 1.6);
    pop();
  }
}

function drawRocks() {
  for (let r of rocks) {
    if (!r.alive) continue;
    let gh = getTerrainHeight(r.x, r.z);
    push();
    translate(r.x, gh - r.sz * 0.2, r.z);
    fill(125, 125, 125); noStroke();
    sphere(r.sz * 0.45, 6, 6);
    pop();
  }
}

// =====================================================
// GATHERING – press E near a tree/rock once per cooldown
// =====================================================
const GATHER_RADIUS = 110;

function checkGathering() {
  if (!keyIsDown(69) || gatherCooldown > 0) return;

  // Trees
  for (let t of trees) {
    if (!t.alive) continue;
    if (dist(px, pz, t.x, t.z) < GATHER_RADIUS) {
      inventory.wood += 3; // reward 3 logs per chop
      t.alive = false;
      // Respawn tree far away after a delay (simple: just relocate immediately)
      setTimeout(() => {
        t.x = random(-worldW/2, worldW/2);
        t.z = random(-worldD/2, worldD/2);
        t.alive = true;
      }, 8000);
      gatherCooldown = GATHER_CD;
      showGatherMsg("+3 Wood");
      return;
    }
  }

  // Rocks
  for (let r of rocks) {
    if (!r.alive) continue;
    if (dist(px, pz, r.x, r.z) < GATHER_RADIUS) {
      inventory.stone += 3;
      r.alive = false;
      setTimeout(() => {
        r.x = random(-worldW/2, worldW/2);
        r.z = random(-worldD/2, worldD/2);
        r.alive = true;
      }, 10000);
      gatherCooldown = GATHER_CD;
      showGatherMsg("+3 Stone");
      return;
    }
  }
}

// Floating gather message
let gatherMsg = "";
let gatherMsgTimer = 0;
function showGatherMsg(msg) {
  gatherMsg = msg;
  gatherMsgTimer = 90;
}

// =====================================================
// HUD
// =====================================================
function drawHUD() {
  push();
  translate(-width / 2, -height / 2);

  // ---- Crosshair ----
  stroke(255, 255, 255, 210);
  strokeWeight(1.5);
  let cx = width / 2, cy = height / 2;
  line(cx - 10, cy, cx + 10, cy);
  line(cx, cy - 10, cx, cy + 10);

  // Dot in centre
  fill(255, 255, 255, 180);
  noStroke();
  ellipse(cx, cy, 3, 3);

  // ---- Info panel top-left ----
  noStroke();
  fill(0, 0, 0, 155);
  rect(12, 12, 230, 145, 8);
  fill(255);
  textSize(14);
  textFont("monospace");
  text("Wood  : " + inventory.wood,  24, 38);
  text("Stone : " + inventory.stone, 24, 58);
  text("Blocks: " + blocks.length,   24, 78);
  text("X " + int(px) + "  Y " + int(py) + "  Z " + int(pz), 24, 98);
  fill(pointerLocked ? color(120, 255, 120) : color(255, 200, 80));
  text(pointerLocked ? "LOCKED – ESC to free" : "Click to capture mouse", 24, 118);
  fill(200, 200, 255);
  text("E to gather  (nearby tree/rock)", 24, 140);

  // ---- Gather message popup ----
  if (gatherMsgTimer > 0) {
    gatherMsgTimer--;
    let alpha = map(gatherMsgTimer, 0, 30, 0, 255);
    fill(80, 255, 120, alpha);
    textSize(22);
    textAlign(CENTER);
    text(gatherMsg, width / 2, height / 2 - 60);
    textAlign(LEFT);
  }

  // ---- Hotbar ----
  let slotSz  = 56;
  let padding = 6;
  let hotbarW = BLOCK_TYPES.length * slotSz + padding * 2;
  let hbX     = width / 2 - hotbarW / 2;
  let hbY     = height - 74;

  // Hotbar background
  fill(0, 0, 0, 160);
  rect(hbX - padding, hbY - padding, hotbarW + padding, slotSz + padding * 3, 10);

  for (let i = 0; i < BLOCK_TYPES.length; i++) {
    let sx = hbX + i * slotSz + 3;
    let sy = hbY + 1;
    let bt = BLOCK_TYPES[i];
    let sel = i === selectedSlot;

    // Slot background
    fill(sel ? color(255, 220, 60, 220) : color(60, 60, 60, 180));
    stroke(sel ? color(255, 255, 255, 200) : color(120, 120, 120, 100));
    strokeWeight(sel ? 2 : 1);
    rect(sx, sy, slotSz - 6, slotSz - 4, 6);

    // Block colour swatch
    noStroke();
    fill(bt.color[0], bt.color[1], bt.color[2]);
    rect(sx + 4, sy + 4, slotSz - 14, slotSz - 18, 4);

    // Number & name
    fill(sel ? color(20, 20, 20) : color(200, 200, 200));
    textSize(9);
    textFont("monospace");
    textAlign(CENTER);
    text(i + 1, sx + (slotSz - 6) / 2, sy + slotSz - 7);

    // Name tooltip on selected
    if (sel) {
      fill(255, 255, 100);
      textSize(12);
      text(bt.name, sx + (slotSz - 6) / 2, hbY - 10);
    }
  }
  textAlign(LEFT);

  // ---- Controls panel bottom-right ----
  fill(0, 0, 0, 145);
  rect(width - 218, height - 240, 206, 228, 8);
  fill(180, 180, 180);
  textSize(12);
  textFont("monospace");
  let cr  = width - 206;
  let cy2 = height - 225;
  let lh  = 18;
  text("WASD        move",       cr, cy2);
  text("SPACE       jump",       cr, cy2 + lh);
  text("SHIFT       sprint",     cr, cy2 + lh * 2);
  text("LMB / hold  place",      cr, cy2 + lh * 3);
  text("RMB / hold  break",      cr, cy2 + lh * 4);
  text("1-7         material",   cr, cy2 + lh * 5);
  text("Scroll      material",   cr, cy2 + lh * 6);
  text("E           gather",     cr, cy2 + lh * 7);
  text("F           place (alt)",cr, cy2 + lh * 8);
  text("X           break (alt)",cr, cy2 + lh * 9);
  text("ESC         free mouse", cr, cy2 + lh * 10);

  pop();
}

// =====================================================
// MISC
// =====================================================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}