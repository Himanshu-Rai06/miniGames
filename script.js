document.addEventListener('DOMContentLoaded', () => {
    
    // Animate Header
    anime({
        targets: '.header',
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 800,
        easing: 'easeOutQuad'
    });

    // Animate Cards (Staggered)
    anime({
        targets: '.game-card',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 800,
        delay: anime.stagger(150, {start: 300}), // Delay start by 300ms, then 150ms between each
        easing: 'easeOutCubic'
    });

    // Animate Footer
    anime({
        targets: 'footer',
        opacity: [0, 1],
        duration: 1000,
        delay: 1000,
        easing: 'linear'
    });

});

// ... (Your existing code) ...

// LOGIC FOR LOCKED GAME
const runnerCard = document.getElementById('runner-card');
const toast = document.getElementById('toast');
let isToastAnimating = false;

runnerCard.addEventListener('click', () => {
    
    // Prevent spam clicking
    if(isToastAnimating) return;
    isToastAnimating = true;

    // Shake the card slightly (Visual feedback that it's locked)
    anime({
        targets: '#runner-card',
        translateX: [
            { value: -5, duration: 50 },
            { value: 5, duration: 50 },
            { value: -5, duration: 50 },
            { value: 5, duration: 50 },
            { value: 0, duration: 50 }
        ],
        easing: 'easeInOutQuad'
    });

    // Animate the Toast Popup IN and OUT
    let timeline = anime.timeline({
        complete: () => { isToastAnimating = false; }
    });

    timeline
    .add({
        targets: '#toast',
        translateY: ['100px', '0px'], // Slide Up
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutElastic(1, .8)'
    })
    .add({
        targets: '#toast',
        translateY: ['0px', '100px'], // Slide Down
        opacity: [1, 0],
        duration: 400,
        delay: 1500, // Wait 1.5 seconds before leaving
        easing: 'easeInBack'
    });
});