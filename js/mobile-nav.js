document.addEventListener('DOMContentLoaded', function() {
    // Verificar si es dispositivo móvil
    const isMobile = window.innerWidth <= 768;
    
    // Activar el menú móvil solo en dispositivos móviles
    if (isMobile) {
        const mobileNav = document.querySelector('.mobile-nav');
        if (mobileNav) {
            mobileNav.style.display = 'flex';
        }
        
        // Desactivar cursor personalizado en móviles
        const customCursor = document.getElementById('custom-cursor');
        if (customCursor) {
            customCursor.style.display = 'none';
        }
        
        // Restaurar cursor normal en todos los elementos
        document.querySelectorAll('*').forEach(element => {
            element.style.cursor = 'auto';
        });
        
        // Función para actualizar la navegación activa al hacer scroll
        function updateActiveNavItem() {
            const scrollPosition = window.scrollY;
            
            // Obtener las posiciones de cada sección
            const sections = [
                { id: 'aperitivo', position: document.getElementById('aperitivo').offsetTop - 100 },
                { id: 'primer-plato', position: document.getElementById('primer-plato').offsetTop - 100 },
                { id: 'segundo-plato', position: document.getElementById('segundo-plato').offsetTop - 100 },
                { id: 'postre', position: document.getElementById('postre').offsetTop - 100 }
            ];
            
            // Determinar la sección actual
            let currentSection = sections[0].id;
            
            for (let i = 0; i < sections.length; i++) {
                if (scrollPosition >= sections[i].position) {
                    currentSection = sections[i].id;
                }
            }
            
            // Actualizar el estilo del menú
            document.querySelectorAll('.mobile-nav a').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + currentSection) {
                    link.classList.add('active');
                }
            });
        }
        
        // Escuchar el evento scroll
        window.addEventListener('scroll', updateActiveNavItem);
        
        // Inicializar el menú
        updateActiveNavItem();
        
        // Hacer scroll suave al hacer clic en los enlaces
        document.querySelectorAll('.mobile-nav a').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 20,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
});