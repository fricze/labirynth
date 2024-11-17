const screenWidth = getScreenWidth();
const screenHeight = getScreenHeight();

initWindow(screenWidth, screenHeight, "raylib. labirynth");

const screenWidth2 = getScreenWidth();
let topPos = 500;
let leftPos = screenWidth2 / 2 - 10;
let ySpeed = 0;
let xSpeed = 0;

const walls = [
  [100, 100, 20, 800],
  [900, 100, 20, 400],
  //
  [0, 100, 500, 20],
  [200, 800, getScreenWidth(), 20],
  [900, 100 + 400, 300, 20],
];

function rectangleToLines(rect) {
  const [x, y, width, height] = rect;
  return [
    [x, y, x + width, y],
    [x, y, x, y + height],
    [x + width, y, x + width, y + height],
    [x, y + height, x + width, y + height],
  ];
}

function checkCollisionBetweenLines(line1, line2) {
  const [x1, y1, x2, y2] = line1;
  const [x3, y3, x4, y4] = line2;

  const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denominator === 0) {
    return null;
  }

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1),
    };
  }

  return null;
}

const shadow = {
  x: 0,
  y: 0,
};

const camera = new Camera2D(Vector2(0, 0), Vector2(0, 0), 0.0, 0.8);

function normalizeVector(x, y) {
  const length = Math.sqrt(x * x + y * y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: x / length, y: y / length };
}

function makeTriangle(leftPos, topPos, oldLeft, oldTop) {
  const visionLength = 300; // Length of the vision cone
  const visionWidth = 90; // Width of the vision cone at the far end
  const direction = normalizeVector(leftPos - oldLeft, topPos - oldTop);

  const tipX = leftPos + direction.x * visionLength;
  const tipY = topPos + direction.y * visionLength;

  const perpX = -direction.y * (visionWidth / 2);
  const perpY = direction.x * (visionWidth / 2);

  const leftX = tipX + perpX;
  const leftY = tipY + perpY;

  const rightX = tipX - perpX;
  const rightY = tipY - perpY;

  return [
    Vector2(leftPos, topPos),
    Vector2(leftX, leftY),
    Vector2(rightX, rightY),
  ];
}

function distanceBetweenVectors(v1, v2) {
  return Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2);
}

function vectorsToLine(v1, v2) {
  return [v1.x, v1.y, v2.x, v2.y];
}

let cone = makeTriangle(0, 0, 0, 0);

setTargetFPS(60);
while (!windowShouldClose()) {
  const screenWidth = getScreenWidth();
  const screenHeight = getScreenHeight();

  const oldLeft = leftPos;
  const oldTop = topPos;

  const LOGS = [];

  if (isKeyPressed(KEY_ENTER)) {
    leftPos = screenWidth / 2 - 10;
  }

  if (isKeyDown(KEY_UP)) {
    topPos -= 10;
  }

  if (isKeyDown(KEY_DOWN)) {
    topPos += 10;
  }

  if (isKeyDown(KEY_LEFT)) {
    leftPos -= 10;
  }

  if (isKeyDown(KEY_RIGHT)) {
    leftPos += 10;
  }

  if (leftPos !== oldLeft || topPos !== oldTop) {
    cone = makeTriangle(leftPos, topPos, oldLeft, oldTop);
  }

  for (const wall of walls) {
    const playerCollide = checkCollisionCircleRec(
      new Vector2(leftPos, topPos),
      10,
      new Rectangle(...wall),
    );

    if (playerCollide) {
      leftPos = oldLeft;
      topPos = oldTop;
    }

    const wallLines = rectangleToLines(wall);
    const coneLine1 = vectorsToLine(cone[0], cone[1]);
    const coneLine2 = vectorsToLine(cone[0], cone[2]);

    const collisions1 = wallLines
      .map((wallLine) => checkCollisionBetweenLines(coneLine1, wallLine))
      .filter((x) => x)
      .sort(
        (a, b) =>
          distanceBetweenVectors(a, cone[0]) -
          distanceBetweenVectors(b, cone[0]),
      );

    const coll1 = collisions1.find((x) => x);
    if (coll1) {
      cone[1] = Vector2(coll1.x, coll1.y);
    }

    const collisions2 = wallLines
      .map((wallLine) => checkCollisionBetweenLines(coneLine2, wallLine))
      .filter((x) => x)
      .sort(
        (a, b) =>
          distanceBetweenVectors(a, cone[0]) -
          distanceBetweenVectors(b, cone[0]),
      );

    const coll2 = collisions2.find((val) => val);
    if (coll2) {
      cone[2] = Vector2(coll2.x, coll2.y);
    }
  }

  const xDiff = leftPos - oldLeft;
  const yDiff = topPos - oldTop;

  camera.target = new Vector2(camera.target.x + xDiff, camera.target.y + yDiff);

  shadow.x = 0;
  shadow.y = 0;

  if (isKeyDown(KEY_UP)) {
    shadow.y = -3;
  }

  if (isKeyDown(KEY_DOWN)) {
    shadow.y = 3;
  }

  if (isKeyDown(KEY_LEFT)) {
    shadow.x = -3;
  }

  if (isKeyDown(KEY_RIGHT)) {
    shadow.x = 3;
  }

  beginDrawing();

  clearBackground(BLACK);

  beginMode2D(camera);

  walls.forEach((rect) => {
    drawRectangle(...rect, DARKBLUE);
  });

  drawCircle(leftPos + shadow.x, topPos + shadow.y, 30, colorAlpha(RED, 0.3));
  drawCircle(leftPos, topPos, 20, RED);

  drawText(JSON.stringify(LOGS), 200, 200, 20, WHITE);

  drawTriangle(...cone, colorAlpha(YELLOW, 0.3));

  endMode2D();

  endDrawing();
}

closeWindow();
