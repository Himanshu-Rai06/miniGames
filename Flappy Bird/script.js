/**
 * FLOATY BIRD ENGINE
 * Aesthetic: Sage, Cream, Soft Physics
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- CONFIGURATION ---
const COLORS = {
    bird: '#E6B8A2',      // Dusty Rose
    birdEye: '#354F52',   // Dark Slate
    birdWing: '#FFFFFF',  // White
    pipe: '#6B9080',      // Sage Green
    cloud: '#FFFFFF'      // White clouds
};

// Physics Constants
const GRAVITY = 0.25;
const JUMP = -4.5;
const SPEED = 2.5;     // Horizontal Scroll Speed
const PIPE_GAP = 140;  // Gap between pipes
const PIPE_FREQ = 220; // Frames between pipe spawns

// --- STATE ---
let frames = 0;
let score = 0;
let highScore = localStorage.getItem('floatyHighScore') || 0;
let gameRunning = false;
let obstacles = [];
let clouds = [];

// Bird Object
const bird = {
    x: 50,
    y: 150,
    radius: 12, // Visual size
    velocity: 0,
    rotation: 0,
    
    reset: function() {
        this.y = 150;
        this.velocity = 0;
        this.rotation = 0;
    },
    
    flap: function() {
        this.velocity = JUMP;
    },
    
    update: function() {
        this.velocity += GRAVITY;
        this.y += this.velocity;
        
        // Rotation logic based on velocity
        if(this.velocity < 0) {
            this.rotation = -25 * Math.PI / 180;
        } else {
            this.rotation += 2 * Math.PI / 180; // Slowly tilt down
            if(this.rotation > 70 * Math.PI / 180) this.rotation = 70 * Math.PI / 180;
        }
        
        // Floor collision
        if(this.y + this.radius >= canvas.height) {
            gameOver();
        }
    }
};

// DOM Elements
const scoreEl = document.getElementById('scoreEl');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');

// --- RESIZING ---
function resize() {
    // Mobile Portrait optimized width
    const width = Math.min(window.innerWidth - 30, 400); 
    const height = Math.min(window.innerHeight - 50, 600);
    
    canvas.width = width;
    canvas.height = height;
    
    // Reposition bird relative to new width
    bird.x = width * 0.3;
}
window.addEventListener('resize', resize);
resize();

// --- INPUT HANDLING ---
function handleInput(e) {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    if (e.type === 'keydown') e.preventDefault(); // Stop scrolling

    if (!gameRunning) {
        // Debounce slightly to prevent accidental restarts
        if (gameOverScreen.classList.contains('hidden') && startScreen.classList.contains('hidden')) return;
        // Logic handled by buttons, but spacebar can trigger too
    } else {
        bird.flap();
    }
}

window.addEventListener('keydown', handleInput);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Stop zoom/scroll
    if(gameRunning) bird.flap();
}, {passive: false});
canvas.addEventListener('mousedown', () => {
    if(gameRunning) bird.flap();
});

// --- GAME OBJECTS ---
class Obstacle {
    constructor() {
        this.x = canvas.width;
        this.width = 50; // Pipe width
        // Randomize height
        const minHeight = 50;
        const maxHeight = canvas.height - PIPE_GAP - minHeight;
        this.topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
        this.bottomY = this.topHeight + PIPE_GAP;
        this.passed = false;
    }

    update() {
        this.x -= SPEED;
    }

    draw() {
        ctx.fillStyle = COLORS.pipe;
        
        // Top Pipe with Rounded Cap
        roundRect(ctx, this.x, 0, this.width, this.topHeight, 0, 0, 10, 10);
        
        // Bottom Pipe with Rounded Cap
        roundRect(ctx, this.x, this.bottomY, this.width, canvas.height - this.bottomY, 10, 10, 0, 0);
    }
}

class Cloud {
    constructor() {
        this.x = canvas.width + Math.random() * 200;
        this.y = Math.random() * (canvas.height / 2);
        this.size = Math.random() * 30 + 20;
        this.speed = SPEED * 0.3; // Parallax effect
    }
    update() { this.x -= this.speed; }
    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath(); // Second puff
        ctx.arc(this.x + this.size*0.8, this.y + 10, this.size*0.7, 0, Math.PI * 2);
        ctx.fill();
    }
}

// --- HELPER: Rounded Rectangles for Pipes ---
function roundRect(ctx, x, y, w, h, tl, tr, br, bl) {
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    ctx.lineTo(x + bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
    ctx.lineTo(x, y + tl);
    ctx.quadraticCurveTo(x, y, x + tl, y);
    ctx.fill();
}

// --- GAME ENGINE ---
function init() {
    bird.reset();
    obstacles = [];
    clouds = [];
    score = 0;
    frames = 0;
    scoreEl.innerText = 0;
    gameRunning = true;
    loop();
}

function loop() {
    if (!gameRunning) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Background Clouds
    if(frames % 100 === 0) clouds.push(new Cloud());
    clouds.forEach((c, i) => {
        c.update();
        c.draw();
        if(c.x + c.size * 2 < 0) clouds.splice(i, 1);
    });

    // 2. Obstacles
    if (frames % PIPE_FREQ === 0) {
        obstacles.push(new Obstacle());
    }

    obstacles.forEach((obs, index) => {
        obs.update();
        obs.draw();

        // Collision Logic
        // Slightly forgiving hitbox (inset by 2px)
        const hitX = bird.x - bird.radius + 4;
        const hitY = bird.y - bird.radius + 4;
        const hitSize = (bird.radius * 2) - 8;

        // Check Pipe Collision
        if (
            hitX < obs.x + obs.width &&
            hitX + hitSize > obs.x &&
            (hitY < obs.topHeight || hitY + hitSize > obs.bottomY)
        ) {
            gameOver();
        }

        // Remove offscreen
        if (obs.x + obs.width < 0) {
            obstacles.shift();
        }

        // Score
        if (obs.x + obs.width < bird.x && !obs.passed) {
            score++;
            scoreEl.innerText = score;
            obs.passed = true;
            
            // Pop Animation
            anime({
                targets: '#scoreEl',
                scale: [1.5, 1],
                duration: 200,
                easing: 'easeOutQuad'
            });
        }
    });

    // 3. Bird
    bird.update();
    
    // Draw Bird (with rotation)
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);
    
    // Body
    ctx.fillStyle = COLORS.bird;
    ctx.beginPath();
    ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye
    ctx.fillStyle = COLORS.birdEye;
    ctx.beginPath();
    ctx.arc(6, -4, 2, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = COLORS.birdWing;
    ctx.beginPath();
    ctx.ellipse(-4, 2, 6, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();

    frames++;
    requestAnimationFrame(loop);
}

function gameOver() {
    gameRunning = false;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('floatyHighScore', highScore);
    }
    
    finalScoreEl.innerText = score;
    bestScoreEl.innerText = highScore;
    
    gameOverScreen.classList.remove('hidden');
    
    // Entry Animation
    anime({
        targets: '#game-over-screen .card',
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutCubic'
    });
}

// --- UI TRIGGERS ---
document.getElementById('startBtn').addEventListener('click', () => {
    startScreen.classList.add('hidden');
    init();
});

document.getElementById('restartBtn').addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    init();
});

// Initial Load Anim
anime({
    targets: '#start-screen .card',
    scale: [0.9, 1],
    opacity: [0, 1],
    duration: 800
});