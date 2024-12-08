document.addEventListener("DOMContentLoaded", function() {
    const animatedNumbers = document.querySelectorAll(".animated-number");

    // Función para animar números
    function animateNumbers(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const number = entry.target;
                const value = parseInt(number.getAttribute("data-value"), 10);
                let current = 0;
                const increment = Math.ceil(value / 100); // Ajusta la velocidad
                const interval = setInterval(() => {
                    current += increment;
                    if (current >= value) {
                        current = value;
                        clearInterval(interval);
                    }
                    number.textContent = current;
                }, 20); // Ajusta el intervalo

                observer.unobserve(number); // Deja de observar una vez que se activa
            }
        });
    }

    // Crear un Intersection Observer
    const observer = new IntersectionObserver(animateNumbers, {
        threshold: 0.5, // El elemento debe estar al menos 50% visible
    });

    // Observar cada número animado
    animatedNumbers.forEach(number => {
        observer.observe(number);
    });
});