document.addEventListener('DOMContentLoaded', function() {
    // Array of ingredients to be animated (excluding frijoles.png and tlecuilli.png)
    const ingredients = [
        'img/aperitivo/maiz.png',
        'img/aperitivo/chile.png',
        'img/aperitivo/calabaza.png',
        'img/aperitivo/cacao.png',
        'img/aperitivo/tomate.png'
    ];

    // Container where animation will happen (second section)
    const animationContainer = document.querySelector('.sticky-section');
    
    // Create a specific container for the falling ingredients
    const fallingIngredientsContainer = document.createElement('div');
    fallingIngredientsContainer.className = 'falling-ingredients-container';
    fallingIngredientsContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
        overflow: hidden;
    `;
    animationContainer.appendChild(fallingIngredientsContainer);

    // Track the number of active falling ingredients
    let activeIngredientCount = 0;
    const MAX_INGREDIENTS = 15;

    // Function to create a random ingredient element
    function createIngredient() {
        // Limit the number of concurrent ingredients
        if (activeIngredientCount >= MAX_INGREDIENTS) {
            return;
        }
        
        activeIngredientCount++;
        
        // Select a random ingredient
        const randomIngredient = ingredients[Math.floor(Math.random() * ingredients.length)];
        
        // Create image element
        const img = document.createElement('img');
        
        // Set properties before adding to DOM
        img.className = 'falling-ingredient';
        
        // Random positioning and timing
        const startPositionPercent = Math.random() * 100;
        const sizePx = 30 + Math.random() * 40; // Random size between 30px and 70px
        const durationSeconds = 5 + Math.random() * 5; // Random duration between 5 and 10 seconds
        const delaySeconds = Math.random() * 1; // Shorter random delay (reduced from 2s)
        
        // Apply styles before setting src to avoid reflow
        img.style.cssText = `
            position: absolute;
            left: ${startPositionPercent}%;
            top: -100px;
            width: ${sizePx}px;
            height: auto;
            opacity: 0;
            z-index: 1;
            animation: falling ${durationSeconds}s linear ${delaySeconds}s, 
                       floating ${durationSeconds / 2}s ease-in-out infinite;
            animation-fill-mode: forwards;
            pointer-events: none;
        `;
        
        // Set src after other properties
        img.src = randomIngredient;
        
        // Add to container
        fallingIngredientsContainer.appendChild(img);
        
        // Remove element after animation completes
        setTimeout(() => {
            if (img.parentNode) {
                img.parentNode.removeChild(img);
                activeIngredientCount--;
            }
        }, (durationSeconds + delaySeconds) * 1000);
    }

    // Create initial batch of ingredients (fewer initial ingredients)
    for (let i = 0; i < 5; i++) {
        setTimeout(() => createIngredient(), i * 200);
    }

    // Use requestAnimationFrame for better performance
    let lastCreationTime = 0;
    const createInterval = 1000; // Increase interval between creations

    function scheduleNextIngredient(timestamp) {
        if (!lastCreationTime || timestamp - lastCreationTime >= createInterval) {
            createIngredient();
            lastCreationTime = timestamp;
        }
        
        requestAnimationFrame(scheduleNextIngredient);
    }
    
    // Start the animation system
    requestAnimationFrame(scheduleNextIngredient);

    // Create floating ingredients that appear when scrolling to specific ingredient sections
    // We'll use a single IntersectionObserver for all blocks to reduce overhead
    const ingredientBlocks = document.querySelectorAll('.ingredient-block');
    
    // Keep track of which blocks have already shown floating ingredients
    const blocksWithFloatingIngredients = new Set();
    
    // Create a single observer that will watch all ingredient blocks
    const blockObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            
            const block = entry.target;
            if (blocksWithFloatingIngredients.has(block)) return;
            
            // Get the ingredient type from the heading
            const ingredientType = block.querySelector('h3').textContent.toLowerCase();
            let ingredientImage = '';
            
            // Map the heading text to the corresponding image
            switch(ingredientType) {
                case 'maíz':
                case 'maiz':
                    ingredientImage = 'img/aperitivo/maiz.png';
                    break;
                case 'chile':
                    ingredientImage = 'img/aperitivo/chile.png';
                    break;
                case 'calabaza':
                    ingredientImage = 'img/aperitivo/calabaza.png';
                    break;
                case 'cacao':
                    ingredientImage = 'img/aperitivo/cacao.png';
                    break;
                default:
                    return; // Skip if no matching image
            }
            
            // Mark this block as processed
            blocksWithFloatingIngredients.add(block);
            
            // Add a small random delay to stagger creation
            setTimeout(() => {
                createFloatingIngredient(ingredientImage, block);
            }, Math.random() * 300);
            
            // Unobserve this block since we've processed it
            blockObserver.unobserve(block);
        });
    }, { 
        threshold: 0.2,        // Lower threshold for better performance
        rootMargin: '0px'      // Only trigger when visible in viewport
    });
    
    // Observe all ingredient blocks with the single observer
    ingredientBlocks.forEach(block => {
        blockObserver.observe(block);
    });
    
    // Function to create floating ingredient
    function createFloatingIngredient(imageSrc, container) {
        // Limit the number per container
        const existingIngredients = container.querySelectorAll('.floating-ingredient');
        if (existingIngredients.length >= 2) { // reduce max count from 3 to 2
            return;
        }
        
        const img = document.createElement('img');
        
        // Set properties before setting src
        img.className = 'floating-ingredient';
        
        // Random position within the container
        const posX = Math.random() * 80 + 10; 
        const posY = Math.random() * 80 + 10;
        const size = 40 + Math.random() * 20; // Reduced size range
        
        img.style.cssText = `
            position: absolute;
            left: ${posX}%;
            top: ${posY}%;
            width: ${size}px;
            height: auto;
            opacity: 0;
            z-index: 2;
            animation: floating 10s ease-in-out infinite;
            pointer-events: none;
        `;
        
        // Set src after other properties
        img.src = imageSrc;
        
        // Add to container
        container.appendChild(img);
        
        // Fade in after a frame
        requestAnimationFrame(() => {
            img.style.transition = 'opacity 0.5s ease-in';
            img.style.opacity = '0.7';
        });
        
        // Remove after a shorter time
        setTimeout(() => {
            img.style.transition = 'opacity 0.8s ease-out';
            img.style.opacity = '0';
            
            setTimeout(() => {
                if (img.parentNode) {
                    img.parentNode.removeChild(img);
                    
                    // Allow this section to show floating ingredients again after removal
                    setTimeout(() => {
                        blocksWithFloatingIngredients.delete(container);
                    }, 5000);
                }
            }, 800);
        }, 7000); // Shorter display time
    }
});