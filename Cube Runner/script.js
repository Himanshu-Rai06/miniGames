/**
 * CUBE RUNNER - LOGIC (FIXED & MOBILE READY)
 */

const playerGroup = document.getElementById('playerGroup');
const cubeMesh = document.getElementById('cubeMesh');
const track = document.querySelector('.track');
const distEl = document.getElementById('distance');
const highscoreEl = document.getElementById('highscore'); 
const boostFill = document.getElementById('boost-fill');
const boostIcon = document.getElementById('boost-icon');

const LANE_WIDTH = 120; 
const TRACK_LENGTH = 1500; 
const PLAYER_Y = 1260; 

const BASE_SPEED = 8;
const BOOST_SPEED = 30;

const frameEl = document.getElementById('game-frame');
const weatherEl = document.getElementById('weatherLayer');

const themes = [
    { name: 'forest-day', weather: '' },
    { name: 'night', weather: '' },
    { name: 'desert-day', weather: '' },
    { name: 'night', weather: 'snow' },        
    { name: 'forest-day', weather: 'snow' }
];

let lastThemeDistance = 0; 
let currentTheme = themes[0]; 

let gameRunning = false;
let currentLane = 1; 
let speed = BASE_SPEED;
let distance = 0;
let savedHighscore = localStorage.getItem('cubeRunHighscore') || 0;
if(highscoreEl) highscoreEl.innerText = Math.floor(savedHighscore); 

let obstacles = [];
let scenery = []; 
let animFrame;
let spawnTimer = 0;
let sceneryTimer = 0; 

let isJumping = false;
let boostLevel = 0;      
let isBoosting = false;
let lastJumpTime = 0;    

// --- DESKTOP CONTROLS ---
document.addEventListener('keydown', (e) => {
    if(!gameRunning) return;
    const key = e.key.toLowerCase();

    if(key === 'arrowleft' || key === 'a') {
        moveLane(-1);
        playerGroup.classList.add('is-shifting-left');
        setTimeout(() => playerGroup.classList.remove('is-shifting-left'), 200);
    }
    if(key === 'arrowright' || key === 'd') {
        moveLane(1);
        playerGroup.classList.add('is-shifting-right');
        setTimeout(() => playerGroup.classList.remove('is-shifting-right'), 200);
    }
    
    if(key === ' ' || key === 'arrowup' || key === 'w') {
        e.preventDefault(); 
        handleJumpInput();
    }
});

// --- MOBILE CONTROLS (SWIPE & DOUBLE TAP) ---
let touchStartX = 0;
let touchStartY = 0;
let lastTapTime = 0;

document.addEventListener('touchstart', e => {
    if(!gameRunning) return;
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: true});

document.addEventListener('touchend', e => {
    if(!gameRunning) return;
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    
    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;

    // Determine if it was a swipe or a tap
    if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
        // It's a swipe!
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (diffX > 0) {
                moveLane(1);
                playerGroup.classList.add('is-shifting-right');
                setTimeout(() => playerGroup.classList.remove('is-shifting-right'), 200);
            } else {
                moveLane(-1);
                playerGroup.classList.add('is-shifting-left');
                setTimeout(() => playerGroup.classList.remove('is-shifting-left'), 200);
            }
        } else {
            // Vertical swipe (Up or Down = Jump)
            handleJumpInput();
        }
    } else {
        // It's a tap! Check for double tap.
        let currentTime = new Date().getTime();
        let tapLength = currentTime - lastTapTime;
        if (tapLength < 300 && tapLength > 0) {
            // Double tap registered
            if (boostLevel >= 100 && !isBoosting) activateBoost();
        }
        lastTapTime = currentTime;
    }
});

function moveLane(dir) {
    const nextLane = currentLane + dir;
    if(nextLane < 0 || nextLane > 2) return;
    
    currentLane = nextLane;

    anime({
        targets: playerGroup, left: currentLane * LANE_WIDTH,
        duration: 250, easing: 'easeOutQuad'
    });

    anime({
        targets: cubeMesh, rotateZ: [0, dir * 90],
        duration: 250, easing: 'easeOutQuad',
        complete: () => { cubeMesh.style.transform = 'translateZ(30px) rotateZ(0deg)'; }
    });
}

function handleJumpInput() {
    const now = Date.now();
    // Prioritize boost if meter is full and we double tap space/up quickly
    if (now - lastJumpTime < 300 && boostLevel >= 100 && !isBoosting) {
        activateBoost();
    } else if (!isJumping && !isBoosting) {
        jump();
    }
    lastJumpTime = now;
}

function jump() {
    isJumping = true;
    anime({
        targets: playerGroup, translateZ: [0, 180], 
        duration: 400, easing: 'easeOutSine', direction: 'alternate',
        complete: () => isJumping = false
    });

    anime({
        targets: cubeMesh, rotateX: -360,
        duration: 800, easing: 'linear',
        complete: () => cubeMesh.style.transform = 'translateZ(30px) rotateX(0deg)'
    });
}

function activateBoost() {
    // 1. ACTUALLY UPDATE GAME LOGIC VARIABLES
    isBoosting = true;
    speed = BOOST_SPEED; // Speed surge!
    boostLevel = 0; // Empty the logic meter

    // 2. Turn on the Super Saiyan visual effects
    playerGroup.classList.add('is-boosting');
    boostIcon.classList.add('is-boosting-ui');
    
    // 3. Set height to 0% and instantly apply the 3-second drain transition
    boostFill.style.height = '0%';
    boostFill.classList.add('is-draining');

    // 4. End the boost after 3 seconds
    setTimeout(() => {
        isBoosting = false;
        speed = BASE_SPEED + (distance / 700); // Return to normal scaling speed
        playerGroup.classList.remove('is-boosting');
        boostIcon.classList.remove('is-boosting-ui');
        boostFill.classList.remove('is-draining'); 
    }, 3000); 
}

function startGame() {
    gameRunning = true; 
    distance = 0; 
    speed = BASE_SPEED;
    currentLane = 1; 
    boostLevel = 0; 
    isBoosting = false; 
    isJumping = false;
    
    obstacles.forEach(ob => ob.remove()); obstacles = [];
    scenery.forEach(tree => tree.remove()); scenery = [];

    playerGroup.style.left = '120px'; 
    playerGroup.style.transform = 'translateZ(0px)';
    cubeMesh.style.transform = 'translateZ(30px) rotateX(0deg) rotateZ(0deg)';
    cubeMesh.style.boxShadow = "none";

    updateBoostUI();
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');

    gameLoop();
}

function gameLoop() {
    if(!gameRunning) return;
    animFrame = requestAnimationFrame(gameLoop);

    distance += speed * 0.05;
    distEl.innerText = Math.floor(distance) + "m";
    if (!isBoosting) speed = BASE_SPEED + (distance / 300); 

    // BOOST FILL LOGIC
    if (!isBoosting && boostLevel < 100) {
        boostLevel += 0.25; 
        if (boostLevel > 100) boostLevel = 100;
        updateBoostUI();
    }

    // THEME CYCLING
    if (Math.floor(distance) - lastThemeDistance >= 550) {
        lastThemeDistance = Math.floor(distance);
        let randomIndex = Math.floor(Math.random() * themes.length);
        currentTheme = themes[randomIndex];
        frameEl.dataset.theme = currentTheme.name;
    }
    
    if (currentTheme.weather === 'snow') {
        weatherEl.className = 'weather-layer snow';
        frameEl.dataset.weather = 'snow';
    } else {
        weatherEl.className = 'weather-layer';
        frameEl.dataset.weather = 'clear';
    }

    // SPAWNERS
    spawnTimer -= speed * 0.1;
    if(spawnTimer <= 0) {
        spawnObstacle();
        spawnTimer = Math.max(25, 60 - (speed * 0.5)); 
    }

    sceneryTimer -= speed * 0.1;
    if(sceneryTimer <= 0) {
        spawnTree();
        sceneryTimer = 15; 
    }

    // OBSTACLE MOVEMENT & COLLISIONS
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let ob = obstacles[i];
        let currentTop = parseFloat(ob.style.top);
        currentTop += speed;
        ob.style.top = currentTop + 'px';

        let obH = parseFloat(ob.style.getPropertyValue('--h')) || 60;
        
        // Collision Detection Window
        if (currentTop + obH > PLAYER_Y && currentTop < PLAYER_Y + 120) {
            const obLane = parseInt(ob.dataset.lane);
            const obType = ob.dataset.type;
            
            let isHit = false;
            if (obType === 'wide' && (currentLane === obLane || currentLane === obLane + 1)) {
                isHit = true;
            } else if (currentLane === obLane) {
                isHit = true;
            }

            if (isHit) {
                if (isBoosting) {
                    smashObstacle(ob);
                    obstacles.splice(i, 1);
                    continue; // IMPORTANT: Skip rest of loop so it doesn't process deleted obstacle
                } else if (!isJumping) {
                    gameOver();
                }
            }
        }

        if(currentTop > TRACK_LENGTH) {
            ob.remove(); 
            obstacles.splice(i, 1);
        }
    }

    // SCENERY MOVEMENT
    for (let i = scenery.length - 1; i >= 0; i--) {
        let tree = scenery[i];
        let currentTop = parseFloat(tree.style.top);
        currentTop += speed;
        tree.style.top = currentTop + 'px';
        if(currentTop > TRACK_LENGTH) { 
            tree.remove(); 
            scenery.splice(i, 1); 
        }
    }
}

function spawnObstacle() {
    const typeRoll = Math.random();
    let laneIndex = Math.floor(Math.random() * 3); 
    
    let w = 60, d = 60, h = 60; 
    let obsType = 'standard';

    if (typeRoll > 0.8 && laneIndex < 2) { 
        obsType = 'wide';
        w = 180; 
    } 
    else if (typeRoll > 0.5) {
        obsType = 'tall';
        h = 140; 
    }

    const ob = document.createElement('div');
    ob.classList.add('obstacle');
    
    ob.style.setProperty('--w', `${w}px`);
    ob.style.setProperty('--d', `${d}px`);
    ob.style.setProperty('--h', `${h}px`);

    ob.dataset.lane = laneIndex;
    ob.dataset.type = obsType;
    
    const faces = ['ob-shadow', 'ob-top', 'ob-front', 'ob-back', 'ob-left', 'ob-right'];
    faces.forEach(faceClass => {
        const face = document.createElement('div');
        face.classList.add('ob-face', faceClass);
        if (faceClass === 'ob-shadow') face.style.border = 'none'; 
        ob.appendChild(face);
    });

    ob.style.left = (laneIndex * LANE_WIDTH + 30) + 'px'; 
    ob.style.top = '-150px'; 
    
    track.appendChild(ob);
    obstacles.push(ob);
}

function smashObstacle(ob) {
    anime({
        targets: ob, 
        translateZ: [0, 300], 
        rotateX: 720, 
        rotateY: 360,
        rotateZ: 180,
        opacity: [1, 0], 
        duration: 600, 
        easing: 'easeOutCirc', 
        complete: () => ob.remove()
    });
}

function spawnTree() {
    const isLeft = Math.random() > 0.5;
    const tree = document.createElement('div');
    tree.classList.add('tree');
    
    const sideOffset = Math.floor(Math.random() * 50) + 20; 
    tree.style.left = isLeft ? `-${sideOffset}px` : `${360 + sideOffset}px`;
    tree.style.top = '-100px'; 
    
    track.appendChild(tree);
    scenery.push(tree);
}

function updateBoostUI() {
    boostFill.style.height = `${boostLevel}%`;
    if (boostLevel >= 100) {
        boostFill.style.backgroundColor = "var(--boost-color)";
        if(boostIcon) boostIcon.classList.add('ready');
    } else {
        boostFill.style.backgroundColor = "var(--primary)";
        if(boostIcon) boostIcon.classList.remove('ready');
    }
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animFrame);
    
    if (distance > savedHighscore) {
        savedHighscore = distance;
        localStorage.setItem('cubeRunHighscore', savedHighscore);
        if(highscoreEl) highscoreEl.innerText = Math.floor(savedHighscore);
    }
    
    document.getElementById('finalScore').innerText = Math.floor(distance);
    document.getElementById('game-over-screen').classList.remove('hidden');
    
    anime({
        targets: '#game-frame', translateX: [15, -15, 15, -15, 0],
        duration: 400, easing: 'easeInOutQuad'
    });
}

document.getElementById('startBtn').addEventListener('click', startGame);

document.getElementById('restartBtn').addEventListener('click', startGame);
