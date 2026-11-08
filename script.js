const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const DEATH_QUOTES = [
  "может нахер этот квест?",
  "походу сегодня без баллов интуиции",
  "оррууууу",
  "царь вернулся",
  "пока ахуевшая",
  "походу тебе уготовлена другая роль",
  "ребеночек идет за тобой...",
  "НЕ питомец эвелины",
  "НЕ вписался в лор",
  "убит хтонью",
  "руки кривые прямо как рог"
];

let player = {
  x: 50,
  y: 350,
  w: 20,
  h: 30,
  vx: 0,
  vy: 0,
  speed: 4.5,
  jumpPower: -11.0,
  grounded: false
};

const keys = { left: false, right: false, jump: false };
let gameState = 'PLAYING';
let currentQuote = "";

let platforms = [];
let chthonEnemies = [];
// Поднятая дверь финиша на верхнем этаже
let exitDoor = { x: 720, y: 35, w: 30, h: 45 };

function initLevel() {
  player.x = 50;
  player.y = 350;
  player.vx = 0;
  player.vy = 0;
  gameState = 'PLAYING';
  document.getElementById('death-quote').classList.add('hidden');

  // Больше платформ, выстроенных в удобную и проходимую лестницу вверх
  platforms = [
    // Нижний ярус
    { x: 0, y: 400, w: 300, h: 50 },
    { x: 380, y: 400, w: 420, h: 50 },

    // Подъём наверх по ступенькам
    { x: 280, y: 320, w: 100, h: 15 },
    { x: 130, y: 260, w: 110, h: 15 },
    { x: 280, y: 200, w: 110, h: 15 },
    { x: 440, y: 250, w: 120, h: 15 },
    { x: 600, y: 200, w: 130, h: 15 },
    { x: 480, y: 130, w: 100, h: 15 },
    { x: 260, y: 120, w: 120, h: 15 },
    { x: 90, y: 140, w: 100, h: 15 },

    // Финальный верхний балкон с дверью
    { x: 660, y: 80, w: 140, h: 15 }
  ];

  // Хтони с адекватными, предсказуемыми траекториями
  chthonEnemies = [
    { x: 120, y: 370, w: 24, h: 30, speed: 1.2, minX: 20, maxX: 260 },
    { x: 450, y: 370, w: 24, h: 30, speed: 1.5, minX: 400, maxX: 750 },
    { x: 300, y: 170, w: 24, h: 30, speed: 1.0, minX: 270, maxX: 380 },
    { x: 620, y: 170, w: 24, h: 30, speed: 1.3, minX: 610, maxX: 720 }
  ];
}

function killPlayer() {
  if (gameState === 'DEAD') return;
  gameState = 'DEAD';

  currentQuote = DEATH_QUOTES[Math.floor(Math.random() * DEATH_QUOTES.length)];
  const qElem = document.getElementById('death-quote');
  qElem.innerText = currentQuote;
  qElem.classList.remove('hidden');

  setTimeout(() => {
    initLevel();
  }, 1500);
}

function update() {
  if (gameState !== 'PLAYING') return;

  if (keys.left) player.vx = -player.speed;
  else if (keys.right) player.vx = player.speed;
  else player.vx = 0;

  if (keys.jump && player.grounded) {
    player.vy = player.jumpPower;
    player.grounded = false;
  }

  player.vy += 0.5; // Комфортная гравитация

  player.x += player.vx;
  player.y += player.vy;
  player.grounded = false;

  // Границы экрана
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;

  // Коллизии платформ
  for (let p of platforms) {
    if (
      player.x < p.x + p.w &&
      player.x + player.w > p.x &&
      player.y + player.h >= p.y &&
      player.y + player.h <= p.y + p.h + player.vy
    ) {
      player.grounded = true;
      player.vy = 0;
      player.y = p.y - player.h;
    }
  }

  // Падение в провал
  if (player.y > canvas.height + 40) {
    killPlayer();
  }

  // Движение хтоней
  for (let enemy of chthonEnemies) {
    enemy.x += enemy.speed;
    if (enemy.x < enemy.minX || enemy.x > enemy.maxX) {
      enemy.speed *= -1;
    }

    if (
      player.x < enemy.x + enemy.w &&
      player.x + player.w > enemy.x &&
      player.y < enemy.y + enemy.h &&
      player.y + player.h > enemy.y
    ) {
      killPlayer();
    }
  }

  // Победа (достиг высокой двери)
  if (
    player.x < exitDoor.x + exitDoor.w &&
    player.x + player.w > exitDoor.x &&
    player.y < exitDoor.y + exitDoor.h &&
    player.y + player.h > exitDoor.y
  ) {
    gameState = 'WON';
    document.getElementById('victory-modal').classList.remove('hidden');
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Фон панелек
  ctx.fillStyle = "#14161d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0c0d12";
  ctx.fillRect(40, 50, 130, 400);
  ctx.fillRect(210, 30, 150, 420);
  ctx.fillRect(430, 60, 120, 390);
  ctx.fillRect(600, 40, 160, 410);

  // Окна
  ctx.fillStyle = "#1d2028";
  for(let bx = 60; bx < 750; bx += 55) {
    for(let by = 80; by < 380; by += 45) {
      if ((bx + by) % 3 === 0) {
        ctx.fillStyle = (bx + by) % 6 === 0 ? "#7a6e33" : "#1a1c23";
        ctx.fillRect(bx, by, 12, 16);
      }
    }
  }

  // Платформы
  for (let p of platforms) {
    ctx.fillStyle = "#333742";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = "#22252e";
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }

  // Хтони
  for (let enemy of chthonEnemies) {
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(
      enemy.x + enemy.w / 2, 
      enemy.y + enemy.h / 2, 
      enemy.w / 2, 
      enemy.h / 2, 
      0, 0, Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(enemy.x + 4, enemy.y + 8, 4, 4);
    ctx.fillRect(enemy.x + 14, enemy.y + 8, 4, 4);
  }

  // Дверь
  ctx.fillStyle = "#5c2b2b";
  ctx.fillRect(exitDoor.x, exitDoor.y, exitDoor.w, exitDoor.h);
  ctx.fillStyle = "#ffe600";
  ctx.fillRect(exitDoor.x + 4, exitDoor.y + 20, 4, 4);

  // Персонаж
  ctx.fillStyle = "#e67e22";
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(player.x + (keys.left ? 2 : 12), player.y + 6, 5, 5);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function restartGame() {
  document.getElementById('victory-modal').classList.add('hidden');
  initLevel();
}

// Управление клавиатурой
window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') keys.jump = true;
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') keys.jump = false;
});

// Сенсорное управление
const bindTouch = (id, keyName) => {
  const btn = document.getElementById(id);
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[keyName] = true; });
  btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[keyName] = false; });
  btn.addEventListener('mousedown', (e) => { keys[keyName] = true; });
  btn.addEventListener('mouseup', (e) => { keys[keyName] = false; });
};

bindTouch('btn-left', 'left');
bindTouch('btn-right', 'right');
bindTouch('btn-jump', 'jump');

initLevel();
gameLoop();
