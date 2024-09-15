const { Engine, Render, World, Bodies, Body, Events, Composite, Vector } =
  Matter;

let engine, render, world;
let walls = [],
  pegs = [],
  bins = [],
  invisibleWalls = [];
let canvasWidth, canvasHeight;
let activeBalls = [];
let pegPositions = [];
let ballRadius, pegRadius;
let balance = 1000;
let betAmount = 10;
let ballCount = 1;
let pyramidBounds = {};

function initGame() {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;

  engine = Engine.create({
    enableSleeping: false, // Prevent bodies from sleeping
  });
  world = engine.world;

  render = Render.create({
    canvas: document.getElementById("gameCanvas"),
    engine: engine,
    options: {
      width: canvasWidth,
      height: canvasHeight,
      wireframes: false,
      background: "#f0f0f0",
    },
  });

  createGame(8);

  Engine.run(engine);
  Render.run(render);
  updateBalanceDisplay();
}

function createGame(pyramidHeight) {
  Composite.clear(world);
  walls = [];
  pegs = [];
  bins = [];
  invisibleWalls = [];
  pegPositions = [];
  activeBalls = [];

  const wallThickness = canvasWidth * 0.02;
  walls = [
    Bodies.rectangle(canvasWidth / 2, 0, canvasWidth, wallThickness, {
      isStatic: true,
    }),
    Bodies.rectangle(
      canvasWidth / 2,
      canvasHeight,
      canvasWidth,
      wallThickness,
      { isStatic: true }
    ),
    Bodies.rectangle(0, canvasHeight / 2, wallThickness, canvasHeight, {
      isStatic: true,
    }),
    Bodies.rectangle(
      canvasWidth,
      canvasHeight / 2,
      wallThickness,
      canvasHeight,
      { isStatic: true }
    ),
  ];
  World.add(world, walls);

  const gameHeight = canvasHeight * 0.8;
  const gameWidth = canvasWidth * 0.8;

  ballRadius = Math.min(
    gameWidth / (pyramidHeight * 3),
    gameHeight / (pyramidHeight * 4)
  );
  pegRadius = ballRadius * 0.5; // Make pegs smaller than balls

  const verticalSpacing = gameHeight / (pyramidHeight + 1);
  const horizontalSpacing = pegRadius * 6;

  let maxRowWidth = 0;

  for (let row = 0; row < pyramidHeight; row++) {
    const pegsInThisRow = row + 2;
    const rowWidth = (pegsInThisRow - 1) * horizontalSpacing;
    maxRowWidth = Math.max(maxRowWidth, rowWidth);
    const startX = (canvasWidth - rowWidth) / 2;
    const y = canvasHeight * 0.1 + row * verticalSpacing;

    pegPositions[row] = [];

    for (let i = 0; i < pegsInThisRow; i++) {
      const x = startX + i * horizontalSpacing;
      const peg = Bodies.circle(x, y, pegRadius, {
        isStatic: true,
        render: { fillStyle: "#4a4a4a" },
        label: "peg",
      });
      pegs.push(peg);
      pegPositions[row].push({ x, y });
    }
  }
  World.add(world, pegs);

  const binWidth = horizontalSpacing;
  const binHeight = canvasHeight * 0.1;
  const binY = canvasHeight - binHeight / 2;

  for (let i = 0; i <= pyramidHeight; i++) {
    const x = (canvasWidth - maxRowWidth) / 2 + binWidth * i;
    const bin = Bodies.rectangle(x, binY, binWidth, binHeight, {
      isStatic: true,
      render: { fillStyle: "#87CEEB" },
      label: `bin_${i}`,
      multiplier: calculateMultiplier(i, pyramidHeight),
    });
    bins.push(bin);
  }
  World.add(world, bins);

  const pyramidTop = canvasHeight * 0.1;
  const pyramidBottom = binY - binHeight / 2;
  const pyramidLeft = pegPositions[pyramidHeight - 1][0].x;
  const pyramidRight =
    pegPositions[pyramidHeight - 1][pegPositions[pyramidHeight - 1].length - 1]
      .x;

  invisibleWalls = [
    Bodies.rectangle(
      pyramidLeft,
      (pyramidTop + pyramidBottom) / 2,
      wallThickness,
      pyramidBottom - pyramidTop,
      { isStatic: true, render: { visible: false } }
    ),
    Bodies.rectangle(
      pyramidRight,
      (pyramidTop + pyramidBottom) / 2,
      wallThickness,
      pyramidBottom - pyramidTop,
      { isStatic: true, render: { visible: false } }
    ),
  ];
  World.add(world, invisibleWalls);

  pyramidBounds = {
    top: pyramidTop,
    bottom: pyramidBottom,
    left: pyramidLeft,
    right: pyramidRight,
  };
}

function calculateMultiplier(binIndex, totalBins) {
  const middleBin = Math.floor(totalBins / 2);
  return Math.abs(binIndex - middleBin) + 1;
}

function dropBalls() {
  betAmount = parseInt(document.getElementById("betAmount").value);
  ballCount = parseInt(document.getElementById("ballCount").value);
  const totalBet = betAmount * ballCount;

  if (totalBet > balance) {
    alert("Insufficient balance!");
    return;
  }
  balance -= totalBet;
  updateBalanceDisplay();

  for (let i = 0; i < ballCount; i++) {
    setTimeout(() => {
      const ball = Bodies.circle(
        canvasWidth / 2 +
          (Math.random() - 0.5) *
            (pyramidBounds.right - pyramidBounds.left) *
            0.1,
        //   0.8,
        pyramidBounds.top - ballRadius,
        ballRadius,
        {
          restitution: 0.3,
          friction: 0.001,
          frictionAir: 0.001,
          density: 0.001,
          render: { fillStyle: "#FF5733" },
          label: "ball",
          collisionFilter: {
            group: -1,
          },
        }
      );
      World.add(world, ball);
      activeBalls.push(ball);
    }, i * 200);
  }
}

function resizeGame() {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  render.canvas.width = canvasWidth;
  render.canvas.height = canvasHeight;
  render.options.width = canvasWidth;
  render.options.height = canvasHeight;
  createGame(parseInt(document.getElementById("pyramidHeight").value));
}

function updateBalanceDisplay() {
  document.getElementById("balance").textContent = balance;
}

window.addEventListener("load", initGame);
window.addEventListener("resize", resizeGame);

document.getElementById("dropBalls").addEventListener("click", dropBalls);
document.getElementById("updateGame").addEventListener("click", function () {
  const height = parseInt(document.getElementById("pyramidHeight").value);
  createGame(height);
});

document.getElementById("pyramidHeight").addEventListener("input", function () {
  document.getElementById("heightValue").textContent = this.value;
});

Events.on(engine, "beforeUpdate", (event) => {
  activeBalls.forEach((ball, index) => {
    if (ball.position.y > pyramidBounds.bottom) {
      World.remove(world, ball);
      activeBalls.splice(index, 1);
    }

    // Apply a constant downward force to keep balls moving
    Body.applyForce(ball, ball.position, { x: 0, y: 0.0001 });

    // If a ball is moving too slowly, give it a small random impulse
    if (Vector.magnitude(ball.velocity) < 0.1) {
      const impulse = Vector.create(
        (Math.random() - 0.5) * 0.0005,
        Math.random() * 0.0005
      );
      Body.applyForce(ball, ball.position, impulse);
    }
  });
});

Events.on(engine, "collisionStart", (event) => {
  const pairs = event.pairs;
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const bin = pair.bodyA.label?.startsWith("bin_")
      ? pair.bodyA
      : pair.bodyB.label?.startsWith("bin_")
      ? pair.bodyB
      : null;
    const ball =
      pair.bodyA.label === "ball"
        ? pair.bodyA
        : pair.bodyB.label === "ball"
        ? pair.bodyB
        : null;
    const peg =
      pair.bodyA.label === "peg"
        ? pair.bodyA
        : pair.bodyB.label === "peg"
        ? pair.bodyB
        : null;

    if (bin && ball) {
      console.log(`Ball landed in bin ${bin.label}!`);
      const winnings = betAmount * bin.multiplier;
      balance += winnings;
      updateBalanceDisplay();

      World.remove(world, ball);
      const index = activeBalls.indexOf(ball);
      if (index > -1) {
        activeBalls.splice(index, 1);
      }

      if (activeBalls.length === 0) {
        alert(
          `All balls have landed! Total winnings: $${
            balance - (1000 - betAmount * ballCount)
          }`
        );
      }
    }

    if (ball && peg) {
      const direction = Math.random() < 0.5 ? -1 : 1;
      const force = Vector.create(direction * 0.0007, -0.0001);
      Body.applyForce(ball, ball.position, force);
    }
  }
});
