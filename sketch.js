// =====================================================
// SURVIVAL WORLD 3D - BUILDING VERSION
// FULL COPY/PASTE FOR OPENPROCESSING
// =====================================================

let terrain = [];
let cols, rows;
let scl = 40;
let worldSize = 120;

let playerX = 0;
let playerZ = 0;
let playerAngle = 0;
let moveSpeed = 10;

let trees = [];
let rocks = [];
let buildings = [];

let buildMode = "wood";

let timeOfDay = 0;

let inventory = {
  wood: 0,
  stone: 0
};

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  cols = worldSize;
  rows = worldSize;

  generateTerrain();
  generateObjects();
}

function draw() {

  updateTime();

  let sky = map(
    sin(timeOfDay),
    -1,
    1,
    20,
    180
  );

  background(
    sky,
    sky + 30,
    sky + 50
  );

  camera(
    playerX,
    -350,
    playerZ + 350,

    playerX,
    0,
    playerZ,

    0,
    1,
    0
  );

  ambientLight(120);

  directionalLight(
    255,
    255,
    220,
    -1,
    1,
    -1
  );

  drawTerrain();
  drawTrees();
  drawRocks();
  drawBuildings();

  drawPlayer();

  checkGathering();

  resetMatrix();
  camera();

  drawUI();
}

function updateTime() {
  timeOfDay += 0.002;
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

      terrain[y][x] = map(
        noise(xoff, yoff),
        0,
        1,
        -120,
        120
      );

      xoff += 0.08;
    }

    yoff += 0.08;
  }
}

function drawTerrain() {

  push();

  rotateX(PI / 3);

  translate(
    -cols * scl / 2,
    -rows * scl / 2
  );

  noStroke();

  for (let y = 0; y < rows - 1; y++) {

    beginShape(TRIANGLE_STRIP);

    for (let x = 0; x < cols; x++) {

      fill(
        40,
        130 + terrain[y][x] * 0.2,
        50
      );

      vertex(
        x * scl,
        y * scl,
        terrain[y][x]
      );

      vertex(
        x * scl,
        (y + 1) * scl,
        terrain[y + 1][x]
      );
    }

    endShape();
  }

  pop();
}

// =====================================================
// OBJECTS
// =====================================================

function generateObjects() {

  for (let i = 0; i < 300; i++) {

    trees.push({
      x: random(-2000, 2000),
      z: random(-2000, 2000),
      size: random(30, 70)
    });
  }

  for (let i = 0; i < 120; i++) {

    rocks.push({
      x: random(-2000, 2000),
      z: random(-2000, 2000),
      size: random(20, 50)
    });
  }
}

// =====================================================
// TREES
// =====================================================

function drawTrees() {

  for (let t of trees) {

    push();

    translate(
      t.x,
      -20,
      t.z
    );

    fill(100, 70, 30);

    cylinder(
      t.size * 0.15,
      t.size
    );

    translate(
      0,
      -t.size * 0.7,
      0
    );

    fill(20, 130, 40);

    cone(
      t.size * 0.7,
      t.size * 1.6
    );

    pop();
  }
}

// =====================================================
// ROCKS
// =====================================================

function drawRocks() {

  for (let r of rocks) {

    push();

    translate(
      r.x,
      0,
      r.z
    );

    fill(130);

    sphere(
      r.size * 0.5,
      6,
      6
    );

    pop();
  }
}

// =====================================================
// BUILDINGS
// =====================================================

function drawBuildings() {

  for (let b of buildings) {

    push();

    translate(
      b.x,
      -25,
      b.z
    );

    if (b.type === "wood") {
      fill(160, 110, 60);
    } else {
      fill(140);
    }

    box(50);

    pop();
  }
}

// =====================================================
// PLAYER
// =====================================================

function drawPlayer() {

  movePlayer();

  push();

  translate(
    playerX,
    -10,
    playerZ
  );

  fill(0, 150, 255);
  sphere(18);

  push();

  rotateY(playerAngle);

  translate(
    0,
    0,
    -25
  );

  fill(120, 80, 40);

  box(
    4,
    4,
    30
  );

  translate(
    8,
    0,
    -8
  );

  fill(180);

  box(
    10,
    10,
    4
  );

  pop();

  pop();
}

function movePlayer() {

  let dx = 0;
  let dz = 0;

  if (keyIsDown(87)) dz -= 1;
  if (keyIsDown(83)) dz += 1;
  if (keyIsDown(65)) dx -= 1;
  if (keyIsDown(68)) dx += 1;

  if (dx !== 0 || dz !== 0) {

    let len = sqrt(
      dx * dx +
      dz * dz
    );

    dx /= len;
    dz /= len;

    playerX += dx * moveSpeed;
    playerZ += dz * moveSpeed;

    playerAngle =
      atan2(dx, dz);
  }
}

// =====================================================
// GATHERING
// =====================================================

function checkGathering() {

  if (!keyIsDown(69))
    return;

  for (let t of trees) {

    let d = dist(
      playerX,
      playerZ,
      t.x,
      t.z
    );

    if (d < 80) {

      inventory.wood++;

      t.x = random(-2000, 2000);
      t.z = random(-2000, 2000);

      break;
    }
  }

  for (let r of rocks) {

    let d = dist(
      playerX,
      playerZ,
      r.x,
      r.z
    );

    if (d < 80) {

      inventory.stone++;

      r.x = random(-2000, 2000);
      r.z = random(-2000, 2000);

      break;
    }
  }
}

// =====================================================
// BUILDING
// =====================================================

function keyPressed() {

  if (key === "1") {
    buildMode = "wood";
  }

  if (key === "2") {
    buildMode = "stone";
  }

  if (key === "b" || key === "B") {

    let buildX =
      playerX +
      sin(playerAngle) * 80;

    let buildZ =
      playerZ +
      cos(playerAngle) * 80;

    if (
      buildMode === "wood" &&
      inventory.wood > 0
    ) {

      inventory.wood--;

      buildings.push({
        x: buildX,
        z: buildZ,
        type: "wood"
      });
    }

    if (
      buildMode === "stone" &&
      inventory.stone > 0
    ) {

      inventory.stone--;

      buildings.push({
        x: buildX,
        z: buildZ,
        type: "stone"
      });
    }
  }
}

// =====================================================
// UI
// =====================================================

function drawUI() {

  push();

  translate(
    -width / 2,
    -height / 2
  );

  noStroke();

  fill(0, 180);

  rect(
    15,
    15,
    330,
    310,
    12
  );

  fill(255);

  textSize(22);

  text(
    "SURVIVAL WORLD",
    30,
    45
  );

  text(
    "Wood: " + inventory.wood,
    30,
    85
  );

  text(
    "Stone: " + inventory.stone,
    30,
    115
  );

  text(
    "Build Mode: " + buildMode,
    30,
    145
  );

  text(
    "1 = Wood Mode",
    30,
    175
  );

  text(
    "2 = Stone Mode",
    30,
    205
  );

  text(
    "B = Place Block",
    30,
    235
  );

  text(
    "WASD = Move",
    30,
    265
  );

  text(
    "E = Gather",
    30,
    295
  );

  pop();
}

// =====================================================
// RESIZE
// =====================================================

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );
}