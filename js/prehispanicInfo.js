document.addEventListener('DOMContentLoaded', function() {
    // Animar la aparición de los elementos interactivos
    const infoBoxes = document.querySelectorAll('.info-box');
    
    // Asignar tiempos de aparición escalonados
    infoBoxes.forEach((box, index) => {
        setTimeout(() => {
            box.style.opacity = '0';
            box.style.transform = 'translateY(20px)';
            box.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            // Utilizar IntersectionObserver para detectar cuando los elementos están en el viewport
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            box.style.opacity = '1';
                            box.style.transform = 'translateY(0)';
                        }, index * 150); // Tiempo escalonado basado en el índice
                        observer.unobserve(box);
                    }
                });
            }, { threshold: 0.2 });
            
            observer.observe(box);
        }, 0);
    });
    
    // Agregar interactividad a los elementos
    document.querySelectorAll('.ingredient-item, .protein-item, .drink-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.fontWeight = 'bold';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.fontWeight = 'normal';
        });
        
        // Efecto de pulsación al hacer clic
        item.addEventListener('click', function() {
            this.style.transform = 'scale(1.05)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    });
    
    // Contador animado para los números destacados
    document.querySelectorAll('.highlight-number').forEach(number => {
        const finalValue = parseInt(number.textContent);
        let startValue = 0;
        const duration = 1500; // Duración en milisegundos
        const frameDuration = 1000 / 60; // 60 fps
        const totalFrames = Math.round(duration / frameDuration);
        let frame = 0;
        
        // Utilizar IntersectionObserver para iniciar la animación cuando el elemento sea visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Guardar el valor final
                    number.setAttribute('data-final', finalValue);
                    // Inicializar con cero
                    number.textContent = '0';
                    
                    // Función de animación
                    const counter = setInterval(() => {
                        frame++;
                        // Calcular el progreso de la animación (easing)
                        const progress = frame / totalFrames;
                        const currentValue = Math.round(finalValue * progress);
                        
                        if (currentValue <= finalValue) {
                            number.textContent = currentValue;
                        }
                        
                        if (frame === totalFrames) {
                            clearInterval(counter);
                            number.textContent = finalValue;
                        }
                    }, frameDuration);
                    
                    observer.unobserve(number);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(number);
    });
});