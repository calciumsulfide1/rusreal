const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Ваши цитаты смерти
const DEATH_QUOTES = [
  "может нахер этот квест?",
  "походу сегодня без баллов интуиции",
  "оррууууу",
  "царь вернулся",
  "пока ахуевшая",
  "походу тебе уготовлена другая роль",
  "ребеночек идет за тобой..."
];

// Ваши achievements
const ACHIEVEMENTS = [
  "НЕ питомец эвелины",
  "НЕ вписался в лор",
  "убит хтонью",
  "руки кривые прямо как рог"
];

let player = {
  x: 40,
  y: 350,
  w: 20,
  h: 30,
  vx: 0,
  vy: 0,
  speed: 3.5,
  jumpPower: -9.5,
  grounded: false
};

const keys = { left: false, right: false, jump: false };
let gameState = 'PLAYING'; // PLAYING, DEAD, WON
let toastTimer = null;
let currentQuote = "";

// Локация/Карта (Панельки, платформа, провалы и тролль-элементы)
let platforms = [];
let chthonEnemies = [];
let exitDoor = { x: 740, y: 80, w: 30, h: 45 };

function initLevel() {
  player.x = 40;
  player.y = 350;
  player.vx = 0;
  player.vy = 0;
  gameState = 'PLAYING';
  document.getElementById('death-quote').classList.add('hidden');

  platforms = [
    // Земля
    { x: 0, y: 400, w: 220, h: 50, type: 'normal' },
    { x: 280, y: 400, w: 200, h: 50, type: 'normal' },
    { x: 550, y: 400, w: 250, h: 50, type: 'normal' },

    // Поддельная платформа (проваливается при наступании)
    { x: 140, y: 310, w: 90, h: 15, type: 'fake_fall', triggered: false, vy: 0 },
    
    // Бетонные балконы и этажи панельки
    { x: 40, y: 220, w: 100, h: 15, type: 'normal' },
    { x: 200, y: 160, w: 120, h: 15, type: 'normal' },
    { x: 380, y: 230, w: 80, h: 15, type: 'normal' },
    { x: 500, y: 160, w: 100, h: 15, type: 'normal' },
    { x: 650, y: 125, w: 150, h: 15, type: 'normal' }, // Платформа с выходом

    // Ловушка-платформа (исчезает перед финишем)
    { x: 610, y: 220, w: 60, h: 15, type: 'vanish', touched: false }
  ];

  // Враги: Безликие черные хтони
  chthonEnemies = [
    { x: 300, y: 370, w: 24, h: 30, speed: 1.5, minX: 280, maxX: 450 },
    { x: 210, y: 130, w: 24, h: 30, speed: 2.0, minX: 200, maxX: 300 },
    { x: 520, y: 130, w: 24, h: 30, speed: 2.5, minX: 500, maxX: 580 },
    
    // Замаскированная хтонь (появляется только если подойти близко)
    { x: 100, y: 190, w: 24, h: 30, speed: 0, hidden: true, active: false }
  ];
}

// Показ фейковых ачивок
function showAchievement(text) {
  const toast = document.getElementById('achievement-toast');
  const toastText = document.getElementById('toast-text');
  toastText.innerText = `«${text}»`;
  toast.classList.remove('hidden');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

// Обработка гибели игрока
function killPlayer() {
  if (gameState === 'DEAD') return;
  gameState = 'DEAD';

  // Выбираем случайную цитату из списка
  currentQuote = DEATH_QUOTES[Math.floor(Math.random() * DEATH_QUOTES.length)];
  const qElem = document.getElementById('death-quote');
  qElem.innerText = currentQuote;
  qElem.classList.remove('hidden');

  // Выдаем рандомное фейк-достижение
  const randomAch = ACHIEVEMENTS[Math.floor(Math.random() * ACHIEVEMENTS.length)];
  showAchievement(randomAch);

  setTimeout(() => {
    initLevel();
  }, 1800);
}

// Главный цикл обновлений
function update() {
  if (gameState !== 'PLAYING') return;

  // Движение игрока
  if (keys.left) player.vx = -player.speed;
  else if (keys.right) player.vx = player.speed;
  else player.vx = 0;

  // Прыжок
  if (keys.jump && player.grounded) {
    player.vy = player.jumpPower;
    player.grounded = false;
  }

  // Гравитация
  player.vy += 0.45;

  player.x += player.vx;
  player.y += player.vy;
  player.grounded = false;

  // Коллизии с платформами
  for (let p of platforms) {
    if (p.type === 'vanish' && p.touched) continue;

    if (
      player.x < p.x + p.w &&
      player.x + player.w > p.x &&
      player.y + player.h >= p.y &&
      player.y + player.h <= p.y + p.h + player.vy
    ) {
      player.grounded = true;
      player.vy = 0;
      player.y = p.y - player.h;

      // Срабатывание тролль-механик платформ
      if (p.type === 'fake_fall') p.triggered = true;
      if (p.type === 'vanish') p.touched = true;
    }

    // Движение падающей поддельной платформы
    if (p.type === 'fake_fall' && p.triggered) {
      p.vy += 0.5;
      p.y += p.vy;
    }
  }

  // Падение в бездну
  if (player.y > canvas.height + 50) {
    killPlayer();
  }

  // Обновление безликих черных хтоней
  for (let enemy of chthonEnemies) {
    // Триггер скрытой хтони
    if (enemy.hidden) {
      if (Math.abs(player.x - enemy.x) < 80 && Math.abs(player.y - enemy.y) < 50) {
        enemy.hidden = false;
        enemy.active = true;
        enemy.speed = 3.0; // Внезапно бежит на игрока
      }
      if (!enemy.active) continue;
    }

    enemy.x += enemy.speed;
    if (enemy.x < enemy.minX || enemy.x > enemy.maxX) {
      enemy.speed *= -1;
    }

    // Столкновение с хтонью
    if (
      player.x < enemy.x + enemy.w &&
      player.x + player.w > enemy.x &&
      player.y < enemy.y + enemy.h &&
      player.y + player.h > enemy.y
    ) {
      killPlayer();
    }
  }

  // Проверка победы (дошел до двери)
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

// Отрисовка графика в стиле Русреал
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Небо / Ночной серый город
  ctx.fillStyle = "#14161d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Силуэты панельных домов на фоне
  ctx.fillStyle = "#0c0d12";
  ctx.fillRect(50, 100, 120, 350);
  ctx.fillRect(220, 70, 140, 380);
  ctx.fillRect(450, 140, 110, 310);
  ctx.fillRect(620, 90, 130, 360);

  // Окна в панельках (кое-где горит тусклый желтый/зеленый свет)
  ctx.fillStyle = "#2c2817";
  for(let bx = 70; bx < 750; bx += 60) {
    for(let by = 120; by < 380; by += 40) {
      if ((bx + by) % 3 === 0) {
        ctx.fillStyle = (bx + by) % 7 === 0 ? "#8a7e3b" : "#1a1c23";
        ctx.fillRect(bx, by, 12, 16);
      }
    }
  }

  // Отрисовка бетонных платформ
  for (let p of platforms) {
    if (p.type === 'vanish' && p.touched) continue;
    ctx.fillStyle = p.type === 'fake_fall' ? "#4a4e59" : "#333742";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = "#22252e";
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }

  // Отрисовка безликих черных хтоней
  for (let enemy of chthonEnemies) {
    if (enemy.hidden) continue;

    // Черный силуэт хтони
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

    // Белые пустые глазницы
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(enemy.x + 4, enemy.y + 8, 4, 4);
    ctx.fillRect(enemy.x + 14, enemy.y + 8, 4, 4);
  }

  // Дверь выхода (Подъездная дверь с домофоном)
  ctx.fillStyle = "#5c2b2b";
  ctx.fillRect(exitDoor.x, exitDoor.y, exitDoor.w, exitDoor.h);
  ctx.fillStyle = "#ffe600";
  ctx.fillRect(exitDoor.x + 4, exitDoor.y + 20, 4, 4); // Светящаяся панель домофона

  // Игрок (Стилизованный персонаж)
  ctx.fillStyle = "#e67e22";
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(player.x + (keys.left ? 2 : 12), player.y + 6, 5, 5); // Глаз
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

// Слушатели событий клавиатуры
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

// Слушатели для тач-управления (экранные кнопки на телефоне)
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

// Старт игры
initLevel();
gameLoop();
