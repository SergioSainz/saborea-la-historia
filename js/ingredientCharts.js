/**
 * Gráficas para visualizar datos de ingredientes
 * Este script crea gráficos de barras para mostrar estadísticas de los ingredientes
 */

// Función auxiliar para convertir color hex a RGB
function hexToRgb(hex) {
    // Expandir formato corto (por ejemplo: #03F) a formato completo (por ejemplo: #0033FF)
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
        "0, 0, 0";
}

// Datos específicos para cada ingrediente basados en el análisis del grafo
const ingredientData = {
    'maiz': {
        estados: [
            { name: 'Puebla', value: 285 },
            { name: 'Oaxaca', value: 210 },
            { name: 'Veracruz', value: 175 },
            { name: 'Michoacán', value: 130 },
            { name: 'Yucatán', value: 105 }
        ],
        culturas: [
            { name: 'Mexica', value: 195 },
            { name: 'Maya', value: 155 },
            { name: 'Zapoteca', value: 140 },
            { name: 'Olmeca', value: 95 },
            { name: 'Mixteca', value: 75 }
        ],
        nota: "Según el Popol Vuh, los dioses crearon al hombre del maíz. Sin maíz no hay país.",
        color: '#BC7D2D' // Color tierra dorado para maíz
    },
    'frijol': {
        estados: [
            { name: 'Puebla', value: 190 },
            { name: 'Oaxaca', value: 150 },
            { name: 'Veracruz', value: 135 },
            { name: 'Chiapas', value: 95 },
            { name: 'Jalisco', value: 80 }
        ],
        culturas: [
            { name: 'Mexica', value: 175 },
            { name: 'Maya', value: 130 },
            { name: 'Zapoteca', value: 110 },
            { name: 'Otomí', value: 85 },
            { name: 'Totonaca', value: 65 }
        ],
        nota: "Pilar de la alimentación prehispánica, cultivado siempre junto al maíz y la calabaza.",
        color: '#4D3B27' // Color tierra marrón oscuro para frijol
    },
    'chile': {
        estados: [
            { name: 'Puebla', value: 220 },
            { name: 'Oaxaca', value: 180 },
            { name: 'Veracruz', value: 145 },
            { name: 'Chiapas', value: 115 },
            { name: 'Sonora', value: 90 }
        ],
        culturas: [
            { name: 'Mexica', value: 185 },
            { name: 'Maya', value: 145 },
            { name: 'Zapoteca', value: 120 },
            { name: 'Totonaca', value: 95 },
            { name: 'Olmeca', value: 80 }
        ],
        nota: "Más que sabor, era elemento ritual; tenía usos medicinales, ceremoniales y como conservador de alimentos.",
        color: '#8B3E2F' // Color tierra rojizo para chile
    },
    'calabaza': {
        estados: [
            { name: 'Puebla', value: 165 },
            { name: 'Oaxaca', value: 140 },
            { name: 'Veracruz', value: 115 },
            { name: 'Yucatán', value: 95 },
            { name: 'Michoacán', value: 75 }
        ],
        culturas: [
            { name: 'Mexica', value: 160 },
            { name: 'Maya', value: 120 },
            { name: 'Zapoteca', value: 95 },
            { name: 'Olmeca', value: 75 },
            { name: 'Tarasca', value: 60 }
        ],
        nota: "Se usaban la pulpa, las semillas y hasta las cáscaras como utensilios.",
        color: '#C2A059' // Color tierra ocre para calabaza
    },
    'cacao': {
        estados: [
            { name: 'Chiapas', value: 145 },
            { name: 'Tabasco', value: 120 },
            { name: 'Oaxaca', value: 95 },
            { name: 'Veracruz', value: 75 },
            { name: 'Campeche', value: 60 }
        ],
        culturas: [
            { name: 'Maya', value: 165 },
            { name: 'Olmeca', value: 125 },
            { name: 'Mexica', value: 100 },
            { name: 'Zapoteca', value: 75 },
            { name: 'Mixteca', value: 55 }
        ],
        nota: "Tan valioso que se usaba como moneda. Moctezuma bebía 50 tazas diarias de espumoso chocolate.",
        color: '#51341A' // Color tierra chocolate para cacao
    }
};

// Formato para miles
const formatNumber = d3.format(",");

// Función para crear gráficos de barras
function createBarChart(containerId, data, title, color, maxValue = null) {
    // Si no existe el contenedor, salir
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Limpiar el contenedor
    container.innerHTML = '';
    
    // Dimensiones
    const margin = { top: 20, right: 30, bottom: 40, left: 75 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;
    
    // Definir escalas
    const x = d3.scaleLinear()
        .domain([0, maxValue || d3.max(data, d => d.value)])
        .range([0, width]);
    
    const y = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([0, height])
        .padding(0.3);
    
    // Crear SVG
    const svg = d3.select(container).append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Añadir título
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#666')
        .text(title);
    
    // Crear patrón maya para el fondo (copiado del gráfico cultural)
    const defs = svg.append("defs");
    
    // Patrón Glifo Maya
    const mayaPattern = defs.append("pattern")
        .attr("id", `mayaPattern-${containerId}`)
        .attr("width", 60)
        .attr("height", 60)
        .attr("patternUnits", "userSpaceOnUse")
        .attr("patternTransform", "rotate(30)");
    
    // Fondo del patrón
    mayaPattern.append("rect")
        .attr("width", 60)
        .attr("height", 60)
        .attr("fill", "transparent");
    
    // Glifo Maya estilizado 1 (serpiente)
    mayaPattern.append("path")
        .attr("d", "M10,10 Q20,5 30,10 Q40,15 50,10 M10,15 Q20,20 30,15 Q40,10 50,15")
        .attr("stroke", `rgba(${hexToRgb(color)}, 0.1)`)
        .attr("stroke-width", 5)
        .attr("fill", "none");
    
    // Glifo Maya estilizado 2 (cuadrado con diagonal)
    mayaPattern.append("path")
        .attr("d", "M10,30 H30 V50 H10 Z M10,30 L30,50")
        .attr("stroke", `rgba(${hexToRgb(color)}, 0.07)`)
        .attr("stroke-width", 5)
        .attr("fill", "none");
    
    // Glifo Maya estilizado 3 (espiral)
    mayaPattern.append("path")
        .attr("d", "M45,30 Q55,35 50,40 Q45,45 40,40 Q35,35 40,30 Q45,25 45,30")
        .attr("stroke", `rgba(${hexToRgb(color)}, 0.1)`)
        .attr("stroke-width", 5)
        .attr("fill", "none");
    
    // Crear gradiente para las barras
    const gradient = defs.append("linearGradient")
        .attr("id", `gradient-${containerId}`)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");
        
    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color)
        .attr("stop-opacity", 1);
        
    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0.7);
        
    // Agregar un fondo con el patrón maya como primer elemento (detrás de todo)
    svg.insert("rect", ":first-child")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", `url(#mayaPattern-${containerId})`)
        .attr("opacity", 0.15);
    
    // Añadir barras
    const bars = svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('g');
        
    // Primero agregar rectángulos con el patrón maya dentro de las barras
    bars.append('rect')
        .attr('class', 'bar-pattern')
        .attr('x', 0)
        .attr('y', d => y(d.name))
        .attr('width', 0) // Inicialmente 0 para animar
        .attr('height', y.bandwidth())
        .attr('fill', `url(#mayaPattern-${containerId})`)
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('opacity', 0.9)
        .transition()
        .duration(1200)
        .delay((d, i) => i * 100) // Añadir retraso escalonado
        .ease(d3.easeElasticOut.amplitude(0.5)) // Efecto elástico
        .attr('width', d => x(d.value));
        
    // Añadir rectángulos con animaciones personalizadas y gradiente encima
    bars.append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', d => y(d.name))
        .attr('width', 0) // Inicialmente 0 para animar
        .attr('height', y.bandwidth())
        .attr('fill', `url(#gradient-${containerId})`)
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('opacity', 0.7)
        .each(function(d, i) {
            // Asignar una duración y retardo aleatorio para la animación de pulsación
            const duration = 2 + Math.random() * 2; // Entre 2 y 4 segundos
            const delay = Math.random() * 1.5; // Entre 0 y 1.5 segundos
            
            // Aplicar el estilo de animación personalizado
            d3.select(this)
                .style('animation-duration', `${duration}s`)
                .style('animation-delay', `${delay}s`);
        })
        .transition()
        .duration(1200)
        .delay((d, i) => i * 100) // Añadir retraso escalonado
        .ease(d3.easeElasticOut.amplitude(0.5)) // Efecto elástico
        .attr('width', d => x(d.value));
    
    // Añadir etiquetas de categoría (eje Y)
    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('font-size', '10px')
        .style('font-family', "'Cardo', serif")
        .style('fill', '#333');
    
    // Eliminar la línea del eje Y
    svg.select('.domain').remove();
    svg.selectAll('.tick line').remove();
    
    // Añadir valores al final de las barras
    bars.append('text')
        .attr('x', d => x(d.value) + 5)
        .attr('y', d => y(d.name) + y.bandwidth() / 2)
        .attr('dy', '.35em')
        .style('font-size', '10px')
        .style('fill', '#666')
        .style('font-weight', 'bold')
        .style('font-family', "'Libre Baskerville', serif")
        .text(d => formatNumber(d.value))
        .attr('opacity', 0)
        .transition()
        .delay((d, i) => 1200 + i * 100)
        .duration(400)
        .attr('opacity', 1);
        
    // Añadir interactividad a las barras
    bars.selectAll('rect.bar')
        .on('mouseover', function(event, d) {
            // Pausar animación (implementado vía CSS con animation-play-state)
            const index = data.findIndex(item => item.name === d.name);
            
            // Destacar la barra actual
            d3.select(this)
                .attr('stroke', '#333')
                .attr('stroke-width', 1)
                .attr('filter', `drop-shadow(0 0 3px ${color})`)
                .attr('opacity', 0.9);
                
            // También destacar la barra con el patrón
            bars.selectAll('rect.bar-pattern')
                .filter((d, i) => i === index)
                .attr('opacity', 1)
                .attr('stroke', '#333')
                .attr('stroke-width', 1)
                .attr('filter', `drop-shadow(0 0 3px ${color})`);
                
            // Destacar el texto correspondiente
            bars.selectAll('text')
                .filter((_, i) => i === index)
                .transition()
                .duration(200)
                .style('font-size', '12px')
                .style('fill', '#333');
        })
        .on('mouseout', function(event, d) {
            // La reanudación de la animación se maneja vía CSS
            const index = data.findIndex(item => item.name === d.name);
            
            // Restaurar el estilo normal
            d3.select(this)
                .attr('stroke', 'none')
                .attr('stroke-width', 0)
                .attr('filter', 'none')
                .attr('opacity', 0.7);
                
            // Restaurar la barra con el patrón
            bars.selectAll('rect.bar-pattern')
                .filter((d, i) => i === index)
                .attr('opacity', 0.9)
                .attr('stroke', 'none')
                .attr('stroke-width', 0)
                .attr('filter', 'none');
                
            // Restaurar el texto
            bars.selectAll('text')
                .filter((_, i) => i === index)
                .transition()
                .duration(200)
                .style('font-size', '10px')
                .style('fill', '#666');
        });
        
    // También aplicar interactividad a las barras con patrón
    bars.selectAll('rect.bar-pattern')
        .on('mouseover', function(event, d) {
            const index = data.findIndex(item => item.name === d.name);
            
            // Destacar la barra actual
            d3.select(this)
                .attr('stroke', '#333')
                .attr('stroke-width', 1)
                .attr('filter', `drop-shadow(0 0 3px ${color})`)
                .attr('opacity', 1);
                
            // También destacar la barra con gradiente
            bars.selectAll('rect.bar')
                .filter((d, i) => i === index)
                .attr('opacity', 0.9)
                .attr('stroke', '#333')
                .attr('stroke-width', 1)
                .attr('filter', `drop-shadow(0 0 3px ${color})`);
                
            // Destacar el texto correspondiente
            bars.selectAll('text')
                .filter((_, i) => i === index)
                .transition()
                .duration(200)
                .style('font-size', '12px')
                .style('fill', '#333');
        })
        .on('mouseout', function(event, d) {
            const index = data.findIndex(item => item.name === d.name);
            
            // Restaurar el estilo normal
            d3.select(this)
                .attr('stroke', 'none')
                .attr('stroke-width', 0)
                .attr('filter', 'none')
                .attr('opacity', 0.9);
                
            // Restaurar la barra con gradiente
            bars.selectAll('rect.bar')
                .filter((d, i) => i === index)
                .attr('opacity', 0.7)
                .attr('stroke', 'none')
                .attr('stroke-width', 0)
                .attr('filter', 'none');
                
            // Restaurar el texto
            bars.selectAll('text')
                .filter((_, i) => i === index)
                .transition()
                .duration(200)
                .style('font-size', '10px')
                .style('fill', '#666');
        });
}

// Función para mostrar la nota cultural
function displayNote(containerId, note, color) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Crear SVG con patrón maya
    const width = container.clientWidth;
    const height = 80;
    
    // Crear SVG
    const svg = d3.select(container).append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('position', 'absolute')
        .style('z-index', '-1')
        .style('left', '0')
        .style('top', '0');
    
    // Crear patrón maya
    const defs = svg.append("defs");
    
    // Patrón Glifo Maya
    const mayaPattern = defs.append("pattern")
        .attr("id", `mayaPattern-${containerId}`)
        .attr("width", 60)
        .attr("height", 60)
        .attr("patternUnits", "userSpaceOnUse")
        .attr("patternTransform", "rotate(30)");
    
    // Fondo del patrón
    mayaPattern.append("rect")
        .attr("width", 60)
        .attr("height", 60)
        .attr("fill", "transparent");
    
    // Glifo Maya estilizado 1 (serpiente)
    mayaPattern.append("path")
        .attr("d", "M10,10 Q20,5 30,10 Q40,15 50,10 M10,15 Q20,20 30,15 Q40,10 50,15")
        .attr("stroke", `rgba(${hexToRgb(color)}, 0.1)`)
        .attr("stroke-width", 5)
        .attr("fill", "none");
    
    // Glifo Maya estilizado 2 (cuadrado con diagonal)
    mayaPattern.append("path")
        .attr("d", "M10,30 H30 V50 H10 Z M10,30 L30,50")
        .attr("stroke", `rgba(${hexToRgb(color)}, 0.07)`)
        .attr("stroke-width", 5)
        .attr("fill", "none");
    
    // Glifo Maya estilizado 3 (espiral)
    mayaPattern.append("path")
        .attr("d", "M45,30 Q55,35 50,40 Q45,45 40,40 Q35,35 40,30 Q45,25 45,30")
        .attr("stroke", `rgba(${hexToRgb(color)}, 0.1)`)
        .attr("stroke-width", 5)
        .attr("fill", "none");
    
    // Agregar un fondo con el patrón maya
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", `url(#mayaPattern-${containerId})`)
        .attr("opacity", 0.15);
    
    // Añadir contenido HTML para la nota
    const noteDiv = document.createElement('div');
    noteDiv.style.position = 'relative';
    noteDiv.style.zIndex = '1';
    noteDiv.style.backgroundColor = 'transparent';
    noteDiv.style.borderLeft = `3px solid ${color}`;
    noteDiv.style.padding = '12px';
    noteDiv.style.fontStyle = 'italic';
    noteDiv.style.marginTop = '15px';
    noteDiv.innerHTML = `<p class="mb-0" style="font-size: 0.9rem; color: #666;">"${note}"</p>`;
    
    container.style.position = 'relative';
    container.appendChild(noteDiv);
}

// Función principal para inicializar los gráficos
function initIngredientCharts() {
    // Verificar si estamos en modo de visualización de ingredientes
    const ingredientBlocks = document.querySelectorAll('.ingredient-block');
    if (ingredientBlocks.length === 0) return;
    
    // Crear gráficos para cada ingrediente
    Object.keys(ingredientData).forEach(ingredient => {
        // Nombres de los contenedores
        const estadosContainerId = `${ingredient}-estados-chart`;
        const culturasContainerId = `${ingredient}-culturas-chart`;
        const notaContainerId = `${ingredient}-nota`;
        
        // Verificar si existen los contenedores
        const estadosContainer = document.getElementById(estadosContainerId);
        const culturasContainer = document.getElementById(culturasContainerId);
        
        if (estadosContainer && culturasContainer) {
            // Crear los gráficos
            createBarChart(
                estadosContainerId, 
                ingredientData[ingredient].estados, 
                'TOP 5 ESTADOS', 
                ingredientData[ingredient].color
            );
            
            createBarChart(
                culturasContainerId, 
                ingredientData[ingredient].culturas, 
                'TOP 5 CULTURAS', 
                ingredientData[ingredient].color
            );
            
            // Mostrar nota cultural
            displayNote(
                notaContainerId, 
                ingredientData[ingredient].nota, 
                ingredientData[ingredient].color
            );
        }
    });
}

// Inicializar los observadores de intersección para animaciones al scroll
function initObservers() {
    // Seleccionar todos los contenedores de gráficos
    const chartContainers = document.querySelectorAll('.chart-container');
    
    // Configurar el observador
    const options = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.2 // Umbral de visibilidad
    };
    
    // Callback cuando un elemento es visible
    const handleIntersect = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Si el contenedor es visible, renderizar el gráfico
                const containerId = entry.target.id;
                if (containerId) {
                    // Extraer el ingrediente del ID (ej: "maiz-estados-chart" -> "maiz")
                    const ingredient = containerId.split('-')[0];
                    const type = containerId.includes('estados') ? 'estados' : 'culturas';
                    
                    if (ingredientData[ingredient] && ingredientData[ingredient][type]) {
                        // Renderizar el gráfico correspondiente
                        createBarChart(
                            containerId,
                            ingredientData[ingredient][type],
                            type === 'estados' ? 'TOP 5 ESTADOS' : 'TOP 5 CULTURAS',
                            ingredientData[ingredient].color
                        );
                        
                        // Si es un gráfico de estados, también mostrar la nota cultural
                        if (type === 'estados') {
                            const notaContainerId = `${ingredient}-nota`;
                            displayNote(
                                notaContainerId,
                                ingredientData[ingredient].nota,
                                ingredientData[ingredient].color
                            );
                        }
                    }
                }
                
                // Dejar de observar este elemento
                observer.unobserve(entry.target);
            }
        });
    };
    
    // Crear observador
    const observer = new IntersectionObserver(handleIntersect, options);
    
    // Observar cada contenedor
    chartContainers.forEach(container => {
        observer.observe(container);
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Iniciar los observadores para animación en scroll
    initObservers();
});

// Reinicializar observadores cuando cambia el tamaño de ventana
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Reiniciar observadores
        initObservers();
    }, 200);
});