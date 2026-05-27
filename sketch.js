// =====================================================
// COLLAPSING ARENA - MATTER.JS VERSION
// =====================================================

// =====================================================
// MODULE ALIASES
// =====================================================

var Engine = Matter.Engine,
	Runner = Matter.Runner,
	Bodies = Matter.Bodies,
	Body = Matter.Body,
	Composite = Matter.Composite,
	Events = Matter.Events;

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
let wallTop;

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

	// =========================================
	// ENGINE
	// =========================================

	engine = Engine.create();

	runner = Runner.create();

	Runner.run(
		runner,
		engine
	);

	// =========================================
	// PLAYER
	// =========================================

	player = Bodies.rectangle(

		width / 2,

		height / 2,

		40,

		40,

		{
			friction: 0.05,

			restitution: 0.1,

			inertia: Infinity
		}
	);

	// =========================================
	// WALLS
	// =========================================

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

	wallTop = Bodies.rectangle(

		width / 2,

		height / 2 - arenaSize / 2,

		arenaSize,

		40,

		{
			isStatic: true
		}
	);

	// =========================================
	// ADD OBJECTS
	// =========================================

	Composite.add(

		engine.world,

		[
			player,
			ground,
			wallLeft,
			wallRight,
			wallTop
		]
	);

	// =========================================
	// COLLISION
	// =========================================

	Events.on(

		engine,

		"collisionStart",

		function(event) {

			if (invincible) return;

			let pairs = event.pairs;

			for (let pair of pairs) {

				let bodyA = pair.bodyA;
				let bodyB = pair.bodyB;

				if (
					bodyA === player ||
					bodyB === player
				) {

					for (let block of blocks) {

						if (
							bodyA === block ||
							bodyB === block
						) {

							state = "gameover";
						}
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

	removeBlocks();

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

	rotate(player.angle);

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
			? 0.006
			: 0.003;

	if (keyIsDown(87)) {

		Body.applyForce(

			player,

			player.position,

			{
				x: 0,
				y: -speed
			}
		);
	}

	if (keyIsDown(83)) {

		Body.applyForce(

			player,

			player.position,

			{
				x: 0,
				y: speed
			}
		);
	}

	if (keyIsDown(65)) {

		Body.applyForce(

			player,

			player.position,

			{
				x: -speed,
				y: 0
			}
		);
	}

	if (keyIsDown(68)) {

		Body.applyForce(

			player,

			player.position,

			{
				x: speed,
				y: 0
			}
		);
	}
}

// =====================================================
// SPAWN BLOCKS
// =====================================================

function spawnBlocks() {

	let spawnRate =
		max(12, 50 - survivalTime * 2);

	if (
		frameCount % floor(spawnRate) === 0
	) {

		let size =
			random(40, 120);

		let block =
			Bodies.rectangle(

				random(
					width / 2 -
					arenaSize / 2 + 80,

					width / 2 +
					arenaSize / 2 - 80
				),

				-100,

				size,

				size,

				{
					friction: 0.02,

					restitution: 0.2,

					density: 0.01
				}
			);

		blocks.push(block);

		Composite.add(
			engine.world,
			block
		);
	}
}

// =====================================================
// REMOVE BLOCKS
// =====================================================

function removeBlocks() {

	for (
		let i = blocks.length - 1;
		i >= 0;
		i--
	) {

		if (
			blocks[i].position.y >
			height + 300
		) {

			Composite.remove(
				engine.world,
				blocks[i]
			);

			blocks.splice(i, 1);
		}
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

			Body.applyForce(

				player,

				player.position,

				{
					x: dx * 0.0008,

					y: dy * 0.0008
				}
			);
		}
	}
}

// =====================================================
// ARENA
// =====================================================

function updateArena() {

	shrinkTimer++;

	if (shrinkTimer > 120) {

		shrinkTimer = 0;

		arenaSize -= 8;

		arenaSize =
			max(220, arenaSize);
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

	Body.setVelocity(
		player,
		{
			x: 0,
			y: 0
		}
	);

	survivalTime = 0;

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