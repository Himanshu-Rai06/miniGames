/**
 * BOOP-A-BLOB 2.0 (Strong Logic Edition)
 */

const board = document.getElementById('board');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');

// Game Configuration
const GRID_SIZE = 16; // 4x4
const GAME_DURATION = 45; // Seconds

// State
let holes = [];
let score = 0;
let timeLeft = GAME_DURATION;
let isGameRunning = false;
let activeMoleIndex = -1; // -1 means no mole is up
let isStunned = false; // Is the current mole seeing stars?
let gameTimerInterval;
let moleTimeout; // The timer for the mole to go down automatically

// High Score
let highScore = localStorage.getItem('boop4x4HighScore') || 0;
document.getElementById('highScore').innerText = highScore;

// --- INITIALIZATION ---

function createBoard() {
    board.innerHTML = '';
    holes = [];
    
    for (let i = 0; i < GRID_SIZE; i++) {
        // Create Hole
        const hole = document.createElement('div');
        hole.classList.add('hole');
        hole.dataset.index = i;
        
        // Create Mole
        const mole = document.createElement('div');
        mole.classList.add('mole');
        
        // Create Stars Halo (Hidden by default)
        const halo = document.createElement('div');
        halo.classList.add('stars-halo');
        halo.innerHTML = '<div class="star"></div><div class="star"></div><div class="star"></div>';
        
        mole.appendChild(halo);
        hole.appendChild(mole);
        board.appendChild(hole);
        
        // Click Event (Touch and Mouse)
        hole.addEventListener('mousedown', () => handleBoop(i));
        hole.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleBoop(i);
        });

        holes.push(hole);
    }
}

createBoard();

// --- GAME LOGIC ---

function startGame() {
    if (isGameRunning) return;
    
    score = 0;
    timeLeft = GAME_DURATION;
    scoreEl.innerText = score;
    timerEl.innerText = timeLeft;
    isGameRunning = true;
    isStunned = false;
    
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');

    // Start Countdown
    gameTimerInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) endGame();
    }, 1000);

    // Start first turn
    nextTurn();
}

function nextTurn() {
    if (!isGameRunning) return;

    // Reset State
    isStunned = false;
    
    // Pick random hole different from last time
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * GRID_SIZE);
    } while (newIndex === activeMoleIndex);
    
    activeMoleIndex = newIndex;
    showMole(activeMoleIndex);
}

function showMole(index) {
    const mole = holes[index].querySelector('.mole');
    
    // 1. Animate UP
    anime({
        targets: mole,
        translateY: ['0%', '-85%'],
        duration: 400,
        easing: 'easeOutBack'
    });

    // 2. Set "Patience" Timer
    // If player doesn't click in X seconds, mole goes down
    const patience = Math.max(700, 1500 - (score * 20)); // Gets faster as you score
    
    moleTimeout = setTimeout(() => {
        if (!isStunned && isGameRunning) {
            hideMole(index); // Missed it
        }
    }, patience);
}

function hideMole(index) {
    const mole = holes[index].querySelector('.mole');
    
    // Animate DOWN
    anime({
        targets: mole,
        translateY: '0%',
        duration: 200,
        easing: 'easeInQuad',
        complete: () => {
            // Clean up styles
            mole.classList.remove('stunned');
            // Wait a tiny bit before next one pops up
            if (isGameRunning) {
                setTimeout(nextTurn, 200); 
            }
        }
    });
}

function handleBoop(index) {
    // Logic Checks:
    // 1. Is game running?
    // 2. Is this the correct hole?
    // 3. Is the mole already stunned (don't double count)?
    if (!isGameRunning || index !== activeMoleIndex || isStunned) return;

    // SUCCESS!
    isStunned = true;
    score++;
    scoreEl.innerText = score;
    clearTimeout(moleTimeout); // Stop it from hiding automatically

    const hole = holes[index];
    const mole = hole.querySelector('.mole');

    // 1. Visual: Add 'stunned' class to spin stars
    mole.classList.add('stunned');

    // 2. Animate: Slight dip/squish to show impact
    anime({
        targets: mole,
        scaleY: [1, 0.9, 1],
        duration: 150,
        easing: 'linear'
    });

    // 3. Logic: Wait 1 second (showing stars), then hide
    setTimeout(() => {
        hideMole(index);
    }, 1000);
}

function endGame() {
    isGameRunning = false;
    clearInterval(gameTimerInterval);
    clearTimeout(moleTimeout);
    
    // Update High Score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('boop4x4HighScore', highScore);
    }
    
    document.getElementById('finalScore').innerText = score;
    document.getElementById('highScore').innerText = highScore;
    document.getElementById('game-over-screen').classList.remove('hidden');

    // Ensure current mole goes down
    if (activeMoleIndex !== -1) {
        const mole = holes[activeMoleIndex].querySelector('.mole');
        mole.classList.remove('stunned');
        anime({ targets: mole, translateY: '0%', duration: 200 });
    }
}

// Event Listeners for UI
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

// Initial Entry Anim
anime({
    targets: '#start-screen .card',
    translateY: [-20, 0],
    opacity: [0, 1],
    duration: 800
});