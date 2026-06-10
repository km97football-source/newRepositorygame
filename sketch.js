// =====================================================
// SURVIVAL WORLD 3D - MINECRAFT STYLE
// First Person + Raycasting Cursor + Auto Place
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
let gravity = 1.8;
let jumpForce = -22;
let moveSpeed = 6;
let sprintMult = 2.2;
const PLAYER_HEIGHT = 80;
const REACH = 350;

// --- Camera ---
let yaw = 0;
let pitch = 0;
let pointerLocked = false;

// --- Building ---
let blocks = [];
let blockSize = 50;
let buildPreview = null;
let deletePreview = null;
let autoPlaceTimer = 0;
const AUTO_PLACE_DELAY = 8; // frames between auto placements

const BLOCK_TYPES = [
  { name: "Wood",   color: [160, 110, 60]  },
  { name: "Stone",  color: [130, 130, 130] },
  { name: "Dirt",   color: [120, 80,  40]  },
  { name: "Glass",  color: [180, 220, 255] },
  { name: "Brick",  color: [180, 80,  60]  },
];
let selectedSlot = 0;

// --- Resources ---
let inventory = { wood: 50, stone: 50 };
let trees = [];
let rocks = [];

// --- Time ---
let timeOfDay = 0;

// --- Terrain height cache ---
let terrainHeightCache = {};

// =====================================================
// SETUP
// =====================================================
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  generateTerrain();
  generateObjects();
  frameRate(60);

  // Request pointer lock on canvas click
  let cnv = document.querySelector("canvas");
  cnv.addEventListener("click", () => {
    cnv.requestPointerLock();
  });
  document.addEventListener("pointerlockchange", () => {
    pointerLocked = document.pointerLockElement === cnv;
  });
  document.addEventListener("mousemove", (e) => {
    if (!pointerLocked) return;
    yaw   += e.movementX * 0.002;
    pitch += e.movementY * 0.002;
    pitch  = constrain(pitch, -PI / 2 + 0.05, PI / 2 - 0.05);
  });
  document.addEventListener("contextmenu", (e) => e.preventDefault());
}

// =====================================================
// DRAW LOOP
// =====================================================
function draw() {
  timeOfDay += 0.001;

  let skyBright = map(sin(timeOfDay), -1, 1, 15, 200);
  background(skyBright * 0.5, skyBright * 0.7, skyBright);

  // Lighting
  ambientLight(80 + skyBright * 0.4);
  directionalLight(255, 245, 220, -0.5, 1, -0.8);

  // Apply camera
  applyCamera();

  // World
  drawTerrain();
  drawTrees();
  drawRocks();

  // Blocks
  for (let b of blocks) drawBlock(b, false);

  // Build / delete preview
  computePreview();
  if (buildPreview) drawBlock(buildPreview, true);
  if (deletePreview) drawBlockHighlight(deletePreview);

  // Auto place on held left mouse
  if (mouseIsPressed && mouseButton === LEFT) {
    autoPlaceTimer++;
    if (autoPlaceTimer >= AUTO_PLACE_DELAY) {
      tryPlaceBlock();
      autoPlaceTimer = 0;
    }
  } else {
    autoPlaceTimer = 0;
  }

  // Physics + movement
  movePlayer();
  applyGravity();

  // Gathering
  checkGathering();

  // HUD (2D overlay)
  resetMatrix();
  camera();
  noLights();
  drawHUD();
}

// =====================================================
// CAMERA
// =====================================================
function applyCamera() {
  // Eye position
  let eyeX = px;
  let eyeY = py - PLAYER_HEIGHT;
  let eyeZ = pz;

  // Look direction from yaw/pitch
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
  let speed = moveSpeed * (keyIsDown(SHIFT) ? sprintMult : 1);

  // Flat forward/right vectors (ignore pitch for movement)
  let fwdX = sin(yaw);
  let fwdZ = cos(yaw);
  let rgtX = cos(yaw);
  let rgtZ = -sin(yaw);

  let dx = 0, dz = 0;
  if (keyIsDown(87)) { dx += fwdX; dz += fwdZ; }
  if (keyIsDown(83)) { dx -= fwdX; dz -= fwdZ; }
  if (keyIsDown(65)) { dx -= rgtX; dz -= rgtZ; }
  if (keyIsDown(68)) { dx += rgtX; dz += rgtZ; }

  // Normalize diagonal
  let len = sqrt(dx*dx + dz*dz);
  if (len > 0) { dx /= len; dz /= len; }

  px += dx * speed;
  pz += dz * speed;

  // Clamp to world
  px = constrain(px, -worldW/2, worldW/2);
  pz = constrain(pz, -worldD/2, worldD/2);
}

function applyGravity() {
  velY += gravity;
  py += velY;

  // Ground = terrain height at player position
  let gh = getTerrainHeight(px, pz);
  let groundY = gh - 10; // blocks sit at y=0 base

  if (py >= groundY) {
    py = groundY;
    velY = 0;
    onGround = true;
  } else {
    onGround = false;
  }

  // Also land on top of placed blocks
  for (let b of blocks) {
    let bTop = b.y - blockSize / 2;
    if (abs(px - b.x) < blockSize * 0.6 &&
        abs(pz - b.z) < blockSize * 0.6 &&
        py >= bTop - 4 && py <= bTop + velY + 4) {
      py = bTop;
      velY = 0;
      onGround = true;
    }
  }
}

function keyPressed() {
  // Jump
  if ((key === " " || keyCode === 32) && onGround) {
    velY = jumpForce;
    onGround = false;
  }

  // Hotbar
  if (key >= "1" && key <= "5") selectedSlot = int(key) - 1;

  // Place / delete
  if (key === "f" || key === "F") tryPlaceBlock();
  if (key === "x" || key === "X") tryDeleteBlock();
}

function mousePressed() {
  if (!pointerLocked) return;
  if (mouseButton === LEFT)  tryPlaceBlock();
  if (mouseButton === RIGHT) tryDeleteBlock();
}

// =====================================================
// RAYCASTING BUILD CURSOR
// =====================================================
function computePreview() {
  buildPreview  = null;
  deletePreview = null;

  // Ray from eye in look direction
  let eyeX = px;
  let eyeY = py - PLAYER_HEIGHT;
  let eyeZ = pz;

  let rdx = cos(pitch) * sin(yaw);
  let rdy = sin(pitch);
  let rdz = cos(pitch) * cos(yaw);

  // Step along ray, check block hits
  let steps = 60;
  let stepSize = REACH / steps;
  let lastEmpty = null;

  for (let s = 1; s <= steps; s++) {
    let rx = eyeX + rdx * stepSize * s;
    let ry = eyeY + rdy * stepSize * s;
    let rz = eyeZ + rdz * stepSize * s;

    let hit = getBlockAt(rx, ry, rz);
    if (hit) {
      deletePreview = hit;
      // Place on the face we came from (last empty slot)
      if (lastEmpty) {
        let bt = BLOCK_TYPES[selectedSlot];
        buildPreview = {
          x: lastEmpty.x, y: lastEmpty.y, z: lastEmpty.z,
          color: bt.color, ghost: true
        };
      }
      return;
    }

    // Snap this ray position to a grid cell
    lastEmpty = {
      x: snapG(rx),
      y: snapG(ry),
      z: snapG(rz)
    };
  }

  // No block hit — preview floats at reach distance on grid
  let rx = eyeX + rdx * REACH;
  let ry = eyeY + rdy * REACH;
  let rz = eyeZ + rdz * REACH;
  let bt = BLOCK_TYPES[selectedSlot];
  buildPreview = {
    x: snapG(rx), y: snapG(ry), z: snapG(rz),
    color: bt.color, ghost: true
  };
}

function snapG(v) {
  return round(v / blockSize) * blockSize;
}

function getBlockAt(wx, wy, wz) {
  let sx = snapG(wx), sy = snapG(wy), sz = snapG(wz);
  for (let b of blocks) {
    if (b.x === sx && b.y === sy && b.z === sz) return b;
  }
  return null;
}

// =====================================================
// PLACE / DELETE
// =====================================================
function tryPlaceBlock() {
  if (!buildPreview) return;
  // Don't place inside player
  let eyeY = py - PLAYER_HEIGHT;
  if (abs(buildPreview.x - px) < blockSize * 0.6 &&
      abs(buildPreview.z - pz) < blockSize * 0.6 &&
      abs(buildPreview.y - eyeY) < blockSize * 1.2) return;

  // Don't double-place
  if (getBlockAt(buildPreview.x, buildPreview.y, buildPreview.z)) return;

  let bt = BLOCK_TYPES[selectedSlot];
  blocks.push({ x: buildPreview.x, y: buildPreview.y, z: buildPreview.z, color: bt.color });
}

function tryDeleteBlock() {
  if (!deletePreview) return;
  blocks = blocks.filter(b => !(b.x === deletePreview.x && b.y === deletePreview.y && b.z === deletePreview.z));
}

// =====================================================
// DRAW BLOCK
// =====================================================
function drawBlock(b, isGhost) {
  push();
  translate(b.x, b.y, b.z);
  if (isGhost) {
    noFill();
    stroke(255, 255, 0, 200);
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
  stroke(255, 80, 80, 230);
  strokeWeight(3);
  box(blockSize * 1.04);
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
      terrain[y][x] = map(noise(xoff, yoff), 0, 1, -80, 80);
      xoff += 0.09;
    }
    yoff += 0.09;
  }
}

function getTerrainHeight(wx, wz) {
  // Convert world XZ to terrain grid indices
  let tx = int(map(wx, -worldW/2, worldW/2, 0, cols - 1));
  let tz = int(map(wz, -worldD/2, worldD/2, 0, rows - 1));
  tx = constrain(tx, 0, cols - 1);
  tz = constrain(tz, 0, rows - 1);
  return terrain[tz][tx]; // terrain y value (negative = up in p5 WEBGL)
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
      fill(40, 120 + h0 * 0.3, 50);
      vertex(x * scl, h0, y * scl);
      fill(40, 120 + h1 * 0.3, 50);
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
  for (let i = 0; i < 200; i++) {
    trees.push({ x: random(-worldW/2, worldW/2), z: random(-worldD/2, worldD/2), sz: random(30, 65) });
  }
  for (let i = 0; i < 80; i++) {
    rocks.push({ x: random(-worldW/2, worldW/2), z: random(-worldD/2, worldD/2), sz: random(18, 45) });
  }
}

function drawTrees() {
  for (let t of trees) {
    let gh = getTerrainHeight(t.x, t.z);
    push();
    translate(t.x, gh - t.sz * 0.5, t.z);
    fill(110, 75, 35); noStroke();
    cylinder(t.sz * 0.13, t.sz);
    translate(0, -t.sz * 0.7, 0);
    fill(30, 140, 50);
    cone(t.sz * 0.65, t.sz * 1.5);
    pop();
  }
}

function drawRocks() {
  for (let r of rocks) {
    let gh = getTerrainHeight(r.x, r.z);
    push();
    translate(r.x, gh - r.sz * 0.2, r.z);
    fill(120, 120, 120); noStroke();
    sphere(r.sz * 0.45, 6, 6);
    pop();
  }
}

// =====================================================
// GATHERING
// =====================================================
function checkGathering() {
  if (!keyIsDown(69)) return;
  for (let t of trees) {
    if (dist(px, pz, t.x, t.z) < 90) {
      inventory.wood++;
      t.x = random(-worldW/2, worldW/2);
      t.z = random(-worldD/2, worldD/2);
      break;
    }
  }
  for (let r of rocks) {
    if (dist(px, pz, r.x, r.z) < 90) {
      inventory.stone++;
      r.x = random(-worldW/2, worldW/2);
      r.z = random(-worldD/2, worldD/2);
      break;
    }
  }
}

// =====================================================
// HUD
// =====================================================
function drawHUD() {
  push();
  translate(-width/2, -height/2);

  // Crosshair
  stroke(255, 255, 255, 200);
  strokeWeight(1.5);
  let cx = width/2, cy = height/2;
  line(cx - 10, cy, cx + 10, cy);
  line(cx, cy - 10, cx, cy + 10);

  // Top-left info panel
  noStroke();
  fill(0, 0, 0, 160);
  rect(10, 10, 220, 130, 8);
  fill(255);
  textSize(15);
  textFont("monospace");
  text("🪵 Wood:  " + inventory.wood,  22, 35);
  text("🪨 Stone: " + inventory.stone, 22, 58);
  text("X: " + int(px) + "  Y: " + int(py) + "  Z: " + int(pz), 22, 82);
  text("Blocks: " + blocks.length, 22, 105);
  text(pointerLocked ? "🔒 LOCKED – ESC to free" : "🖱 Click to lock mouse", 22, 128);

  // Hotbar
  let slotSize = 52;
  let hotbarW = BLOCK_TYPES.length * slotSize + 10;
  let hotbarX = width/2 - hotbarW/2;
  let hotbarY = height - 72;

  fill(0, 0, 0, 160);
  rect(hotbarX - 5, hotbarY - 5, hotbarW + 10, slotSize + 20, 10);

  for (let i = 0; i < BLOCK_TYPES.length; i++) {
    let sx = hotbarX + i * slotSize + 4;
    let sy = hotbarY + 2;
    let bt = BLOCK_TYPES[i];

    // Slot bg
    fill(i === selectedSlot ? 255 : 60, i === selectedSlot ? 220 : 60, i === selectedSlot ? 60 : 60, 200);
    rect(sx, sy, slotSize - 8, slotSize - 8, 6);

    // Block colour swatch
    fill(bt.color[0], bt.color[1], bt.color[2]);
    rect(sx + 4, sy + 4, slotSize - 16, slotSize - 22, 4);

    // Label
    fill(255);
    textSize(10);
    textAlign(CENTER);
    text((i+1), sx + (slotSize-8)/2, sy + slotSize - 11);
  }

  textAlign(LEFT);

  // Controls reminder (bottom-right)
  fill(0, 0, 0, 140);
  rect(width - 210, height - 220, 200, 210, 8);
  fill(200, 200, 200);
  textSize(12);
  textFont("monospace");
  let cr = width - 198;wwww
  let cy2 = height - 200;
  let lh = 17;
  text("WASD    move",      cr, cy2);
  text("SPACE   jump",      cr, cy2+lh);
  text("SHIFT   sprint",    cr, cy2+lh*2);
  text("LMB     place",     cr, cy2+lh*3);
  text("RMB     delete",    cr, cy2+lh*4);
  text("Hold LMB auto",     cr, cy2+lh*5);
  text("1-5     material",  cr, cy2+lh*6);
  text("E       gather",    cr, cy2+lh*7);
  text("ESC     free mouse",cr, cy2+lh*8);
  text("F       place (alt)",cr, cy2+lh*9);
  text("X       delete (alt)",cr, cy2+lh*10);

  pop();
}

// =====================================================
// MISC
// =====================================================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}