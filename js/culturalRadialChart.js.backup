/**
 * Gráfico simple para culturas prehispánicas
 */

// Datos estáticos para garantizar que el gráfico funcione
const datosPrehistoricos = [
    { cultura: "Maya", count: 42 },
    { cultura: "Mexica", count: 38 },
    { cultura: "Azteca", count: 35 },
    { cultura: "Zapoteca", count: 30 },
    { cultura: "Mixteca", count: 26 },
    { cultura: "Olmeca", count: 23 },
    { cultura: "Otomí", count: 18 },
    { cultura: "Totonaca", count: 15 },
    { cultura: "Purépecha", count: 12 },
    { cultura: "Tolteca", count: 10 }
];

// Descripciones para el tooltip
const descripcionesCulturas = {
    "Maya": "Desarrollaron técnicas avanzadas para cultivar cacao y domesticaron la abeja melipona para obtener miel. Cultivaban chile habanero y achiote.",
    "Azteca": "Creadores del pochtecayotl, un sistema de mercados donde intercambiaban especias, semillas y textiles. Fueron expertos en técnicas de conservación de alimentos.",
    "Mexica": "Cultivaron chinampas, islas artificiales donde sembraban maíz, chile, frijol y calabaza. El emperador Moctezuma tomaba xocolatl espumoso adornado con oro.",
    "Zapoteca": "Maestros de la fermentación del maguey, creando bebidas sagradas como el tepache. Conocidos por sus técnicas de secado de chile.",
    "Otomí": "Hábiles recolectores de insectos comestibles como el escamol. Desarrollaron técnicas para extraer aguamiel del maguey.",
    "Olmeca": "Primera gran civilización en domesticar el chile. Desarrollaron las primeras técnicas de nixtamalización del maíz.",
    "Mixteca": "Expertos en técnicas de recolección y preparación de hongos silvestres. Crearon colorantes naturales a partir de la grana cochinilla.",
    "Tolteca": "Refinaron técnicas culinarias y crearon platos ceremoniales con flores comestibles. Maestros del pulque sagrado.",
    "Purépecha": "Desarrollaron técnicas de pesca en el lago de Pátzcuaro. Crearon la charanda, bebida fermentada tradicional.",
    "Totonaca": "Domesticaron la vainilla, utilizándola en bebidas ceremoniales y como medicina. Técnicas avanzadas de pesca y conservación de mariscos."
};

// Crear un gráfico radial para culturas
function createCulturalRadialChart() {
    const containerId = "cultural-radial-chart";
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error("Contenedor no encontrado:", containerId);
        return;
    }
    
    // Limpiar contenedor
    container.innerHTML = "";
    
    // Eliminar tooltips anteriores para evitar duplicados
    d3.selectAll('.cultural-tooltip').remove();
    
    // Obtener dimensiones del contenedor
    const width = container.clientWidth || 550;
    const height = container.clientHeight || 550;
    
    // Crear SVG
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width/2}, ${height/2})`);
    
    // Calcular radios
    const innerRadius = 30;
    const outerRadius = Math.min(width, height) / 2 - 50;
    
    // Escala para el radio
    const radiusScale = d3.scaleLinear()
        .domain([0, d3.max(datosPrehistoricos, d => d.count)])
        .range([innerRadius, outerRadius]);
    
    // Función personalizada para asignar ángulos (con Maya a la 1:00)
// Función personalizada para asignar ángulos (con Maya a las 12:00)
    function getAngle(cultura) {
        const culturas = datosPrehistoricos.map(d => d.cultura);

        // Calcular índice de la cultura en el array
        const index = culturas.indexOf(cultura);
        const totalCulturas = culturas.length;

        // Distribuir uniformemente, restando un pequeño margen para que no se sobrepongan
        const anguloTotal = 2 * Math.PI - (2 * Math.PI / totalCulturas);

        // Calcular el ángulo específico para cada uno
        return (-Math.PI / 2) + ((anguloTotal / totalCulturas) * index);
    }

    // Función para obtener ángulo para una cultura dada
    function getAngleForCultura(cultura) {
        return getAngle(cultura);
    }


// Función para obtener ángulo para una cultura dada
function getAngleForCultura(cultura) {
    return getAngle(cultura);
    }
    
    // Círculo central transparente
    svg.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", innerRadius)
        .attr("fill", "transparent")
        .attr("stroke", "rgba(131, 87, 43, 0.3)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3");
    
    // Líneas para cada cultura (como radios)
    const lines = svg.selectAll(".culture-line")
        .data(datosPrehistoricos)
        .enter()
        .append("line")
        .attr("class", "culture-line")
        .attr("x1", d => {
            const angle = getAngleForCultura(d.cultura);
            return innerRadius * Math.cos(angle);
        })
        .attr("y1", d => {
            const angle = getAngleForCultura(d.cultura);
            return innerRadius * Math.sin(angle);
        })
        .attr("x2", d => {
            const angle = getAngleForCultura(d.cultura);
            return radiusScale(d.count) * Math.cos(angle);
        })
        .attr("y2", d => {
            const angle = getAngleForCultura(d.cultura);
            return radiusScale(d.count) * Math.sin(angle);
        })
        .attr("stroke", "rgba(131, 87, 43, 0.6)")
        .attr("stroke-width", 2);
    
    // Círculos en los extremos
    const dots = svg.selectAll(".culture-dot")
        .data(datosPrehistoricos)
        .enter()
        .append("circle")
        .attr("class", "culture-dot")
        .attr("cx", d => {
            const angle = getAngleForCultura(d.cultura);
            return radiusScale(d.count) * Math.cos(angle);
        })
        .attr("cy", d => {
            const angle = getAngleForCultura(d.cultura);
            return radiusScale(d.count) * Math.sin(angle);
        })
        .attr("r", d => Math.max(5, Math.min(30, d.count / 2))) // Tamaño proporcional
        .attr("fill", "rgba(131, 87, 43, 0.9)")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .style("cursor", "pointer");
    
    // Etiquetas de texto
    const labels = svg.selectAll(".culture-label")
        .data(datosPrehistoricos)
        .enter()
        .append("text")
        .attr("class", "culture-label")
        .attr("x", d => {
            const angle = getAngleForCultura(d.cultura);
            return (radiusScale(d.count) + 20) * Math.cos(angle);
        })
        .attr("y", d => {
            const angle = getAngleForCultura(d.cultura);
            return (radiusScale(d.count) + 20) * Math.sin(angle);
        })
        .attr("text-anchor", d => {
            const angle = getAngleForCultura(d.cultura);
            if (Math.cos(angle) > 0.1) return "start";
            if (Math.cos(angle) < -0.1) return "end";
            return "middle";
        })
        .attr("dominant-baseline", d => {
            const angle = getAngleForCultura(d.cultura);
            if (Math.sin(angle) > 0.1) return "hanging";
            if (Math.sin(angle) < -0.1) return "baseline";
            return "middle";
        })
        .text(d => `${d.cultura}`)
        .style("font-size", "12px")
        .style("font-family", "'Libre Baskerville', serif")
        .style("fill", "#696969");
    
    // Crear tooltip con estilo consistente con otros tooltips
    const tooltip = d3.select("body").append("div")
        .attr("class", "chart-tooltip-prehispanic cultural-tooltip")
        .style("position", "absolute")
        .style("opacity", 0)
        .style("max-width", "220px")
        .style("z-index", "9999")
        .style("pointer-events", "none")
        .style("--tooltip-color", "#C03E1D"); // Variable CSS para el color principal
    
    // Interacción
    dots.on("mouseover", function(event, d) {
        // Destacar línea y punto
        d3.select(this)
            .transition()
            .duration(200)
            .attr("r", function(d) { return Math.max(8, Math.min(20, d.count / 2.5)); });
        
        // Destacar etiqueta correspondiente
        labels.filter(labelData => labelData.cultura === d.cultura)
            .transition()
            .duration(200)
            .style("font-weight", "bold")
            .style("fill", "rgba(131, 87, 43)")
            .style("font-size", "12px");
        
        // Mostrar tooltip con animación
        tooltip.classed("tooltip-appear", true)
            .style("opacity", 1);
        
        tooltip.html(`
            <div class="tooltip-pattern-line top"></div>
            <div class="tooltip-title">${d.cultura}</div>
            <div class="tooltip-sub">${d.count} ingredientes</div>
            <div class="tooltip-content">
                ${descripcionesCulturas[d.cultura] || "Aportaron ingredientes únicos a la gastronomía."}
            </div>
            <div class="tooltip-pattern-line bottom"></div>
        `)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 15) + "px");
    })
    .on("mouseout", function() {
        // Restaurar punto
        d3.select(this)
            .transition()
            .duration(200)
            .attr("r", d => Math.max(5, Math.min(15, d.count / 3)));
        
        // Restaurar todas las etiquetas
        labels.transition()
            .duration(200)
            .style("font-weight", "normal")
            .style("fill", "#999")
            .style("font-size", "10px");
        
        // Ocultar tooltip con animación
        tooltip.classed("tooltip-appear", false)
            .transition()
            .duration(200)
            .style("opacity", 0);
    });
}

// Iniciar la función principal
document.addEventListener('DOMContentLoaded', function() {
    // Configurar el título
    const titleElement = document.querySelector("#cultural-radial-chart").previousElementSibling;
    if (titleElement && titleElement.classList.contains('radial-chart-title')) {
        titleElement.innerHTML = "¿Qué culturas dieron sabor a la mesa prehispánica? <span style='display:block; color:#999; font-size:0.7em; margin-top:3px;'>(Acerca el mouse a los puntos para ver detalles)</span>";
    }
    
    // Iniciar el gráfico
    createCulturalRadialChart();
    
    // Responder a redimensionamientos de ventana
    window.addEventListener('resize', function() {
        createCulturalRadialChart();
    });
});