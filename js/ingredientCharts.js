/**
 * Gráficas para visualizar datos de ingredientes
 * Este script crea gráficos de barras para mostrar estadísticas de los ingredientes
 */

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
    
    // Crear gradiente para las barras
    const gradient = svg.append("defs")
        .append("linearGradient")
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
    
    // Añadir barras
    const bars = svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('g');
        
    bars.append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', d => y(d.name))
        .attr('width', 0) // Inicialmente 0 para animar
        .attr('height', y.bandwidth())
        .attr('fill', `url(#gradient-${containerId})`)
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('opacity', 0.9)
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
}

// Función para mostrar la nota cultural
function displayNote(containerId, note, color) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div style="background-color: transparent; border-left: 3px solid ${color}; padding: 12px; font-style: italic; margin-top: 15px;">
            <p class="mb-0" style="font-size: 0.9rem; color: #666;">"${note}"</p>
        </div>
    `;
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