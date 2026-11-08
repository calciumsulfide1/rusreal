const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Объединенные ехидные комментарии смерти (включая бывшие ачивки)
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
  x: 40,
  y: 340,
  w: 20,
  h: 30,
  vx: 0,
  vy: 0,
  speed: 4.0,
  jumpPower: -10.5,
  grounded: false
};

const keys = { left: false, right: false, jump: false };
let gameState = 'PLAYING'; // PLAYING, DEAD, WON
let currentQuote = "";

let platforms = [];
let chthonEnemies = [];
let exitDoor = { x: 740, y: 75, w: 30, h: 45 };

function initLevel() {
  player.x = 40;
  player.y = 340;
  player.vx = 0;
  player.vy = 0;
  gameState = 'PLAYING';
  document.getElementById('death-quote').classList.add('hidden');

  // Платформы выстроены так, чтобы логика уровня была проходимой при аккуратном тайминге
  platforms = [
    // Земля
    { x: 0, y: 400, w: 240, h: 50, type: 'normal' },
    { x: 290, y: 400, w: 200, h: 50, type: 'normal' },
    { x: 540, y: 400, w: 260, h: 50, type: 'normal' },

    // Осторожная падающая платформа (падает медленнее, давая время оттолкнуться)
    { x: 150, y: 310, w: 90, h: 15, type: 'fake_fall', triggered: false, vy: 0 },
    
    // Бетонные балконы
    { x: 40, y: 220, w: 100, h: 15, type: 'normal' },
    { x: 190, y: 170, w: 120, h: 15, type: 'normal' },
    { x: 360, y: 230, w: 100, h: 15, type: 'normal' },
    { x: 500, y: 170, w: 110, h: 15, type: 'normal' },
    { x: 640, y: 120, w: 160, h: 15, type: 'normal' }, // Платформа с выходом

    // Проходимый перекат перед финишем
    { x: 610, y: 230, w: 70, h: 15, type: 'normal' }
  ];

  // Враги: Безликие черные хтони со стабильной траекторией
  chthonEnemies = [
    { x: 310, y: 370, w: 24, h: 30, speed: 1.2, minX: 290, maxX: 450 },
    { x: 210, y: 140, w: 24, h: 30, speed: 1.5, minX: 195, maxX: 280 },
    { x: 520, y: 140, w: 24, h: 30, speed: 1.8, minX: 505, maxX: 580 },
    { x: 60, y: 190, w: 24, h: 30, speed: 1.0, minX: 45, maxX: 110 }
  ];
}

// Обработка гибели
function killPlayer() {
  if (gameState === 'DEAD') return;
  gameState = 'DEAD';

  currentQuote = DEATH_QUOTES[Math.floor(Math.random() * DEATH_QUOTES.length)];
  const qElem = document.getElementById('death-quote');
  qElem.innerText = currentQuote;
  qElem.classList.remove('hidden');

  setTimeout(() => {
    initLevel();
  }, 1600);
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

  player.vy += 0.48; // Гравитация

  player.x += player.vx;
  player.y += player.vy;
  player.grounded = false;

  // Ограничение по краям экрана
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;

  // Коллизия с платформами
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

      if (p.type === 'fake_fall') p.triggered = true;
    }

    if (p.type === 'fake_fall' && p.triggered) {
      p.vy += 0.25; // Медленный подлый спуск
      p.y += p.vy;
    }
  }

  // Падение
  if (player.y > canvas.height + 40) {
    killPlayer();
  }

  // Хтони
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

  // Финиш
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

  // Фон
  ctx.fillStyle = "#14161d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Дома
  ctx.fillStyle = "#0c0d12";
  ctx.fillRect(50, 100, 120, 350);
  ctx.fillRect(220, 70, 140, 380);
  ctx.fillRect(450, 140, 110, 310);
  ctx.fillRect(620, 90, 130, 360);

  // Окна
  for(let bx = 70; bx < 750; bx += 60) {
    for(let by = 120; by < 380; by += 40) {
      if ((bx + by) % 3 === 0) {
        ctx.fillStyle = (bx + by) % 7 === 0 ? "#8a7e3b" : "#1a1c23";
        ctx.fillRect(bx, by, 12, 16);
      }
    }
  }

  // Платформы
  for (let p of platforms) {
    ctx.fillStyle = p.type === 'fake_fall' ? "#4a4e59" : "#333742";
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

  // Игрок
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

// Ввод
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
