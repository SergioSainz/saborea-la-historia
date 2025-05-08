document.addEventListener('DOMContentLoaded', function() {
    // Asegurarse de que la burbuja de diálogo tenga altura adecuada desde el principio
    const speechBubble = document.querySelector('.speech-bubble');
    if (speechBubble) {
        speechBubble.style.minHeight = '120px';
    }
    
    // Inicialización de TypeIt con una pausa ligeramente más natural
    new TypeIt("#typing-text", {
        strings: "¡Hola! Soy Xolin, tu guía en un viaje por los sabores que han dado vida a México. ¿Te imaginas qué historias guarda cada platillo?",
        speed: 40, // Velocidad ligeramente más lenta para mejor legibilidad
        waitUntilVisible: true,
        startDelay: 800, // Pequeña pausa antes de empezar a escribir
        cursor: true,
        cursorChar: "|",
        afterComplete: function() {
            // Mostrar el botón después de que termine la animación de texto
            const scrollButton = document.getElementById('scroll-down-btn');
            if (scrollButton) {
                scrollButton.style.opacity = '1';
                scrollButton.style.transform = 'translateY(0)';
            }
        }
    }).go();

    // Configuración del botón de scroll
    const scrollButton = document.getElementById('scroll-down-btn');
    if (scrollButton) {
        scrollButton.addEventListener('click', function() {
            // Cambiar a la siguiente sección
            const targetSection = document.querySelector('.sticky-section');
            if (targetSection) {
                // Animar el scroll
                window.scrollTo({
                    top: targetSection.offsetTop,
                    behavior: 'smooth'
                });

                // Cambiar la imagen de Xolin
                const xolinImage = document.querySelector('.sticky-image img');
                if (xolinImage) {
                    xolinImage.src = 'img/Xolin/Xolin_Aperitivo.png';
                    xolinImage.classList.add('fade-in');
                }
            }
        });
    }

    // Inicialización de Scrollama
    const scroller = scrollama();

    scroller
        .setup({
            step: '.content-block',
            offset: 0.5,
        })
        .onStepEnter(response => {
            // Añadir clase active para activar la animación
            const { element, index, direction } = response;
            element.classList.add('active');
            console.log('Entering content block:', index, direction);

            // Cambiar imagen según la sección con manejo de errores
            try {
                const xolinImage = document.querySelector('.sticky-image img');
                if (xolinImage) {
                    // Determinar qué imagen mostrar según el índice
                    const imageUrls = {
                        0: 'img/Xolin/cara.png',
                        1: 'img/inicio/plato-2.png',
                    };

                    if (imageUrls[index]) {
                        xolinImage.src = imageUrls[index];
                        xolinImage.classList.add('fade-in');
                    }
                }
            } catch (error) {
                console.error('Error al cambiar la imagen:', error);
            }
        })
        .onStepExit(response => {
            const { element, index, direction } = response;
            element.classList.remove('active');
            console.log('Exiting content block:', index, direction);
        });

    // Asegurar que Scrollama se actualice cuando cambie el tamaño de la ventana
    window.addEventListener('resize', scroller.resize);
});