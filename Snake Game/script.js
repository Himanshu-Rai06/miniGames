/**
 * COZY SNAKE ENGINE
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Config
const GRID_COUNT = 20; // 20x20 grid
let TILE_SIZE = 20;

// Aesthetic Palette
const COLORS = {
    snakeHead: '#6B9080',  // Dark Sage
    snakeBody: '#A4C3B2',  // Light Sage
    food: '#E6B8A2',       // Peach
    gridDot: '#D8E2DC'     // Very light grey/green
};

// State
let snake = [];
let food = { x: 0, y: 0 };
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('cozySnakeHighScore') || 0;
let particles = [];
let lastRenderTime = 0;
let gameSpeed = 8; // Tiles per second

// Elements
const scoreEl = document.getElementById('scoreEl');
const highScoreEl = document.getElementById('highScoreEl');
const finalScoreEl = document.getElementById('finalScore');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');

// Init Score
highScoreEl.innerText = highScore;

// --- RESIZE LOGIC ---
function resize() {
    // Calculate size based on window, keeping some padding
    const maxSize = Math.min(window.innerWidth - 40, window.innerHeight - 200, 600);
    // Ensure it's a multiple of GRID_COUNT for perfect tiles
    const size = Math.floor(maxSize / GRID_COUNT) * GRID_COUNT;
    
    canvas.width = size;
    canvas.height = size;
    TILE_SIZE = size / GRID_COUNT;
    
    // Redraw if game is paused/stopped to keep visuals correct
    if(!gameRunning) draw();
}
window.addEventListener('resize', resize);
resize(); // Initial call

// --- INPUT HANDLING ---
window.addEventListener('keydown', e => {
    if(!gameRunning) return;
    switch(e.key) {
        case 'ArrowUp': 
        case 'w': if (direction.y === 0) nextDirection = { x: 0, y: -1 }; break;
        case 'ArrowDown': 
        case 's': if (direction.y === 0) nextDirection = { x: 0, y: 1 }; break;
        case 'ArrowLeft': 
        case 'a': if (direction.x === 0) nextDirection = { x: -1, y: 0 }; break;
        case 'ArrowRight': 
        case 'd': if (direction.x === 0) nextDirection = { x: 1, y: 0 }; break;
    }
});

// Touch / Swipe Logic
let touchStartX = 0;
let touchStartY = 0;

document.body.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, {passive: false});

document.body.addEventListener('touchend', e => {
    if(!gameRunning) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > 30) { // Threshold
            if (dx > 0 && direction.x === 0) nextDirection = { x: 1, y: 0 };
            else if (dx < 0 && direction.x === 0) nextDirection = { x: -1, y: 0 };
        }
    } else {
        if (Math.abs(dy) > 30) {
            if (dy > 0 && direction.y === 0) nextDirection = { x: 0, y: 1 };
            else if (dy < 0 && direction.y === 0) nextDirection = { x: 0, y: -1 };
        }
    }
}, {passive: false});

// --- CORE LOGIC ---
function initGame() {
    snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
    score = 0;
    gameSpeed = 9;
    direction = { x: 0, y: -1 };
    nextDirection = { x: 0, y: -1 };
    scoreEl.innerText = 0;
    particles = [];
    placeFood();
    gameRunning = true;
    requestAnimationFrame(gameLoop);
}

function placeFood() {
    let valid = false;
    while (!valid) {
        food.x = Math.floor(Math.random() * GRID_COUNT);
        food.y = Math.floor(Math.random() * GRID_COUNT);
        valid = !snake.some(segment => segment.x === food.x && segment.y === food.y);
    }
}

function update() {
    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Collisions
    if (head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT || 
        snake.some(s => s.x === head.x && s.y === head.y)) {
        return gameOver();
    }

    snake.unshift(head);

    // Eat Food
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.innerText = score;
        if (score % 5 === 0) gameSpeed += 0.2; // Gentle speed increase

        // Effects
        createConfetti(head.x, head.y);
        
        anime({
            targets: '#scoreEl',
            scale: [1.4, 1],
            duration: 300,
            easing: 'easeOutCubic'
        });

        placeFood();
    } else {
        snake.pop();
    }
}

function gameOver() {
    gameRunning = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cozySnakeHighScore', highScore);
        highScoreEl.innerText = highScore;
    }
    finalScoreEl.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

// --- VISUALS ---
function createConfetti(x, y) {
    const px = x * TILE_SIZE + TILE_SIZE/2;
    const py = y * TILE_SIZE + TILE_SIZE/2;
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: px, y: py,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 4 + 2,
            color: COLORS.food,
            life: 1.0
        });
    }
}

function draw() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Subtle Grid Dots
    ctx.fillStyle = COLORS.gridDot;
    for (let x = 0; x <= GRID_COUNT; x++) {
        for (let y = 0; y <= GRID_COUNT; y++) {
            ctx.beginPath();
            ctx.arc(x * TILE_SIZE, y * TILE_SIZE, 1.5, 0, Math.PI*2);
            ctx.fill();
        }
    }

    // Draw Food (Soft Circle)
    const fx = food.x * TILE_SIZE + TILE_SIZE/2;
    const fy = food.y * TILE_SIZE + TILE_SIZE/2;
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.arc(fx, fy, TILE_SIZE/2 - 2, 0, Math.PI*2);
    ctx.fill();
    // Inner light reflection for bubble look
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(fx - 2, fy - 2, 3, 0, Math.PI*2);
    ctx.fill();

    // Draw Snake
    snake.forEach((seg, i) => {
        const sx = seg.x * TILE_SIZE + TILE_SIZE/2;
        const sy = seg.y * TILE_SIZE + TILE_SIZE/2;
        
        ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snakeBody;
        ctx.beginPath();
        // Circle for head and tail, rounded rects could also work
        ctx.arc(sx, sy, TILE_SIZE/2 - 1, 0, Math.PI*2);
        ctx.fill();

        // Connect segments visually to make it look smooth
        if (i < snake.length - 1) {
            const next = snake[i+1];
            const nextX = next.x * TILE_SIZE + TILE_SIZE/2;
            const nextY = next.y * TILE_SIZE + TILE_SIZE/2;
            
            ctx.lineWidth = TILE_SIZE - 2;
            ctx.strokeStyle = COLORS.snakeBody;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(nextX, nextY);
            ctx.stroke();
        }
    });

    // Draw Particles
    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        p.radius *= 0.9; 
        
        if (p.life <= 0) particles.splice(i, 1);
        else {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    });
}

function gameLoop(currTime) {
    if (!gameRunning) return;
    window.requestAnimationFrame(gameLoop);
    
    const seconds = (currTime - lastRenderTime) / 1000;
    if (seconds < 1 / gameSpeed) return;
    
    lastRenderTime = currTime;
    update();
    draw();
}

// --- UI TRIGGERS ---

// Animation for Title on Load
anime({
    targets: '.card',
    translateY: [20, 0],
    opacity: [0, 1],
    duration: 800,
    easing: 'easeOutQuad',
    delay: anime.stagger(100)
});

document.getElementById('startBtn').addEventListener('click', () => {
    // Fade out start screen
    startScreen.classList.add('hidden');
    resize(); // Ensure fit
    initGame();
});

document.getElementById('restartBtn').addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    initGame();
});