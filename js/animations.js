document.addEventListener('DOMContentLoaded', function() {
    // Inicialización de TypeIt
    new TypeIt("#typing-text", {
        strings: "¡Hola! Soy Xolin, tu guía en un viaje por los sabores que han dado vida a México.¿Te imaginas qué historias guarda cada platillo?",
        speed: 30,
        waitUntilVisible: true,
        afterComplete: function() {
            // Mostrar el botón después de que termine la animación de texto
            const scrollButton = document.getElementById('scroll-down-btn');
            if (scrollButton) {
                scrollButton.style.opacity = '1';
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
            const blocks = document.querySelectorAll('.content-block');
            blocks[response.index].classList.add('active');

            // Cambiar imagen según la sección
            const xolinImage = document.querySelector('.sticky-image img');
            if (xolinImage) {
                // Determinar qué imagen mostrar según el índice
                const imageUrls = {
                    0: 'img/Xolin/cara.png',
                    1: 'img/Xolin/Xolin_Aperitivo.png',
                    
                };

                if (imageUrls[response.index]) {
                    xolinImage.src = imageUrls[response.index];
                    xolinImage.classList.add('fade-in');
                }
            }
        })
        .onStepExit(response => {
            const blocks = document.querySelectorAll('.content-block');
            blocks[response.index].classList.remove('active');
        });

    // Asegurar que Scrollama se actualice cuando cambie el tamaño de la ventana
    window.addEventListener('resize', scroller.resize);
});