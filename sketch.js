// =====================================================
// COLLAPSING ARENA - FULL WORKING VERSION
// =====================================================

// =====================================================
// MODULES
// =====================================================

var Engine = Matter.Engine;
var Runner = Matter.Runner;
var Bodies = Matter.Bodies;
var Body = Matter.Body;
var Composite = Matter.Composite;
var Events = Matter.Events;

// =====================================================
// ENGINE
// =====================================================

let engine;
let runner;

// =====================================================
// GAME OBJECTS
// =====================================================

let player;

let blocks = [];

let ground;

let wallLeft;
let wallRight;

// =====================================================
// GAME VARIABLES
// =====================================================

let survivalTime = 0;

let state = "menu";

let arenaSize = 900;

let shrinkTimer = 0;

// =====================================================
// ABILITIES
// =====================================================

let abilities = {

	speedBoost: false,

	smallPlayer: false,

	ultraInstinct: false
};

// =====================================================
// INVINCIBILITY
// =====================================================

let invincible = false;

let invincibleDuration = 7000;

let invincibleCooldown = 10000;

let invincibleStartTime = 0;

let invincibleCooldownStart = 0;

let canUseInvincible = true;

// =====================================================
// BUTTONS
// =====================================================

let playBtn;
let shopBtn;
let backBtn;

let speedBtn;
let smallBtn;
let ultraBtn;
let invincibleBtn;

// =====================================================
// SETUP
// =====================================================

function setup() {

	createCanvas(
		windowWidth,
		windowHeight
	);

	// =================================================
	// ENGINE
	// =================================================

	engine = Engine.create();

	engine.world.gravity.y = 1;

	runner = Runner.create();

	Runner.run(
		runner,
		engine
	);

	// =================================================
	// PLAYER
	// =================================================

	player = Bodies.rectangle(

		width / 2,

		height / 2,

		40,

		40,

		{
			isStatic: true,

			inertia: Infinity
		}
	);

	// =================================================
	// WALLS
	// =================================================

	ground = Bodies.rectangle(

		width / 2,

		height + 20,

		width,

		40,

		{
			isStatic: true
		}
	);

	wallLeft = Bodies.rectangle(

		width / 2 - arenaSize / 2,

		height / 2,

		40,

		arenaSize,

		{
			isStatic: true
		}
	);

	wallRight = Bodies.rectangle(

		width / 2 + arenaSize / 2,

		height / 2,

		40,

		arenaSize,

		{
			isStatic: true
		}
	);

	// =================================================
	// ADD OBJECTS
	// =================================================

	Composite.add(

		engine.world,

		[
			player,
			ground,
			wallLeft,
			wallRight
		]
	);

	// =================================================
	// COLLISIONS
	// =================================================

	Events.on(

		engine,

		"collisionStart",

		function(event) {

			let pairs = event.pairs;

			for (let pair of pairs) {

				let bodyA = pair.bodyA;
				let bodyB = pair.bodyB;

				// =====================================
				// PLAYER HIT
				// =====================================

				if (!invincible) {

					if (
						(bodyA === player &&
						blocks.includes(bodyB)) ||

						(bodyB === player &&
						blocks.includes(bodyA))
					) {

						state = "gameover";
					}
				}

				// =====================================
				// REMOVE BLOCKS
				// =====================================

				if (
					(bodyA === ground &&
					blocks.includes(bodyB)) ||

					(bodyB === ground &&
					blocks.includes(bodyA))
				) {

					let block =
						bodyA === ground
							? bodyB
							: bodyA;

					Composite.remove(
						engine.world,
						block
					);

					let index =
						blocks.indexOf(block);

					if (index !== -1) {

						blocks.splice(index, 1);
					}
				}
			}
		}
	);

	setupButtons();

	updateUI();
}

// =====================================================
// DRAW
// =====================================================

function draw() {

	background(10);

	if (state === "menu") {

		drawMenu();

		return;
	}

	if (state === "shop") {

		drawShop();

		return;
	}

	if (state === "game") {

		runGame();

		return;
	}

	if (state === "gameover") {

		drawGameOver();

		return;
	}
}

// =====================================================
// GAME LOOP
// =====================================================

function runGame() {

	survivalTime += deltaTime / 1000;

	updatePlayer();

	updateArena();

	updateInvincibility();

	spawnBlocks();

	if (abilities.ultraInstinct) {

		autoDodge();
	}

	drawBodies();

	drawHUD();

	drawArena();
}

// =====================================================
// DRAW BODIES
// =====================================================

function drawBodies() {

	// PLAYER

	push();

	translate(
		player.position.x,
		player.position.y
	);

	rectMode(CENTER);

	noStroke();

	if (invincible) {

		fill(255, 255, 0);

	} else {

		fill(0, 255, 255);
	}

	let playerSize =
		abilities.smallPlayer
			? 25
			: 40;

	rect(
		0,
		0,
		playerSize,
		playerSize
	);

	pop();

	// BLOCKS

	fill(255, 100, 100);

	noStroke();

	for (let b of blocks) {

		push();

		translate(
			b.position.x,
			b.position.y
		);

		rotate(b.angle);

		rectMode(CENTER);

		rect(

			0,

			0,

			b.bounds.max.x -
			b.bounds.min.x,

			b.bounds.max.y -
			b.bounds.min.y
		);

		pop();
	}
}

// =====================================================
// PLAYER MOVEMENT
// =====================================================

function updatePlayer() {

	let speed =
		abilities.speedBoost
			? 12
			: 8;

	let moveX = 0;
	let moveY = 0;

	if (keyIsDown(87)) {

		moveY -= speed;
	}

	if (keyIsDown(83)) {

		moveY += speed;
	}

	if (keyIsDown(65)) {

		moveX -= speed;
	}

	if (keyIsDown(68)) {

		moveX += speed;
	}

	Body.setPosition(player, {

		x:
			player.position.x +
			moveX,

		y:
			player.position.y +
			moveY
	});

	// KEEP PLAYER INSIDE ARENA

	Body.setPosition(player, {

		x: constrain(

			player.position.x,

			width / 2 -
			arenaSize / 2 + 30,

			width / 2 +
			arenaSize / 2 - 30
		),

		y: constrain(

			player.position.y,

			height / 2 -
			arenaSize / 2 + 30,

			height / 2 +
			arenaSize / 2 - 30
		)
	});
}

// =====================================================
// SPAWN BLOCKS
// =====================================================

function spawnBlocks() {

	let level = 1;

	if (survivalTime > 20) level = 2;
	if (survivalTime > 40) level = 3;
	if (survivalTime > 60) level = 4;
	if (survivalTime > 90) level = 5;

	let spawnRate = 60;

	let minFallSpeed = 5;
	let maxFallSpeed = 8;

	if (level === 2) {

		spawnRate = 50;

		minFallSpeed = 6;
		maxFallSpeed = 9;
	}

	if (level === 3) {

		spawnRate = 40;

		minFallSpeed = 7;
		maxFallSpeed = 10;
	}

	if (level === 4) {

		spawnRate = 30;

		minFallSpeed = 8;
		maxFallSpeed = 12;
	}

	if (level === 5) {

		spawnRate = 22;

		minFallSpeed = 10;
		maxFallSpeed = 14;
	}

	if (
		frameCount % spawnRate === 0
	) {

		let size =
			random(40, 120);

		let spawnX =
			random(

				width / 2 -
				arenaSize / 2 + 80,

				width / 2 +
				arenaSize / 2 - 80
			);

		let block =
			Bodies.rectangle(

				spawnX,

				-100,

				size,

				size,

				{
					friction: 0.05,

					restitution: 0.2,

					density: 0.002
				}
			);

		// =====================================
		// MAKE BLOCKS FALL
		// =====================================

		Body.setVelocity(block, {

			x: random(-2, 2),

			y: random(
				minFallSpeed,
				maxFallSpeed
			)
		});

		// =====================================
		// RANDOM SPIN
		// =====================================

		Body.setAngularVelocity(
			block,
			random(-0.1, 0.1)
		);

		blocks.push(block);

		Composite.add(
			engine.world,
			block
		);
	}
}

// =====================================================
// ULTRA INSTINCT
// =====================================================

function autoDodge() {

	for (let b of blocks) {

		let distance =
			dist(

				player.position.x,

				player.position.y,

				b.position.x,

				b.position.y
			);

		if (distance < 150) {

			let dx =
				player.position.x -
				b.position.x;

			let dy =
				player.position.y -
				b.position.y;

			Body.setPosition(player, {

				x:
					player.position.x +
					dx * 0.08,

				y:
					player.position.y +
					dy * 0.08
			});
		}
	}
}

// =====================================================
// ARENA SHRINK
// =====================================================

function updateArena() {

	shrinkTimer++;

	if (shrinkTimer > 120) {

		shrinkTimer = 0;

		arenaSize -= 8;

		arenaSize =
			max(220, arenaSize);

		Body.setPosition(

			wallLeft,

			{
				x:
					width / 2 -
					arenaSize / 2,

				y:
					height / 2
			}
		);

		Body.setPosition(

			wallRight,

			{
				x:
					width / 2 +
					arenaSize / 2,

				y:
					height / 2
			}
		);
	}
}

// =====================================================
// INVINCIBILITY
// =====================================================

function updateInvincibility() {

	if (
		invincible &&
		millis() -
		invincibleStartTime >=
		invincibleDuration
	) {

		invincible = false;

		invincibleCooldownStart =
			millis();
	}

	if (
		!canUseInvincible &&
		!invincible &&
		millis() -
		invincibleCooldownStart >=
		invincibleCooldown
	) {

		canUseInvincible = true;
	}
}

// =====================================================
// HUD
// =====================================================

function drawHUD() {

	fill(255);

	textSize(24);

	textAlign(LEFT);

	text(

		"TIME: " +
		survivalTime.toFixed(1),

		20,

		40
	);

	let best = Number(

		localStorage.getItem(
			"collapseArenaBest"
		) || 0
	);

	if (survivalTime > best) {

		localStorage.setItem(

			"collapseArenaBest",

			survivalTime
		);

		best = survivalTime;
	}

	text(

		"PR: " +
		best.toFixed(1),

		20,

		80
	);

	let level = 1;

	if (survivalTime > 20) level = 2;
	if (survivalTime > 40) level = 3;
	if (survivalTime > 60) level = 4;
	if (survivalTime > 90) level = 5;

	text(

		"LEVEL: " + level,

		20,

		120
	);

	if (invincible) {

		fill(255, 255, 0);

		text(

			"INVINCIBLE",

			20,

			160
		);
	}
}

// =====================================================
// DRAW ARENA
// =====================================================

function drawArena() {

	noFill();

	stroke(100, 180, 255);

	strokeWeight(5);

	rectMode(CENTER);

	rect(

		width / 2,

		height / 2,

		arenaSize,

		arenaSize
	);
}

// =====================================================
// MENU
// =====================================================

function drawMenu() {

	fill(255);

	textAlign(CENTER);

	textSize(70);

	text(

		"COLLAPSING ARENA",

		width / 2,

		height / 3
	);

	textSize(24);

	text(

		"Use WASD to survive",

		width / 2,

		height / 3 + 60
	);
}

// =====================================================
// SHOP
// =====================================================

function drawShop() {

	fill(255);

	textAlign(CENTER);

	textSize(60);

	text(
		"SHOP",
		width / 2,
		120
	);
}

// =====================================================
// GAME OVER
// =====================================================

function drawGameOver() {

	background(0, 180);

	fill(255, 60, 60);

	textAlign(CENTER);

	textSize(70);

	text(

		"GAME OVER",

		width / 2,

		height / 2 - 40
	);

	fill(255);

	textSize(30);

	text(

		"Press R to Restart",

		width / 2,

		height / 2 + 40
	);
}

// =====================================================
// BUTTONS
// =====================================================

function setupButtons() {

	playBtn = createButton("PLAY");

	playBtn.mousePressed(() => {

		resetGame();

		state = "game";

		updateUI();
	});

	shopBtn = createButton("SHOP");

	shopBtn.mousePressed(() => {

		state = "shop";

		updateUI();
	});

	backBtn = createButton("BACK");

	backBtn.mousePressed(() => {

		state = "menu";

		updateUI();
	});

	speedBtn =
		createButton("TOGGLE SPEED");

	speedBtn.mousePressed(() => {

		abilities.speedBoost =
			!abilities.speedBoost;
	});

	smallBtn =
		createButton("TOGGLE SMALL");

	smallBtn.mousePressed(() => {

		abilities.smallPlayer =
			!abilities.smallPlayer;
	});

	ultraBtn =
		createButton("TOGGLE ULTRA");

	ultraBtn.mousePressed(() => {

		abilities.ultraInstinct =
			!abilities.ultraInstinct;
	});

	invincibleBtn =
		createButton(
			"INVINCIBILITY"
		);

	invincibleBtn.mousePressed(() => {

		if (
			canUseInvincible &&
			!invincible
		) {

			invincible = true;

			canUseInvincible = false;

			invincibleStartTime =
				millis();
		}
	});
}

// =====================================================
// UPDATE UI
// =====================================================

function updateUI() {

	playBtn.hide();
	shopBtn.hide();
	backBtn.hide();

	speedBtn.hide();
	smallBtn.hide();
	ultraBtn.hide();
	invincibleBtn.hide();

	if (state === "menu") {

		playBtn.show();

		shopBtn.show();

		playBtn.position(
			width / 2 - 60,
			height / 2 - 50
		);

		shopBtn.position(
			width / 2 - 60,
			height / 2 + 20
		);
	}

	if (state === "shop") {

		backBtn.show();

		speedBtn.show();

		smallBtn.show();

		ultraBtn.show();

		invincibleBtn.show();

		backBtn.position(20, 20);

		speedBtn.position(
			width / 2 - 120,
			height / 2 - 100
		);

		smallBtn.position(
			width / 2 - 120,
			height / 2 - 40
		);

		ultraBtn.position(
			width / 2 - 120,
			height / 2 + 20
		);

		invincibleBtn.position(
			width / 2 - 120,
			height / 2 + 80
		);
	}
}

// =====================================================
// RESET GAME
// =====================================================

function resetGame() {

	for (let b of blocks) {

		Composite.remove(
			engine.world,
			b
		);
	}

	blocks = [];

	Body.setPosition(
		player,
		{
			x: width / 2,
			y: height / 2
		}
	);

	survivalTime = 0;

	arenaSize = 900;

	state = "game";

	invincible = false;

	canUseInvincible = true;
}

// =====================================================
// KEYS
// =====================================================

function keyPressed() {

	if (
		key === "r" ||
		key === "R"
	) {

		resetGame();
	}
}