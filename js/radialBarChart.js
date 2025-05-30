// Función para procesar los datos y generar el recuento de platillos por estado para un ingrediente específico
function processDataForRadialBarChart(csvData, ingrediente) {
    // Dividir cada línea por el separador | y filtrar por el ingrediente especificado
    const rows = csvData.split('\n').map(line => line.split('|'));
    
    // Obtener el índice de las columnas que necesitamos
    const headers = rows[0];
    const platilloIndex = headers.findIndex(h => h.includes('NOMBRE DEL PLATILLO'));
    const origenIndex = headers.findIndex(h => h.includes('ORIGEN_Platillo'));
    const ingredienteIndex = headers.findIndex(h => h.includes('Ingrediente'));
    
    // Filtrar filas por ingrediente (búsqueda parcial e insensible a mayúsculas/minúsculas)
    const filteredRows = rows.filter(row => {
        if (!row[ingredienteIndex]) return false;
        
        const ingredienteValue = row[ingredienteIndex].trim();
        
        if (ingrediente === 'MAIZ') {
            // Buscar cualquier ingrediente que contenga "maiz" o "maíz" en cualquier forma
            return ingredienteValue.toLowerCase().includes('maiz') || 
                   ingredienteValue.toLowerCase().includes('maíz');
        } 
        else if (ingrediente === 'CHILE') {
            // Buscar cualquier ingrediente que contenga "chile" en cualquier forma
            return ingredienteValue.toLowerCase().includes('chile');
        }
        else {
            // Para otros ingredientes, mantener la comparación exacta pero insensible a mayúsculas/minúsculas
            return ingredienteValue.toUpperCase() === ingrediente.toUpperCase();
        }
    });
    
    // Crear un mapa de estado -> conjunto de platillos únicos
    const estadoPlatillos = new Map();
    
    filteredRows.forEach(row => {
        const estado = row[origenIndex]?.trim();
        const platillo = row[platilloIndex]?.trim();
        
        if (estado && platillo) {
            if (!estadoPlatillos.has(estado)) {
                estadoPlatillos.set(estado, new Set());
            }
            estadoPlatillos.get(estado).add(platillo);
        }
    });
    
    // Convertir a formato para el gráfico: array de objetos {estado, count}
    const result = Array.from(estadoPlatillos.entries()).map(([estado, platillos]) => ({
        estado,
        count: platillos.size
    }));
    
    // Ordenar por nombre de estado para una mejor distribución en la espiral
    return result.sort((a, b) => a.estado.localeCompare(b.estado));
}

// Crear un gráfico de barras radial
function createRadialBarChart(containerId, data, ingrediente) {
    // Verificar si hay datos
    if (!data || data.length === 0) {
        console.warn(`No hay datos para el ingrediente ${ingrediente}`);
        return;
    }
    
    // Eliminar gráfico anterior si existe
    d3.select(`#${containerId}`).selectAll("*").remove();
    
    // Dimensiones del SVG - aumentar para que ocupe todo el espacio
    const width = 1000;  // Aumento de tamaño 
    const height = 1400; // Aumentado aún más para mostrar mayor altura
    const innerRadius = 120; // Círculo central más grande para la imagen
    const outerRadius = Math.min(width, height) / 2 - 120; // Reducir un poco para dar más espacio a las etiquetas
    
    // Crear el SVG con tamaño relativo para que se adapte al contenedor
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${width/2}, ${height/2+150})`);
    
    // Escala para el radio
    const maxCount = d3.max(data, d => d.count);
    const radiusScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([innerRadius, outerRadius]);
    
    // Escala para los ángulos
    const angleScale = d3.scaleBand()
        .domain(data.map(d => d.estado))
        .range([0, 2 * Math.PI])
        .padding(0.8); // Aumentar aún más el padding para mayor separación entre elementos
    
    // Colores personalizados
    const goldColor = "rgba(131, 87, 43, 1)"; // Color dorado fuerte para las bolitas
    const goldLineColor = "rgba(131, 87, 43, 0.4)"; // Color con opacidad para las barras
    const navyBlueColor = "#243360"; // Color azul marino para títulos
    const graphiteGray = "#777777"; // Color gris más claro para etiquetas de estados
    
    // Crear elemento para el fondo (círculo transparente)
    svg.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", innerRadius)
        .attr("fill", "transparent")
        .attr("stroke", "none");
        
    // Mapear ingredientes a sus imágenes correspondientes
    const ingredienteImageMap = {
        "MAIZ": "img/aperitivo/maiz.png",
        "FRIJOL": "img/aperitivo/frijoles.png",
        "CHILE": "img/aperitivo/chile.png",
        "CALABAZA": "img/aperitivo/calabaza.png",
        "CACAO": "img/aperitivo/cacao.png"
    };
    
    // Agregar imagen del ingrediente en el centro (tamaño moderado)
    svg.append("image")
        .attr("xlink:href", ingredienteImageMap[ingrediente])
        .attr("x", -innerRadius * 1.0)
        .attr("y", -innerRadius * 1.0)
        .attr("width", innerRadius * 2.0)
        .attr("height", innerRadius * 2.0)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("opacity", 0.9); // Ligera transparencia para integrarse mejor
    
    // Escala para el tamaño de las bolitas
    const minCount = d3.min(data, d => d.count);
    const dotScale = d3.scaleLinear()
        .domain([minCount, maxCount])
        .range([10, 40]); // Rango de tamaños: aumentado para mayor visibilidad
    
    // Crear las líneas radiales (barras delgadas)
    const lines = svg.selectAll(".radial-line")
        .data(data)
        .enter()
        .append("line")
        .attr("class", "radial-line")
        .attr("x1", d => {
            const angle = angleScale(d.estado) + angleScale.bandwidth() / 2;
            return innerRadius * Math.sin(angle);
        })
        .attr("y1", d => {
            const angle = angleScale(d.estado) + angleScale.bandwidth() / 2;
            return -innerRadius * Math.cos(angle);
        })
        .attr("x2", d => {
            const angle = angleScale(d.estado) + angleScale.bandwidth() / 2;
            return radiusScale(d.count) * Math.sin(angle);
        })
        .attr("y2", d => {
            const angle = angleScale(d.estado) + angleScale.bandwidth() / 2;
            return -radiusScale(d.count) * Math.cos(angle);
        })
        .attr("stroke", goldLineColor)
        .attr("stroke-width", 1.5)
        .style("opacity", 0) // Inicialmente invisibles
        .style("--index", (d, i) => i) // Para animación CSS
        .on("mouseover", function() {
            d3.select(this).attr("stroke-width", 3);
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke-width", 1.5);
        });
    
    // Crear bolitas en los extremos con color dorado fuerte
    const dots = svg.selectAll(".end-circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "end-circle")
        .attr("cx", d => {
            const angle = angleScale(d.estado) + angleScale.bandwidth() / 2;
            return radiusScale(d.count) * Math.sin(angle);
        })
        .attr("cy", d => {
            const angle = angleScale(d.estado) + angleScale.bandwidth() / 2;
            return -radiusScale(d.count) * Math.cos(angle);
        })
        .attr("r", d => dotScale(d.count)) // Radio proporcional
        .attr("fill", goldColor) // Color dorado fuerte para las bolitas
        .attr("stroke", goldColor)
        .attr("stroke-width", 0.5)
        .style("opacity", 0) // Inicialmente invisibles
        .style("--index", (d, i) => i) // Para animación CSS
        .on("mouseover", function() {
            d3.select(this)
                .attr("r", d => dotScale(d.count) * 1.5)
                .attr("filter", "drop-shadow(0 0 3px rgba(131, 87, 43, 0.8))");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("r", d => dotScale(d.count))
                .attr("filter", "none");
        });
    
    // Colores prehispánicos inspirados en arte mexicano antiguo para los tooltips
    const colorPalette = [
        "#9B2226", // Rojo carmín (similar al usado en códices)
        "#BB4D00", // Naranja rojizo (color de cerámica)
        "#AE7C34", // Dorado ocre (color maya)
        "#5F5F41", // Verde oliva (jade)
        "#28666E", // Azul-verde (color turquesa)
        "#073B4C"  // Azul oscuro (color usado en murales)
    ];
    
    // Función para obtener color según índice
    const getPrecolumbianColor = (index) => {
        return colorPalette[index % colorPalette.length];
    };

    // Crear tooltips personalizados con estilo prehispánico
    const tooltip = d3.select("body").append("div")
        .attr("class", "chart-tooltip-prehispanic")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "rgba(240, 235, 206, 0.9)") // Color de papel amate con transparencia
        .style("border", "2px solid " + colorPalette[1])
        .style("border-radius", "0") // Más geométrico como arte prehispánico
        .style("padding", "12px 18px")
        .style("font-family", "'Libre Baskerville', serif")
        .style("font-size", "13px")
        .style("color", "#5F5F41")
        .style("pointer-events", "none")
        .style("z-index", 1000)
        .style("box-shadow", "4px 4px 0 rgba(155, 34, 38, 0.3)") // Sombra estilo prehispánico con más transparencia
        .style("max-width", "200px")
        .style("min-width", "140px")
        .style("text-align", "center")
        .style("transform", "rotate(-1deg)"); // Ligera rotación para efecto visual
    
    // Añadir eventos de tooltip mejorados a las bolitas con estilo prehispánico
    dots.on("mouseover", function(event, d, i) {
            const index = Math.floor(Math.random() * colorPalette.length); // Color aleatorio para variedad
            const mainColor = getPrecolumbianColor(index);
            
            d3.select(this)
                .transition()
                .duration(150)
                .attr("r", d => dotScale(d.count) * 1.8) // Agrandar más la bolita
                .attr("filter", `drop-shadow(0 0 8px ${mainColor})`);
                
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.98)
                .style("border-color", mainColor);
                
            tooltip.html(`
                <div style="position: relative;">
                    <div style="position: absolute; top: -10px; left: -10px; right: -10px; height: 5px; 
                         background: repeating-linear-gradient(90deg, ${mainColor}, ${mainColor} 5px, transparent 5px, transparent 10px);"></div>
                    <div style="font-weight: bold; font-size: 15px; margin: 2px 0 8px 0; color: ${mainColor}; text-transform: uppercase;">
                        ${d.estado}
                    </div>
                    <div style="color: #444; font-size: 13px; font-style: italic;">
                        ${d.count} platillo${d.count !== 1 ? 's' : ''}
                    </div>
                    <div style="margin-top: 5px; font-size: 11px; color: #777;">
                        Estado de México
                    </div>
                    <div style="position: absolute; bottom: -10px; left: -10px; right: -10px; height: 5px; 
                         background: repeating-linear-gradient(90deg, ${mainColor}, ${mainColor} 5px, transparent 5px, transparent 10px);"></div>
                </div>
            `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 20) + "px")
                .style("transform", `rotate(${Math.random() * 2 - 1}deg)`); // Rotación aleatoria ligera
        })
        .on("mouseout", function() {
            d3.select(this)
                .transition()
                .duration(300)
                .attr("r", d => dotScale(d.count))
                .attr("filter", "none");
                
            tooltip.transition()
                .duration(300)
                .style("opacity", 0);
        })
        .style("cursor", "pointer"); // Indicar que es clickeable
    
    // No mostrar etiquetas de texto para los estados - solo tooltips en las bolitas
        
    // Añadir estas líneas para controlar la animación con scroll
    const chartContainer = document.getElementById(containerId);
    
    // Inicialmente ocultar líneas y bolitas
    lines.style("opacity", 0);
    dots.style("opacity", 0);
    
    // Función para comprobar si el elemento está visible en el viewport
    function isInViewport(element) {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom >= 0
        );
    }
    
    // Variable para limitar la frecuencia de las comprobaciones
    let animationFrameId = null;
    let isAnimated = false;
    
    // Función para animar de forma más eficiente sin transiciones excesivas
    function animateIfVisible() {
        // Si ya está animado, no hacer nada
        if (isAnimated) return;
        
        // Cancelar cualquier animación pendiente
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        // Usar requestAnimationFrame para mejorar el rendimiento
        animationFrameId = requestAnimationFrame(() => {
            if (isInViewport(chartContainer)) {
                // Marcar como animado para no repetir
                isAnimated = true;
                
                // Agrupar elementos para reducir el número de transiciones
                const lineGroups = 4; // Agrupar líneas en grupos de 4
                const numLines = data.length;
                
                // Mostrar líneas en grupos para reducir el número de transiciones
                for (let i = 0; i < numLines; i += lineGroups) {
                    const linesSubset = lines.filter((d, idx) => idx >= i && idx < i + lineGroups);
                    const delay = i * 15; // Menos delay entre grupos
                    
                    linesSubset.transition()
                        .duration(600) // Duración más corta
                        .delay(delay)
                        .style("opacity", 1);
                }
                
                // Mostrar los puntos en grupos también
                for (let i = 0; i < numLines; i += lineGroups) {
                    const dotsSubset = dots.filter((d, idx) => idx >= i && idx < i + lineGroups);
                    const delay = i * 15 + 200; // Retraso después de las líneas
                    
                    dotsSubset.transition()
                        .duration(600) // Duración más corta
                        .delay(delay)
                        .style("opacity", 1);
                }
                
                // Desregistrar el event listener para liberar recursos
                window.removeEventListener('scroll', throttledScrollHandler);
                animationFrameId = null;
            }
        });
    }
    
    // Iniciar la animación si ya es visible
    animateIfVisible();
    
    // Añadir evento de scroll para controlar la animación con throttling
    let scrollTimeout;
    function throttledScrollHandler() {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(animateIfVisible, 100); // 100ms throttle
    }
    
    window.addEventListener('scroll', throttledScrollHandler);
}

// Función principal para cargar los datos y crear los gráficos para cada ingrediente
function createAllRadialBarCharts() {
    console.log("Iniciando creación de gráficos radiales...");
    
    // Cargar el archivo CSV
    // Usamos una ruta absoluta para evitar problemas
    const csvPath = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) + '/json/platillos_expandido.csv';
    console.log("Intentando cargar CSV desde:", csvPath);
    
    fetch(csvPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            console.log("Archivo CSV cargado correctamente");
            return response.text();
        })
        .then(csvData => {
            console.log("Datos CSV obtenidos, procesando...");
            
            if (!csvData || csvData.length === 0) {
                console.error("El archivo CSV está vacío");
                return;
            }
            
            // Lista de ingredientes
            const ingredientes = ['MAIZ', 'FRIJOL', 'CHILE', 'CALABAZA', 'CACAO'];
            
            // Crear gráficos para cada ingrediente
            ingredientes.forEach(ingrediente => {
                console.log(`Procesando datos para ${ingrediente}...`);
                try {
                    const data = processDataForRadialBarChart(csvData, ingrediente);
                    console.log(`Datos procesados para ${ingrediente}:`, data.length, "estados encontrados");
                    
                    const containerId = `${ingrediente.toLowerCase()}-estados-radial-chart`;
                    const container = document.getElementById(containerId);
                    
                    if (!container) {
                        console.error(`Contenedor #${containerId} no encontrado en el DOM`);
                        return;
                    }
                    
                    // Añadir título con instrucción
                    const titleContainer = document.querySelector(`#${containerId}`).previousElementSibling;
                    if (titleContainer && titleContainer.classList.contains('radial-chart-title')) {
                        // Añadir la instrucción al título existente
                        const originalText = titleContainer.textContent;
                        titleContainer.innerHTML = `${originalText.split('(')[0].trim()} <span style="color: #777; font-size: 0.8em; font-weight: normal; font-style: italic; display: block;">(Toca las bolitas para ver los estados)</span>`;
                    }
                    
                    createRadialBarChart(containerId, data, ingrediente);
                    console.log(`Gráfico creado para ${ingrediente}`);
                } catch (err) {
                    console.error(`Error procesando ${ingrediente}:`, err);
                }
            });
        })
        .catch(error => {
            console.error('Error cargando los datos:', error);
            // Mostrar mensaje de error visible para el usuario
            document.querySelectorAll('[id$="-estados-radial-chart"]').forEach(container => {
                container.innerHTML = `<div style="text-align:center; padding:20px; color:#833; font-family:sans-serif">
                    <p>Error cargando los datos: ${error.message}</p>
                    <p>Por favor, verifique la consola para más detalles.</p>
                </div>`;
            });
        });
}

// Manejar errores globales - sin registrar ResizeObserver
window.addEventListener('error', function(e) {
    // Filtrar los errores de ResizeObserver para no saturar la consola
    if (e.message && !e.message.includes("ResizeObserver")) {
        console.error('Error global:', e.message, e.filename, e.lineno);
    }
});

// Cargar las visualizaciones de forma más eficiente
// Inicializar una sola vez usando un flag para evitar múltiples inicializaciones
let chartsInitialized = false;

// Función para iniciar las visualizaciones con opciones para retry
function initializeVisualizations(retry = true) {
    if (chartsInitialized) return;
    
    console.log("Iniciando visualizaciones...");
    
    // Comprobar que los contenedores existan antes de inicializar
    const containers = document.querySelectorAll('[id$="-estados-radial-chart"]');
    if (containers.length === 0) {
        console.warn("Contenedores para gráficos no encontrados en el DOM");
        if (retry) {
            // Reintentar una vez después de un tiempo más largo
            console.log("Reintentando inicialización en 800ms...");
            setTimeout(() => initializeVisualizations(false), 800);
        }
        return;
    }
    
    // Marcar como inicializado
    chartsInitialized = true;
    createAllRadialBarCharts();
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Usar requestIdleCallback si está disponible, o setTimeout como fallback
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => initializeVisualizations());
    } else {
        setTimeout(initializeVisualizations, 500);
    }
});