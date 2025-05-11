/**
 * fullNetworkGraph.js
 * Script para inicializar y configurar el grafo completo sin filtros de ingredientes
 * en la sección de "Visión integral de la gastronomía prehispánica"
 */

document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar si existe el contenedor para el grafo completo
    const fullNetworkContainer = document.getElementById('full-network');
    if (!fullNetworkContainer) return;

    // Este script depende de circularGraph.js, por lo que usamos las mismas funciones
    // pero con una instancia diferente para el nuevo contenedor
    
    // Crear un botón de reinicio que activa la función de regenerateGraph del grafo principal
    const resetViewBtn = document.getElementById('reset-view-btn');
    if (resetViewBtn) {
        resetViewBtn.addEventListener('click', function() {
            // Reiniciar el grafo completo
            initFullNetworkGraph();
        });
    }

    // Función para inicializar el grafo completo
    function initFullNetworkGraph() {
        // Obtener las dimensiones del contenedor
        const width = fullNetworkContainer.clientWidth;
        const height = fullNetworkContainer.clientHeight;

        // Limpiar el contenedor actual
        d3.select(fullNetworkContainer).selectAll("*").remove();
        
        // Crear el SVG con las mismas proporciones que el grafo original pero adaptado al nuevo contenedor
        const svg = d3.select(fullNetworkContainer)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");
            
        // Establecer fondo transparente
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "#F6F0E4");
            
        // Elementos de zoom similares al grafo principal
        const zoomContainer = svg.append("g");
        
        // Añadir grupo principal con el mismo desplazamiento del grafo original
        const offset = width * 0.10; // 10% del ancho como desplazamiento
        const mainGroup = zoomContainer.append('g')
            .attr('transform', `translate(${Math.floor(width / 2) - offset}, ${Math.floor(height / 2)})`)
            .attr('class', 'main-group');
            
        // Configurar zoom
        const zoom = d3.zoom()
            .scaleExtent([0.5, 4])
            .on("zoom", (event) => {
                zoomContainer.attr("transform", event.transform);
            });
            
        svg.call(zoom);
        
        // Establecer un zoom inicial similar al grafo original
        zoomContainer.transition().duration(500)
            .call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1.2));
            
        // Cargar los datos del json principal y crear el grafo completo
        // Esta parte reutiliza la estructura de datos y la lógica del grafo original
        d3.json('json/OTROS/datos.json').then(data => {
            if (!data) return;
            
            // Adaptar los datos para el grafo completo
            // En este caso no aplicamos filtros de ingredientes activos
            
            // Configurar los niveles del grafo (capas)
            const radiusLevel1 = 30;  // Radio para nodos de época (nivel 1)
            const radiusLevel2 = 20;  // Radio para nodos de origen (nivel 2)
            const radiusLevel3 = 15;  // Radio para nodos de platillo (nivel 3)
            const radiusLevel4 = radiusLevel3 + 100; // Radio para el anillo de categorías (nivel 4)
            
            // Paleta de colores similar al grafo original
            const colorPalette = {
                epoca: '#B8860B',     // Dorado oscuro para épocas
                origen: '#8B4513',    // Marrón para orígenes
                platillo: '#CD853F'   // Marrón claro para platillos
            };
            
            // Preparar los nodos - similar al grafo original pero sin filtros
            const epochNodes = data.epocas.map(epoca => ({
                id: epoca.id,
                name: epoca.nombre,
                level: 1, // Nivel 1: Épocas
                radius: radiusLevel1,
                image: epoca.imagen || null
            }));
            
            const originNodes = data.origenes.map(origen => ({
                id: origen.id,
                name: origen.nombre,
                level: 2, // Nivel 2: Orígenes culinarios
                radius: radiusLevel2,
                epoca_id: origen.epoca_id // Conexión a su época
            }));
            
            const dishNodes = data.platillos.map(platillo => ({
                id: platillo.id,
                name: platillo.nombre,
                level: 3, // Nivel 3: Platillos
                radius: radiusLevel3,
                origen_id: platillo.origen_id, // Conexión a su origen
                tipo_platillo: platillo.TIPO_Platillo // Categoría del platillo
            }));
            
            // Combinar todos los nodos
            const nodes = [...epochNodes, ...originNodes, ...dishNodes];
            
            // Crear enlaces - similar al grafo original
            const links = [];
            
            // Enlaces época-origen
            originNodes.forEach(origen => {
                links.push({
                    source: origen.epoca_id,
                    target: origen.id,
                    type: 'epoca-origen'
                });
            });
            
            // Enlaces origen-platillo
            dishNodes.forEach(platillo => {
                links.push({
                    source: platillo.origen_id,
                    target: platillo.id,
                    type: 'origen-platillo'
                });
            });
            
            // Configurar la simulación de fuerzas
            const simulation = d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links)
                    .id(d => d.id)
                    .distance(d => {
                        if (d.type === 'epoca-origen') return 80;
                        if (d.type === 'origen-platillo') return 80;
                        return 50;
                    }))
                .force("charge", d3.forceManyBody().strength(-100))
                .force("collide", d3.forceCollide().radius(d => d.radius * 1.2))
                .force("r", d3.forceRadial(d => {
                    if (d.level === 1) return 0; // Épocas en el centro
                    if (d.level === 2) return radiusLevel2 * 3; // Orígenes en el segundo anillo
                    return radiusLevel3 * 8; // Platillos en el tercer anillo
                }))
                .force("center", d3.forceCenter(0, 0));
            
            // Crear los enlaces visuales
            const link = mainGroup.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(links)
                .enter()
                .append("line")
                .attr("stroke-width", 1)
                .attr("stroke", "#999")
                .attr("opacity", 0.4);
            
            // Crear los nodos visuales
            const node = mainGroup.append("g")
                .attr("class", "nodes")
                .selectAll(".node")
                .data(nodes)
                .enter()
                .append("g")
                .attr("class", "node");
            
            // Añadir círculos para cada nodo
            node.each(function(d) {
                const nodeGroup = d3.select(this);
                
                // Configuración específica según el nivel del nodo
                if (d.level === 1) {
                    // Nodos de época (nivel 1)
                    // Si tiene imagen, crear patrón para usarla como fondo
                    if (d.image) {
                        const defs = svg.append("defs");
                        const imageUrl = d.image;
                        const radius = d.radius;
                        
                        // Crear patrón para la imagen
                        const patternId = `pattern-full-${d.id.replace(/\s+/g, '-').replace(/[()]/g, '').replace(/[\/]/g, '-')}`;
                        const pattern = defs.append('pattern')
                            .attr('id', patternId)
                            .attr('width', 1)
                            .attr('height', 1)
                            .attr('x', 0)
                            .attr('y', 0)
                            .attr('patternContentUnits', 'objectBoundingBox')
                            .attr('patternUnits', 'objectBoundingBox');
                        
                        // Añadir imagen al patrón
                        pattern.append('image')
                            .attr('href', imageUrl)
                            .attr('width', 1)
                            .attr('height', 1)
                            .attr('x', 0)
                            .attr('y', 0)
                            .attr('preserveAspectRatio', 'xMidYMid meet');
                        
                        // Añadir círculo de fondo
                        nodeGroup.append('circle')
                            .attr('r', radius + 2)
                            .attr('fill', colorPalette.epoca)
                            .attr('opacity', 0.3);
                        
                        // Añadir círculo con la imagen
                        nodeGroup.append('circle')
                            .attr('r', radius)
                            .attr('fill', `url(#${patternId})`)
                            .attr('stroke', '#fff')
                            .attr('stroke-width', 1.5)
                            .attr('opacity', 0.9);
                    } else {
                        // Sin imagen, usar color sólido
                        nodeGroup.append('circle')
                            .attr('r', d.radius)
                            .attr('fill', colorPalette.epoca)
                            .attr('stroke', '#fff')
                            .attr('stroke-width', 1.5)
                            .attr('opacity', 0.9);
                    }
                } else if (d.level === 2) {
                    // Nodos de origen (nivel 2)
                    nodeGroup.append('circle')
                        .attr('r', d.radius)
                        .attr('fill', colorPalette.origen)
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 1)
                        .attr('opacity', 0.5); // 50% de opacidad para orígenes
                } else {
                    // Nodos de platillo (nivel 3)
                    nodeGroup.append('circle')
                        .attr('r', d.radius)
                        .attr('fill', colorPalette.platillo)
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 0.5)
                        .attr('opacity', 0.85);
                }
            });
            
            // Mostrar tooltips al pasar el mouse sobre los nodos
            node.append("title")
                .text(d => d.name);
            
            // Actualizar posiciones en cada tick de la simulación
            simulation.on("tick", () => {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);
                
                node.attr("transform", d => `translate(${d.x},${d.y})`);
            });
            
            // Crear el anillo de categorías (nivel 4) si existe la función
            if (window.createCategoryRing) {
                setTimeout(() => {
                    window.createCategoryRing(
                        mainGroup, 
                        nodes, 
                        links, 
                        radiusLevel3, 
                        radiusLevel4, 
                        width, 
                        height, 
                        false, // No hay ingrediente activo
                        false  // No hay nodos seleccionados, hover activado
                    );
                }, 500);
            }
        });
    }

    // Inicializar el grafo completo cuando se carga la página
    initFullNetworkGraph();
});