document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. ENTRY ANIMATIONS --- //
    
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

    // --- 2. COZY BACKGROUND ANIMATION --- //
    
    // Create a container for the background orbs so we don't clutter the HTML
    const bgContainer = document.createElement('div');
    bgContainer.style.position = 'fixed';
    bgContainer.style.top = '0';
    bgContainer.style.left = '0';
    bgContainer.style.width = '100vw';
    bgContainer.style.height = '100vh';
    bgContainer.style.zIndex = '-1'; // Keeps it behind your game grid
    bgContainer.style.overflow = 'hidden';
    bgContainer.style.pointerEvents = 'none'; // Ensures you can still click cards
    document.body.appendChild(bgContainer);

    // Generate 5 soft, floating orbs
    for (let i = 0; i < 5; i++) {
        let orb = document.createElement('div');
        orb.style.position = 'absolute';
        orb.style.width = Math.random() * 150 + 100 + 'px'; // Random size between 100px and 250px
        orb.style.height = orb.style.width;
        orb.style.background = 'rgba(107, 144, 128, 0.05)'; // Very faint sage green
        orb.style.borderRadius = '50%';
        orb.style.top = Math.random() * 100 + 'vh';
        orb.style.left = Math.random() * 100 + 'vw';
        bgContainer.appendChild(orb);

        // Make them drift slowly
        anime({
            targets: orb,
            translateY: () => [0, anime.random(-150, 150)],
            translateX: () => [0, anime.random(-150, 150)],
            scale: () => [1, anime.random(1.1, 1.3)],
            duration: () => anime.random(6000, 10000), // Very slow, 6 to 10 seconds
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
        });
    }

    // --- 3. LOGIC FOR LOCKED GAMES --- //
    
    const lockedCards = document.querySelectorAll('.locked');
    const toast = document.getElementById('toast');
    let isToastAnimating = false;

    // Apply the click listener to EVERY locked card
    lockedCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault(); // Prevents the browser from trying to jump to a link
            
            // Prevent spam clicking
            if(isToastAnimating) return;
            isToastAnimating = true;

            // Shake the specific card that was clicked (Visual feedback)
            anime({
                targets: card,
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
    });
});
