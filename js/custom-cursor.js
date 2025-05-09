/**
 * Script para implementar un cursor personalizado utilizando una superposición DIV
 * Esta técnica reemplaza completamente el cursor predeterminado
 */

document.addEventListener('DOMContentLoaded', function() {
    // Crear el elemento div que seguirá al cursor
    const customCursor = document.createElement('div');
    customCursor.id = 'custom-cursor';
    
    // Añadir el cursor al body
    document.body.appendChild(customCursor);
    
    // Ocultar el cursor real en todo el documento
    document.documentElement.style.cursor = 'none';
    document.body.style.cursor = 'none';
    
    // Asegurarse de que todos los elementos también oculten el cursor
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        el.style.cursor = 'none';
    });
    
    // Función para actualizar la posición del cursor con suavidad
    function updateCursorPosition(e) {
        customCursor.style.left = `${e.clientX}px`;
        customCursor.style.top = `${e.clientY}px`;
    }
    
    // Función para hacer el cursor más grande en elementos interactivos
    function enlargeCursor() {
        customCursor.style.transform = 'translate(-50%, -50%) scale(1.3)';
    }
    
    // Función para volver al tamaño normal
    function normalCursor() {
        customCursor.style.transform = 'translate(-50%, -50%) scale(1)';
    }
    
    // Escuchar eventos del ratón para actualizar la posición
    document.addEventListener('mousemove', updateCursorPosition);
    
    // Detectar cuando se pasa sobre elementos interactivos
    const interactiveElements = document.querySelectorAll('a, button, [role="button"], input[type="button"], input[type="submit"], .clickable, .interactive, .culture-dot');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', enlargeCursor);
        el.addEventListener('mouseleave', normalCursor);
    });
    
    // Ocultar cuando el cursor sale de la ventana
    document.addEventListener('mouseout', function(e) {
        if (e.relatedTarget === null) {
            customCursor.style.display = 'none';
        }
    });
    
    // Mostrar cuando el cursor vuelve a la ventana
    document.addEventListener('mouseover', function(e) {
        customCursor.style.display = 'block';
    });
    
    // Asegurar que se aplicó inmediatamente
    updateCursorPosition({clientX: 0, clientY: 0});
    
    // Aplicar cursor: none en caso de que se recargue un estilo
    setInterval(function() {
        if (document.body.style.cursor !== 'none') {
            document.body.style.cursor = 'none';
        }
    }, 1000);
});