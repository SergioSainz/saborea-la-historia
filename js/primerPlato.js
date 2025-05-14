document.addEventListener('DOMContentLoaded', function() {
    // Obtener elementos de visualización
    const viz1 = document.getElementById('visualization-1');
    const viz2 = document.getElementById('visualization-2');
    
    if (!viz1 || !viz2) {
        console.error('No se encontraron los elementos de visualización para el scrollytelling del Primer Plato');
        return;
    }
    
    console.log('Inicializando scrollytelling para Primer Plato');
    
    // Implementación simple de scrollytelling manual
    function setupScrollytelling() {
        // Elementos clave para el scrollytelling
        const primerPlatoSection = document.getElementById('primer-plato');
        const ingredientBlocks = document.querySelectorAll('#primer-plato .content-block.ingredient-block');
        
        // Variables de estado
        let lastScrollPosition = window.scrollY;
        let currentVisualization = 1; // 1 = primera visualización, 2 = segunda visualización
        
        // Detectar cuando un elemento entra en el viewport
        const observerOptions = {
            root: null, // viewport
            rootMargin: '-20% 0px', // 20% margen superior para activar un poco antes
            threshold: 0.1 // 10% de visibilidad para activar
        };
        
        // Función para manejar el scroll
        function handleScroll() {
            // Solo necesitamos dos estados: en la parte superior o en la parte inferior
            const scrollPosition = window.scrollY;
            const scrollDirection = scrollPosition > lastScrollPosition ? 'down' : 'up';
            lastScrollPosition = scrollPosition;
            
            // Posición de la sección del primer plato
            if (!primerPlatoSection) return;
            
            const primerPlatoRect = primerPlatoSection.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // Primer umbral: cuando el usuario ha scrolleado 70% de la altura del primer bloque
            if (ingredientBlocks.length > 0) {
                const firstBlock = ingredientBlocks[0];
                const firstBlockRect = firstBlock.getBoundingClientRect();
                
                // El scroll trigger está a 80px del borde superior del primer bloque
                const triggerPoint = 80;
                
                // Cambiamos a la segunda visualización cuando el primer bloque está 80px o más arriba de la parte superior de la ventana
                if (firstBlockRect.top < -triggerPoint && scrollDirection === 'down' && currentVisualization === 1) {
                    // Cambiar a visualización 2
                    viz1.style.opacity = '0';
                    viz2.style.opacity = '1';
                    currentVisualization = 2;
                    console.log('Cambiando a visualización 2 (bajando)');
                } 
                // Volvemos a la primera visualización cuando el primer bloque está cerca de la parte superior al subir
                else if (firstBlockRect.top > -triggerPoint && scrollDirection === 'up' && currentVisualization === 2) {
                    // Volver a visualización 1
                    viz1.style.opacity = '1';
                    viz2.style.opacity = '0';
                    currentVisualization = 1;
                    console.log('Volviendo a visualización 1 (subiendo)');
                }
            }
            
            // Si el usuario sale completamente de la sección, reset al estado inicial
            if (primerPlatoRect.bottom < 0 || primerPlatoRect.top > windowHeight) {
                viz1.style.opacity = '1';
                viz2.style.opacity = '0';
                currentVisualization = 1;
            }
        }
        
        // Observer para resaltar el bloque actual
        const blockObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Resaltar el bloque actual
                    entry.target.style.border = '2px solid #013971';
                    entry.target.style.transform = 'scale(1.02)';
                    entry.target.style.transition = 'all 0.3s ease';
                    
                    // Si es el segundo bloque (último), cambiar a la segunda visualización
                    if (entry.target === ingredientBlocks[ingredientBlocks.length - 1] && currentVisualization === 1) {
                        viz1.style.opacity = '0';
                        viz2.style.opacity = '1';
                        currentVisualization = 2;
                    }
                } else {
                    // Quitar resaltado
                    entry.target.style.border = '';
                    entry.target.style.transform = '';
                }
            });
        }, observerOptions);
        
        // Observar cada bloque de ingrediente
        ingredientBlocks.forEach(block => blockObserver.observe(block));
        
        // Escuchar eventos de scroll
        window.addEventListener('scroll', handleScroll);
        
        // Establecer estado inicial
        handleScroll();
        
        return {
            handleScroll,
            blockObserver
        };
    }
    
    // Iniciar scrollytelling
    const scrollController = setupScrollytelling();
    
    // Ajustar al cambio de tamaño de ventana
    window.addEventListener('resize', () => {
        if (scrollController && scrollController.handleScroll) {
            scrollController.handleScroll();
        }
    });
});