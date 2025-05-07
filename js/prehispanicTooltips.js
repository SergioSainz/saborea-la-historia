/**
 * Clase utilitaria para crear tooltips con estilo prehispánico consistente
 * para todas las visualizaciones en el proyecto
 */
class PrehispanicTooltips {
    constructor() {
        // Colores prehispánicos inspirados en arte mexicano antiguo
        this.colorPalette = [
            "#9B2226", // Rojo carmín (similar al usado en códices)
            "#BB4D00", // Naranja rojizo (color de cerámica)
            "#AE7C34", // Dorado ocre (color maya)
            "#5F5F41", // Verde oliva (jade)
            "#28666E", // Azul-verde (color turquesa)
            "#073B4C"  // Azul oscuro (color usado en murales)
        ];
        
        // Crear un tooltip contenedor si no existe ya
        this.ensureTooltipContainer();
    }
    
    /**
     * Asegura que exista un contenedor de tooltip en el DOM
     */
    ensureTooltipContainer() {
        if (!document.querySelector('.prehispanic-tooltip-container')) {
            const tooltip = document.createElement('div');
            tooltip.className = 'prehispanic-tooltip-container chart-tooltip-prehispanic';
            tooltip.style.position = 'absolute';
            tooltip.style.opacity = '0';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.zIndex = '10000';
            document.body.appendChild(tooltip);
        }
        return d3.select('.prehispanic-tooltip-container');
    }
    
    /**
     * Obtiene un color del palette según el índice
     * @param {number} index - Índice en el palette de colores
     */
    getColor(index) {
        return this.colorPalette[index % this.colorPalette.length];
    }
    
    /**
     * Obtiene un color aleatorio del palette
     */
    getRandomColor() {
        return this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)];
    }
    
    /**
     * Crea HTML para un tooltip con estilo prehispánico
     * @param {Object} config - Configuración del tooltip
     * @param {string} config.title - Título principal
     * @param {string} config.color - Color para los elementos decorativos
     * @param {string} config.content - Contenido principal
     * @param {string} config.subContent - Contenido secundario
     * @param {string} config.footer - Texto del pie
     */
    createTooltipHTML(config) {
        const color = config.color || this.getRandomColor();
        
        return `
            <div style="position: relative;">
                <div style="position: absolute; top: -10px; left: -10px; right: -10px; height: 5px; 
                     background: repeating-linear-gradient(90deg, ${color}, ${color} 5px, transparent 5px, transparent 10px);"></div>
                
                <div style="font-weight: bold; font-size: 15px; margin: 2px 0 8px 0; color: ${color}; text-transform: uppercase;">
                    ${config.title}
                </div>
                
                ${config.content ? `
                <div style="color: #444; font-size: 13px; margin-bottom: 8px;">
                    ${config.content}
                </div>` : ''}
                
                ${config.subContent ? `
                <div style="color: #666; font-size: 12px; font-style: italic; margin-bottom: 5px;">
                    ${config.subContent}
                </div>` : ''}
                
                ${config.footer ? `
                <div style="margin-top: 5px; font-size: 11px; color: #777;">
                    ${config.footer}
                </div>` : ''}
                
                <div style="position: absolute; bottom: -10px; left: -10px; right: -10px; height: 5px; 
                     background: repeating-linear-gradient(90deg, ${color}, ${color} 5px, transparent 5px, transparent 10px);"></div>
            </div>
        `;
    }
    
    /**
     * Muestra un tooltip en la posición del evento
     * @param {Event} event - Evento del mouse
     * @param {Object} config - Configuración del tooltip
     */
    showTooltip(event, config) {
        const tooltip = this.ensureTooltipContainer();
        const color = config.color || this.getRandomColor();
        
        // Actualizar contenido
        tooltip
            .html(this.createTooltipHTML(config))
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 20) + "px")
            .style("border-color", color)
            .style("transform", `rotate(${Math.random() * 2 - 1}deg)`); // Rotación aleatoria ligera
            
        // Mostrar con transición
        tooltip.transition()
            .duration(250)
            .style("opacity", 0.98);
    }
    
    /**
     * Oculta el tooltip
     */
    hideTooltip() {
        const tooltip = this.ensureTooltipContainer();
        
        tooltip.transition()
            .duration(300)
            .style("opacity", 0);
    }
}

// Exportar como variable global
window.PrehispanicTooltips = new PrehispanicTooltips();