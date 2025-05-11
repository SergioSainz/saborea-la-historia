document.addEventListener('DOMContentLoaded', function() {
    let currentIngredient = null;

    function setupScrollama() {
        // Seleccionar específicamente los bloques de ingredientes
        const steps = document.querySelectorAll('.content-block.ingredient-block');
        
        if (steps.length === 0) {
            console.log('No se encontraron bloques de ingredientes para scrollama - esto es esperado si no estás en la sección correcta');
            
            // Conectar con el grafo directamente sin scrollama
            if (window.filtrarGrafoPorIngrediente) {
                console.log('Intentando activar el grafo con MAIZ como ingrediente inicial');
                setTimeout(() => {
                    window.filtrarGrafoPorIngrediente('MAIZ');
                }, 1500);
            }
            
            return null;
        }
        
        // Asegurar que los ingredientes ya tienen la clase active para que sean visibles
        steps.forEach(step => {
            if (!step.classList.contains('active')) {
                step.classList.add('active');
            }
        });
        
        const ingredientScroller = scrollama();

        ingredientScroller
            .setup({
                step: '.content-block.ingredient-block',
                offset: 0.5, // Activar cuando el elemento esté a la mitad de la pantalla
                debug: false
            })
            .onStepEnter((response) => {
                // Evitar posibles múltiples llamadas para el mismo evento
                if (window._lastIngredientIndex === response.index && 
                    window._lastIngredientDir === response.direction) {
                    // Evitar procesar el mismo evento dos veces
                    console.log('Evento duplicado, ignorando:', response.index, response.direction);
                    return;
                }
                
                // Guardar el último evento procesado
                window._lastIngredientIndex = response.index;
                window._lastIngredientDir = response.direction;
                const { element, index, direction } = response;
                
                // Verificar si el elemento existe antes de continuar
                if (!element) {
                    console.error('Error: Elemento no encontrado en onStepEnter');
                    return;
                }
                
                // Extraer nombre del ingrediente con manejo de errores
                const h3Element = element.querySelector('h3');
                if (!h3Element) {
                    console.error('Error: No se encontró el elemento h3 en:', element);
                    return;
                }
                
                let ingrediente = h3Element.textContent?.trim();
                
                // Asegurarse de que el ingrediente esté en mayúsculas para coincidir con MAIZ, FRIJOL, etc.
                if (ingrediente) {
                    ingrediente = ingrediente.toUpperCase();
                    console.log('Ingrediente normalizado:', ingrediente);
                } else {
                    console.warn('Advertencia: No se pudo obtener el texto del ingrediente');
                }
                
                // Asegurar que este elemento está visible
                if (!element.classList.contains('active')) {
                    element.classList.add('active');
                }
                
                console.log('Entering ingredient section:', ingrediente, 'index:', index, 'direction:', direction);
                
                // Resaltar visualmente este bloque
                element.style.border = '2px solid #013971';
                element.style.transform = 'scale(1.02)';
                
                // Filtrar el grafo circular por el ingrediente actual
                if (window.filtrarGrafoPorIngrediente && ingrediente) {
                    console.log(`Activando filtro para sección: ${ingrediente}`);
                    
                    // Verificar si el grafo está inicializado
                    if (window.grafoInicializado) {
                        // Si el título contiene "Prehispánico", mostrar todos los ingredientes sin filtrar
                        if (ingrediente.includes("PREHISPÁNICO")) {
                            console.log(`Título contiene 'Prehispánico', mostrando todos los ingredientes`);
                            window.filtrarGrafoPorIngrediente(null);
                            window.currentIngredient = null;
                        } else {
                            console.log(`Grafo inicializado, filtrando por: ${ingrediente}`);
                            window.filtrarGrafoPorIngrediente(ingrediente);
                            // Almacenar el ingrediente actual globalmente
                            window.currentIngredient = ingrediente;
                        }
                    } else {
                        // Si no está inicializado, esperar un poco e intentar de nuevo
                        console.log('Esperando a que el grafo se inicialice para filtrar');
                        setTimeout(() => {
                            if (window.filtrarGrafoPorIngrediente) {
                                // Si el título contiene "Prehispánico", mostrar todos los ingredientes sin filtrar
                                if (ingrediente.includes("PREHISPÁNICO")) {
                                    console.log(`Título contiene 'Prehispánico', mostrando todos los ingredientes`);
                                    window.filtrarGrafoPorIngrediente(null);
                                    window.currentIngredient = null;
                                } else {
                                    console.log(`Reintentando filtrar por: ${ingrediente}`);
                                    window.filtrarGrafoPorIngrediente(ingrediente);
                                    // Almacenar el ingrediente actual globalmente
                                    window.currentIngredient = ingrediente;
                                }
                            }
                        }, 800);
                    }
                }
            })
            .onStepExit(response => {
                const { element, direction, index } = response;
                
                // Quitar resaltado visual
                element.style.border = '';
                element.style.transform = '';
                
                // Extraer nombre del ingrediente que estamos dejando
                const h3Element = element.querySelector('h3');
                const ingredienteSaliente = h3Element ? h3Element.textContent.trim().toUpperCase() : null;
                
                // Si estamos saliendo del último bloque de ingredientes y la dirección es hacia abajo,
                // mostrar el grafo completo sin filtros
                const ingredientBlocks = document.querySelectorAll('.content-block.ingredient-block');
                if (index === ingredientBlocks.length - 1 && direction === 'down') {
                    console.log('Saliendo del último ingrediente, mostrando solo época prehispánica');
                    if (window.filtrarGrafoPorIngrediente) {
                        // null ahora filtra solo por época prehispánica
                        window.filtrarGrafoPorIngrediente(null);
                        window.currentIngredient = null;
                    }
                } else if (direction === 'up' && index === 0) {
                    // Si estamos saliendo del primer ingrediente hacia arriba
                    console.log('Saliendo del primer ingrediente hacia arriba, mostrando solo época prehispánica');
                    if (window.filtrarGrafoPorIngrediente) {
                        // null ahora filtra solo por época prehispánica
                        window.filtrarGrafoPorIngrediente(null);
                        window.currentIngredient = null;
                    }
                } else {
                    // Para cualquier otra transición, actualizamos el currentIngredient
                    // Esto ayuda a manejar mejor las transiciones entre ingredientes
                    console.log(`Saliendo de ingrediente: ${ingredienteSaliente}, dirección: ${direction}`);
                }
            });

        // Manejar el resize de la ventana
        window.addEventListener('resize', ingredientScroller.resize);

        return ingredientScroller;
    }

    // Ya no necesitamos inicializar el Sankey

    // Hacemos visibles todos los bloques de ingredientes al cargar
    document.querySelectorAll('.content-block.ingredient-block').forEach(block => {
        block.classList.add('active');
    });
    
    // Ya no necesitamos cargar datos para el Sankey
    // La visualización del grafo circular maneja sus propios datos
    
    // Configurar scrollytelling inmediatamente
    setupScrollama();
});