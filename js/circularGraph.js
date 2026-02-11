/**
 * Grafo circular en D3.js que muestra las relaciones entre:
 * - Nivel 1 (centro): Épocas de platillos
 * - Nivel 2 (medio): Orígenes de platillos
 * - Nivel 3 (exterior): Nombres de platillos
 * - Nivel 4 (último anillo): Categorías de platillos por tipo
 * 
 * El grafo se filtra dinámicamente según el ingrediente en foco:
 * - Maíz, Frijol, Chile, Calabaza o Cacao
 */
// Esperamos a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando grafo circular (versión mejorada)...');

    // Función para asegurar que existe el contenedor
    function ensureContainer() {
        // Verificar si el contenedor existe
        let networkContainer = document.getElementById('network');
        
        // Si no existe, intentar encontrar o crear el contenedor
        if (!networkContainer) {
            console.log('Contenedor #network no encontrado, intentando crear uno...');
            
            // Buscar el contenedor .visualization-container
            const vizContainer = document.querySelector('.visualization-container');
            
            if (vizContainer) {
                console.log('Contenedor .visualization-container encontrado, creando #network dentro');
                networkContainer = document.createElement('div');
                networkContainer.id = 'network';
                networkContainer.style.width = '100%';
                networkContainer.style.height = '700px';
                networkContainer.style.backgroundColor = '#F6F0E4';
                vizContainer.innerHTML = ''; // Limpiar cualquier contenido previo
                vizContainer.appendChild(networkContainer);
            } else {
                console.log('Esperando .visualization-container (section-loader en curso)...');
                
                // Intentar buscar en .sticky-image-sankey
                const sankeyContainer = document.querySelector('.sticky-image-sankey');
                if (sankeyContainer) {
                    console.log('Contenedor .sticky-image-sankey encontrado, creando .visualization-container y #network dentro');
                    
                    // Crear visualization-container
                    const newVizContainer = document.createElement('div');
                    newVizContainer.className = 'visualization-container';
                    newVizContainer.style.width = '100%';
                    newVizContainer.style.height = '700px';
                    
                    // Crear network dentro
                    networkContainer = document.createElement('div');
                    networkContainer.id = 'network';
                    networkContainer.style.width = '100%';
                    networkContainer.style.height = '700px';
                    networkContainer.style.backgroundColor = '#F6F0E4';
                    
                    // Añadir al DOM
                    newVizContainer.appendChild(networkContainer);
                    sankeyContainer.innerHTML = '';
                    sankeyContainer.appendChild(newVizContainer);
                }
            }
        } else {
            console.log('Contenedor #network encontrado correctamente');
        }
        
        return !!document.getElementById('network');
    }
    
    // Función para verificar si el grafo ya existe y regenerarlo
    function regenerateGraph() {
        // Verificar y asegurar que el contenedor existe
        if (ensureContainer()) {
            console.log('Verificando estado del grafo y regenerando si es necesario...');
            
            // Forzar recreación del grafo
            const network = document.getElementById('network');
            if (network) {
                // Limpiar el contenedor antes de recrear
                network.innerHTML = '';
                console.log('Contenedor limpiado, iniciando creación del grafo...');
                initGraph();
            } else {
                console.error('No se encontró el contenedor #network después de intentar crearlo');
            }
        } else {
            console.error('No se pudo crear el contenedor para el grafo');
        }
    }
    
    // Variable para debounce del resize
    let resizeTimeout;
    
    // Llamar a regenerar el grafo cuando la página cambie de tamaño, con debounce
    window.addEventListener('resize', function() {
        // Cancelar cualquier timeout existente
        if (resizeTimeout) clearTimeout(resizeTimeout);
        
        // Establecer un nuevo timeout
        resizeTimeout = setTimeout(function() {
            regenerateGraph();
        }, 300); // 300ms debounce
    });
    
    // Asegurar contenedor inmediatamente
    ensureContainer();
    
    // Función principal de inicialización del grafo
    function initGraph() {
        // Asegurarse de que D3 está disponible
        if (!window.d3) {
            console.error('D3.js no está cargado. Por favor incluya la biblioteca D3 antes de este script.');
            return;
        }
        
        // Verificar que el contenedor del grafo existe
        const networkContainer = document.getElementById('network');
        if (!networkContainer) {
            console.error('Error: No se encontró el contenedor #network para el grafo circular.');
            return; // No podemos continuar sin un contenedor
        } else {
            console.log('Contenedor #network encontrado correctamente');
        }
        
        // Ingredientes principales para filtrado
        const INGREDIENTES_PRINCIPALES = [
            'MAÍZ', 'FRIJOL', 'CHILE', 'CALABAZA', 'CACAO'
        ];
        
        // Variable global para el ingrediente actualmente seleccionado
        let ingredienteActivo = null;
        
        // Dimensiones y configuración - Adaptamos al contenedor y pantalla disponible
        const container = document.getElementById('network');
        // Usar getComputedStyle para evitar forzar layout con getBoundingClientRect
        const computedStyle = window.getComputedStyle(container);
        const containerWidth = parseInt(computedStyle.width) || window.innerWidth * 0.75;
        const containerHeight = parseInt(computedStyle.height) || window.innerHeight * 0.8;
        
        // Utilizar todo el espacio disponible sin exceder el contenedor
        const width = Math.floor(containerWidth - 40); // Margen para evitar cortes, usando Math.floor para evitar decimales
        const height = Math.floor(containerHeight - 40); // Margen para evitar cortes, usando Math.floor para evitar decimales
        
        console.log(`Creando grafo con dimensiones: ${width}x${height}`);
        
        // Radio proporcional a la dimensión más pequeña
        const radius = Math.min(width, height) / 2 - 60;
        
        // Radios para cada nivel
        const radiusLevel1 = radius * 0.25; // Centro más pequeño
        const radiusLevel2 = radius * 0.55; // Nivel medio
        const radiusLevel3 = radius * 0.8; // Exterior de platillos
        const radiusLevel4 = radius * 0.95; // Nivel más exterior (tipo de platillo)
        
        // Establecer dimensiones del contenedor
        container.style.width = '100%';
        container.style.height = '100%';
        
        // Limpiar el contenedor antes de crear el SVG
        d3.select('#network').html('');
        
        console.log('Creando el SVG para el grafo circular...');
        
        // Crear el contenedor SVG con funcionalidad de zoom
        const zoomContainer = d3.select('#network')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('style', 'max-width: 100%; height: auto; background-color: #F6F0E4; border-radius: 8px;');
            
        // Añadir grupo principal que será afectado por el zoom
        // Movemos todo un 10% hacia la izquierda (15% original - 5% a la derecha)
        const offset = Math.floor(width * 0.10); // 10% del ancho como desplazamiento
        const svg = zoomContainer.append('g')
            .attr('transform', `translate(${Math.floor(width / 2) - offset}, ${Math.floor(height / 2)})`)
            .attr('class', 'main-group');
            
        // Configurar el zoom
        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])  // Limita el nivel de zoom entre 0.5x y 3x
            .on("zoom", (event) => {
                // Mantener el desplazamiento del 10% hacia la izquierda durante el zoom
                const offset = Math.floor(width * 0.10); // 10% del ancho como desplazamiento
                svg.attr("transform", `translate(${width/2 - offset + event.transform.x}, ${height/2 + event.transform.y}) scale(${event.transform.k})`);
            });
            
        // Activar el zoom en el SVG
        zoomContainer.call(zoom);
        
        // Establecer un zoom inicial moderado
        zoomContainer.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1.2));
        
        // Añadir instrucciones discretas para el zoom (se colocará más tarde después de crear el elemento de información)
        
        // Crear círculos guía para los niveles
        const guideCircles = svg.append('g').attr('class', 'guide-circles');
        
        // Círculos guía con estilo suave
        guideCircles.selectAll('.guide-circle')
            .data([radiusLevel1, radiusLevel2, radiusLevel3, radiusLevel4])
            .enter()
            .append('circle')
            .attr('class', 'guide-circle')
            .attr('r', d => d)
            .attr('fill', 'none')
            .attr('stroke', '#ddd')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .attr('opacity', 0.6);
        
        // Crear grupos principales para los elementos visuales
        const linkGroup = svg.append('g').attr('class', 'links');
        const nodeGroup = svg.append('g').attr('class', 'nodes');
        const labelGroup = svg.append('g').attr('class', 'labels');
        const typeRingGroup = svg.append('g').attr('class', 'type-ring');
        
        // Variables globales
        let simulation;
        let nodes = [];
        let links = [];
        let nodesFiltered = [];
        let linksFiltered = [];
        let nodeElements, linkElements, labelElements;
        
        // Función para actualizar el ingrediente activo (expuesta globalmente)
        window.actualizarIngredienteGrafo = function(ingrediente) {
            console.log('Filtrar grafo por ingrediente:', ingrediente);
            
            // Si no hay ingrediente o está vacío, mostrar grafo completo
            if (!ingrediente || ingrediente.trim() === '') {
                console.log('Ingrediente vacío o nulo, mostrando grafo completo');
                ingredienteActivo = null;
            } else {
                // Normalizar nombre del ingrediente
                ingredienteActivo = ingrediente.trim().toUpperCase();
                
                // Manejar variaciones de nombres
                if (ingredienteActivo === 'MAIZ') ingredienteActivo = 'MAÍZ';
                if (ingredienteActivo === 'FRÍJOL') ingredienteActivo = 'FRIJOL';
                
                console.log('Ingrediente normalizado para búsqueda:', ingredienteActivo);
            }
            
            if (window.grafoData && window.grafoInicializado) {
                // El grafo está inicializado, podemos filtrar
                filtrarPorIngrediente(ingredienteActivo);
                actualizarVisualizacion();
            } else {
                console.log('Esperando a que el grafo se inicialice para filtrar por:', ingrediente);
                // Intentar de nuevo después de un breve retraso
                if (window.grafoData && !window.grafoInicializado) {
                    setTimeout(() => {
                        if (window.grafoInicializado) {
                            filtrarPorIngrediente(ingredienteActivo);
                            actualizarVisualizacion();
                        }
                    }, 500);
                }
            }
        };
        
        // Paleta de colores inspirada en colores mexicanos tradicionales
        const colorPalette = {
            epoca: '#9B2226',       // Rojo carmín (similar al usado en arte mexicano)
            origen: '#BB4D00',      // Naranja-rojizo (color de barro)
            platillo: '#073B4C',    // Azul oscuro (color usado en cerámica talavera)
            link1: '#AE7C34',       // Dorado ocre (color maya)
            link2: '#5F5F41',       // Verde oliva (color de jade)
            background: '#F8F4E3'   // Beige claro (color de papel amate)
        };
        
        // Función para determinar colores de los nodos según el nivel
        function getNodeColor(node) {
            if (node.level === 1) return colorPalette.epoca;     // Época (centro)
            if (node.level === 2) return colorPalette.origen;    // Origen (medio)
            return colorPalette.platillo;                        // Platillos (nivel 3)
        }
        
        // Función para determinar el tamaño de los nodos
        function getNodeRadius(node) {
            // Calcular el número de conexiones en el grafo filtrado actual
            let connectionCount = 0;
            
            // Contar las conexiones en los enlaces filtrados
            linksFiltered.forEach(link => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                
                if (sourceId === node.id || targetId === node.id) {
                    connectionCount++;
                }
            });
            
            // Aplicar escala según el nivel
            if (node.level === 1) {
                // Épocas: tamaño proporcionalmente mayor
                return Math.max(15, Math.min(40, 16 + connectionCount * 0.9));
            }
            if (node.level === 2) {
                // Orígenes: tamaño medio con escala más drástica
                if (ingredienteActivo && node.isRelevant) {
                    // Escala mucho más pronunciada para orígenes relevantes cuando hay filtro
                    return Math.max(8, Math.min(90, 8 + connectionCount * 1.5));
                } else {
                    // Escala normal para cuando no hay filtro o no son relevantes
                    return Math.max(8, Math.min(60, 8 + connectionCount * 0.3));
                }
            }
            
            // Platillos: tamaño uniforme pero ligeramente variable según relevancia
            return node.isRelevant ? 5 : 4;
        }
        
        // Funciones para controlar el arrastre de nodos
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            // No resetear la posición para que quede fija donde el usuario la dejó
        }
        
        // Crear tooltip elegante
        const tooltip = d3.select('body').append('div')
            .attr('class', 'graph-tooltip-custom')
            .style('position', 'absolute')
            .style('background-color', 'rgba(255, 255, 255, 0.95)')
            .style('border', '1px solid #ddd')
            .style('border-radius', '6px')
            .style('padding', '10px 15px')
            .style('font-family', "'Cardo', serif")
            .style('font-size', '13px')
            .style('color', '#333')
            .style('pointer-events', 'none')
            .style('z-index', 1000)
            .style('box-shadow', '0 2px 8px rgba(0,0,0,0.15)')
            .style('max-width', '280px')
            .style('opacity', 0)
            .style('transition', 'opacity 0.2s ease');
        
        // Función para filtrar por ingrediente y/o época
        function filtrarPorIngrediente(ingrediente) {
            if (!window.grafoData) {
                console.warn('No hay datos de grafo disponibles para filtrar');
                return;
            }
            
            // Actualizamos el ingrediente activo
            ingredienteActivo = ingrediente;
            
            console.log(`Actualizando filtro - Ingrediente activo: ${ingredienteActivo}`);
            
            // Filtrar por "México Prehispánico (Antes de 1521)" independientemente del ingrediente
            const epocaFiltro = 'México Prehispánico (Antes de 1521)';
            
            // Si no hay ingrediente activo, mostrar solo la época prehispánica
            if (!ingredienteActivo) {
                console.log(`Filtrando grafo por época: ${epocaFiltro}`);
                
                // Filtrar nodos por época prehispánica
                const epocaNode = nodes.find(n => n.level === 1 && n.name === epocaFiltro);
                
                if (!epocaNode) {
                    console.warn('No se encontró la época prehispánica en los datos');
                    nodesFiltered = [...nodes];
                    linksFiltered = [...links];
                    return;
                }
                
                // Identificar orígenes conectados a esta época
                const origenesConectados = new Set();
                links.forEach(link => {
                    if (link.type === 'epoca-origen' && 
                        (typeof link.source === 'object' ? link.source.id : link.source) === epocaNode.id) {
                        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                        origenesConectados.add(targetId);
                    }
                });
                
                // Identificar platillos conectados a estos orígenes
                const platillosConectados = new Set();
                links.forEach(link => {
                    if (link.type === 'origen-platillo' && 
                        origenesConectados.has(typeof link.source === 'object' ? link.source.id : link.source)) {
                        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                        platillosConectados.add(targetId);
                    }
                });
                
                // Filtrar nodos
                nodesFiltered = nodes.filter(node => {
                    if (node.level === 1) return node.id === epocaNode.id;
                    if (node.level === 2) return origenesConectados.has(node.id);
                    if (node.level === 3) return platillosConectados.has(node.id);
                    return false;
                });
                
                // Filtrar enlaces
                linksFiltered = links.filter(link => {
                    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                    
                    if (link.type === 'epoca-origen') {
                        return sourceId === epocaNode.id && origenesConectados.has(targetId);
                    }
                    if (link.type === 'origen-platillo') {
                        return origenesConectados.has(sourceId) && platillosConectados.has(targetId);
                    }
                    return false;
                });
                
                // Marcar todos los nodos como relevantes
                nodesFiltered.forEach(node => {
                    node.isRelevant = true;
                });
                
                // Marcar todos los enlaces como relevantes
                linksFiltered.forEach(link => {
                    link.isRelevant = true;
                    link.opacity = 0.6; // Opacidad media
                });
                
                return;
            }
            
            console.log(`Filtrando grafo por ingrediente: ${ingredienteActivo}`);
            
            // Paso 1: Identificar platillos que contienen el ingrediente específico
            const platillosConIngrediente = new Set();
            
            // Buscar platillos (nivel 3) que contengan el ingrediente
            nodes.forEach(node => {
                if (node.level === 3 && node.ingredientes && node.ingredientes.length > 0) {
                    // Buscar si alguno de los ingredientes contiene el texto buscado
                    const tieneIngrediente = node.ingredientes.some(ing => 
                        ing && typeof ing === 'string' && ing.includes(ingredienteActivo)
                    );
                    
                    if (tieneIngrediente) {
                        platillosConIngrediente.add(node.id);
                        node.isRelevant = true; // Marcar como relevante
                    } else {
                        node.isRelevant = false;
                    }
                } else if (node.level === 3) {
                    node.isRelevant = false;
                }
            });
            
            console.log(`Encontrados ${platillosConIngrediente.size} platillos con ingrediente: ${ingredienteActivo}`);
            
            // Paso 2: Identificar orígenes relacionados con estos platillos
            const origenesRelacionados = new Set();
            const enlacesOrigenPlatillo = [];
            
            links.forEach(link => {
                // Verificar si es un enlace entre origen y platillo
                if (link.type === 'origen-platillo') {
                    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                    if (platillosConIngrediente.has(targetId)) {
                        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                        origenesRelacionados.add(sourceId);
                        enlacesOrigenPlatillo.push(link); // Guardar este enlace
                    }
                }
            });
            
            console.log(`Encontrados ${origenesRelacionados.size} orígenes relacionados con ${ingredienteActivo}`);
            
            // Marcar orígenes como relevantes
            nodes.forEach(node => {
                if (node.level === 2) {
                    node.isRelevant = origenesRelacionados.has(node.id);
                }
            });
            
            // Paso 3: Identificar épocas relacionadas con estos orígenes
            const epocasRelacionadas = new Set();
            const enlacesEpocaOrigen = [];
            
            links.forEach(link => {
                if (link.type === 'epoca-origen') {
                    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                    if (origenesRelacionados.has(targetId)) {
                        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                        epocasRelacionadas.add(sourceId);
                        enlacesEpocaOrigen.push(link); // Guardar este enlace
                    }
                }
            });
            
            console.log(`Encontradas ${epocasRelacionadas.size} épocas relacionadas con ${ingredienteActivo}`);
            
            // Marcar épocas como relevantes
            nodes.forEach(node => {
                if (node.level === 1) {
                    node.isRelevant = epocasRelacionadas.has(node.id);
                }
            });
            
            // Paso 4: Crear la lista filtrada de nodos y enlaces
            
            // Enfoque estricto: Mostrar solo los nodos y enlaces relevantes
            nodesFiltered = nodes.filter(node => {
                if (node.level === 1) return epocasRelacionadas.has(node.id);
                if (node.level === 2) return origenesRelacionados.has(node.id);
                if (node.level === 3) return platillosConIngrediente.has(node.id);
                return false;
            });
            
            // Combinar los enlaces relevantes
            linksFiltered = [...enlacesEpocaOrigen, ...enlacesOrigenPlatillo];
            
            // Ajustar opacidad en los enlaces filtrados
            linksFiltered.forEach(link => {
                link.isRelevant = true;
                link.opacity = 0.6; // Opacidad 60% para todos los enlaces
            });
            
            console.log(`Filtrado completado: ${nodesFiltered.length} nodos y ${linksFiltered.length} enlaces relevantes`);
            
            // Si no hay suficientes elementos para mostrar, usar enfoque visual (mostrando todo pero con opacidad)
            if (nodesFiltered.length < 5 || linksFiltered.length < 4) {
                console.log('Muy pocos elementos para mostrar, usando filtrado visual');
                
                // Mostrar todos los nodos pero con opacidad diferencial
                nodesFiltered = [...nodes];
                linksFiltered = [...links];
                
                // Marcar enlaces como relevantes o no
                linksFiltered.forEach(link => {
                    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                    
                    if (link.type === 'epoca-origen') {
                        // Enlace entre época y origen
                        link.isRelevant = epocasRelacionadas.has(sourceId) && origenesRelacionados.has(targetId);
                    } else if (link.type === 'origen-platillo') {
                        // Enlace entre origen y platillo
                        link.isRelevant = origenesRelacionados.has(sourceId) && platillosConIngrediente.has(targetId);
                    } else {
                        link.isRelevant = false;
                    }
                    
                    // Opacidad del 60% para todas las líneas
                    link.opacity = 0.6;
                });
            }
        }
        
        // Función para actualizar la visualización
        function actualizarVisualizacion(recentrar = true) {
            // Mover el grafo mucho más a la izquierda para alinearlo correctamente y dar espacio a las leyendas
            // Usamos un valor fijo para asegurar consistencia
            svg.attr('transform', `translate(${Math.floor(width / 2) - 90}, ${Math.floor(height / 2)})`);
            
            // Eliminar anillo de categorías y leyenda si existen para evitar superposiciones
            svg.selectAll('.type-ring, .category-legend').remove();
            
            // Mostrar información sobre el filtro actual
            let infoText = '';
            if (ingredienteActivo) {
                // Contar platillos que tienen este ingrediente
                const platillosCount = nodesFiltered.filter(n => 
                    n.level === 3 && 
                    n.isRelevant
                ).length;
                
                // Crear texto informativo
                infoText = `Visualizando ${platillosCount} platillos con ${ingredienteActivo.toLowerCase()}`;
            }
            
            // Actualizar o crear elemento de información
            let infoElement = d3.select('#filter-info');
            if (infoElement.empty()) {
                infoElement = d3.select('#network')
                    .append('div')
                    .attr('id', 'filter-info')
                    .style('position', 'absolute')
                    .style('top', '15px')
                    .style('left', '15px')
                    .style('background-color', 'rgba(255,255,255,0.5)')
                    .style('padding', '8px 15px')
                    .style('margin-bottom', '10px')
                    .style('border-radius', '20px')
                    .style('font-family', 'Cardo, serif')
                    .style('font-size', '14px')
                    .style('color', '#073B4C')
                    .style('font-weight', 'bold')
                    .style('text-align', 'left')
                    .style('box-shadow', '0 1px 4px rgba(0,0,0,0.1)')
                    .style('z-index', '100')
                    .style('transition', 'opacity 0.3s ease');
            }
            
            // Actualizar texto con transición
            infoElement
                .text(infoText)
                .style('opacity', infoText ? 1 : 0);
                
            // Añadir o actualizar instrucciones de zoom debajo del texto informativo
            let zoomInstructions = d3.select('#zoom-instructions');
            if (zoomInstructions.empty()) {
                zoomInstructions = d3.select('#network')
                    .append('div')
                    .attr('id', 'zoom-instructions')
                    .style('position', 'absolute')
                    .style('top', '55px')  // Posición debajo del texto informativo con más espacio
                    .style('left', '15px')
                    .style('font-family', 'Cardo, serif')
                    .style('font-size', '11px')
                    .style('color', '#666')
                    .style('padding', '4px 0')
                    .style('text-align', 'left')
                    .style('z-index', '100')
                    .text('Usa la rueda del ratón para zoom • Arrastra para mover');
            }
            
            // Limpiar visualizaciones previas
            linkGroup.selectAll('*').remove();
            nodeGroup.selectAll('*').remove();
            labelGroup.selectAll('*').remove();
            
            // Detener simulación anterior si existe
            if (simulation) simulation.stop();
            
            // Crear enlaces con estilo mejorado
            linkElements = linkGroup.selectAll('line')
                .data(linksFiltered)
                .enter()
                .append('line')
                .attr('stroke', d => {
                    // Color según el tipo de enlace
                    if (d.type === 'epoca-origen') return colorPalette.link1;
                    if (d.type === 'origen-platillo') return colorPalette.link2;
                    return '#aaa';
                })
                .attr('opacity', d => {
                    // Opacidad según relevancia
                    if (ingredienteActivo) {
                        return 0.6; // Opacidad 60% para todas las líneas
                    }
                    return 0.4; // Opacidad por defecto
                })
                .attr('stroke-width', d => {
                    // Grosor según valor y relevancia
                    const baseWidth = Math.max(1, Math.sqrt(d.value || 1) * 0.7);
                    if (ingredienteActivo && d.isRelevant) {
                        return baseWidth + 0.5;
                    }
                    return baseWidth;
                });
            
            // Mapeo de épocas a imágenes
            const epocaImageMap = {
                'México Prehispánico (Antes de 1521)': 'img/Xolin/Xolin_Aperitivo.png',
                'Conquista y Virreinato (1521 – 1821)': 'img/Xolin/Xolin_Primer_Plato.png',
                'Influencia europea / Porfiriato (1821 - 1910)': 'img/Xolin/Xolin_Entremes.png',
                'Revolución Mexicana (1910 - 1940)': 'img/Xolin/Xolin_Segundo_Plato.png',
                'México Contemporáneo (1940 - Actualidad)': 'img/Xolin/Xolin_Postre.png',
            };
            
            // Crear nodos - grupos para poder añadir círculos o imágenes según el tipo de nodo
            nodeElements = nodeGroup.selectAll('.node')
                .data(nodesFiltered)
                .enter()
                .append('g')
                .attr('class', 'node')
                .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended));
            
            // Añadir círculos para nodos que no son épocas (nivel 2 y 3)
            nodeElements.filter(d => d.level !== 1)
                .append('circle')
                .attr('r', getNodeRadius)
                .attr('fill', getNodeColor)
                .attr('stroke', '#fff')
                .attr('stroke-width', 1)
                .attr('opacity', d => {
                    // Opacidad según nivel y relevancia
                    if (d.level === 2) {
                        // Nodos de origen (nivel 2) siempre con 50% de opacidad
                        return 0.5;
                    } else if (ingredienteActivo) {
                        // Nivel 3 (platillos) con opacidad según relevancia
                        return d.isRelevant ? 1 : 0.2;
                    }
                    // Nivel 3 (platillos) sin filtro de ingrediente
                    return 0.85;
                });
                
            // Crear definiciones para patrones de imagen
            const defs = svg.append('defs');
                
            // Añadir imágenes para nodos de épocas (nivel 1)
            nodeElements.filter(d => d.level === 1)
                .each(function(d) {
                    const node = d3.select(this);
                    const radius = getNodeRadius(d);
                    const imageUrl = epocaImageMap[d.name] || 'img/Xolin/Xolin_Aperitivo.png';
                    
                    // Generar ID único para este patrón
                    const patternId = `pattern-${d.id.replace(/\s+/g, '-').replace(/[()]/g, '').replace(/[\/]/g, '-')}`;
                    
                    // Crear patrón con ID único
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
                    node.append('circle')
                        .attr('r', radius + 2)
                        .attr('fill', colorPalette.epoca)
                        .attr('opacity', 0.3);
                    
                    // Añadir círculo con la imagen
                    node.append('circle')
                        .attr('r', radius)
                        .attr('fill', `url(#${patternId})`)
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 1.5)
                        .attr('opacity', d => {
                            if (ingredienteActivo) {
                                return d.isRelevant ? 1 : 0.3;
                            }
                            return 0.9;
                        });
                });
            
            // Eliminamos etiquetas de orígenes cambiando el filtro para que no incluya ningún nodo
            labelElements = labelGroup.selectAll('text')
                .data(nodesFiltered.filter(d => false)) // No mostrar ninguna etiqueta
                .enter()
                .append('text')
                .style('fill', d => d.level === 2 ? '#662200' : '#333')
                .style('font-family', 'Cardo, serif')
                .style('font-size', d => d.level === 2 ? '9px' : '7px')
                .style('font-weight', d => d.level === 2 ? 'bold' : 'normal')
                .style('pointer-events', 'none')
                .style('text-anchor', 'middle')
                .style('paint-order', 'stroke')
                .style('stroke', 'white')
                .style('stroke-width', '2px')
                .text(d => {
                    // Truncar texto demasiado largo para evitar sobrecarga visual
                    const maxLength = d.level === 2 ? 20 : 15;
                    return d.name.length > maxLength ? d.name.substring(0, maxLength) + '...' : d.name;
                })
                .attr('opacity', d => {
                    // Solo mostrar etiquetas para orígenes (nivel 2)
                    return d.level === 2 ? 0.9 : 0;
                });
            
            // Crear nueva simulación con nodos filtrados
            simulation = d3.forceSimulation(nodesFiltered)
                .force('link', d3.forceLink(linksFiltered).id(d => d.id).distance(d => {
                    // Distancias basadas en niveles
                    const sourceLevel = typeof d.source === 'object' ? d.source.level : 1;
                    const targetLevel = typeof d.target === 'object' ? d.target.level : 3;
                    
                    if (sourceLevel === 1 && targetLevel === 2) return radiusLevel2 - radiusLevel1; // Entre épocas y orígenes
                    if (sourceLevel === 2 && targetLevel === 3) return radiusLevel3 - radiusLevel2; // Entre orígenes y platillos
                    return 30; // Dentro del mismo nivel
                }))
                .force('charge', d3.forceManyBody().strength(d => {
                    // Fuerza repulsiva según nivel y relevancia
                    if (d.level === 1) return -50;
                    if (d.level === 2) return -30;
                    return d.isRelevant ? -20 : -10;
                }))
                .force('x', d3.forceX().strength(0.05)) // Fuerza centralizadora suave
                .force('y', d3.forceY().strength(0.05)) // Fuerza centralizadora suave
                .force('collide', d3.forceCollide().radius(d => getNodeRadius(d) + 2).strength(0.8))
                .force('radial', d3.forceRadial(d => {
                    // Radio según nivel
                    if (d.level === 1) return radiusLevel1;
                    if (d.level === 2) return radiusLevel2;
                    return radiusLevel3;
                }).strength(1)) // Fuerza radial fuerte para estructura circular
                .alphaDecay(0.08) // Velocidad de convergencia moderada
                .velocityDecay(0.35); // Amortiguación de movimiento
                
            // Actualizar en cada tick
            simulation.on('tick', () => {
                linkElements
                    .attr('x1', d => isFinite(d.source.x) ? d.source.x : 0)
                    .attr('y1', d => isFinite(d.source.y) ? d.source.y : 0)
                    .attr('x2', d => isFinite(d.target.x) ? d.target.x : 0)
                    .attr('y2', d => isFinite(d.target.y) ? d.target.y : 0);
                    
                // Actualizar posición de los nodos
                nodeElements
                    .attr('transform', d => `translate(${isFinite(d.x) ? d.x : 0}, ${isFinite(d.y) ? d.y : 0})`);
                    
                // Actualizar posición de las etiquetas
                labelElements
                    .attr('x', d => isFinite(d.x) ? d.x : 0)
                    .attr('y', d => {
                        const radius = getNodeRadius(d);
                        return isFinite(d.y) ? d.y + radius + 8 : 0;
                    });
            });
            
            // Crear el anillo de categorías (nivel 4) si existe la función
            if (window.createCategoryRing) {
                // Primero eliminar cualquier anillo previo para evitar superposiciones
                svg.select('.type-ring').remove();
                svg.select('.category-legend').remove();
                
                // Luego crear el nuevo anillo
                window.createCategoryRing(
                    svg, 
                    nodesFiltered, 
                    linksFiltered, 
                    radiusLevel3, 
                    radiusLevel4, 
                    width, 
                    height, 
                    ingredienteActivo,
                    false // No hay nodos seleccionados, hover activado
                );
            }
            
            // Configurar eventos interactivos
            configurarEventosInteractivos();
            
            // Asegurar que el SVG sea visible
            svg.style('opacity', 1);
            
            // Aplicar zoom y centrado si es necesario
            if (recentrar) {
                setTimeout(() => {
                    // No modificamos el desplazamiento aquí, ya que está incorporado en la función de zoom
                    zoomContainer.transition().duration(400)
                        .call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1.2));
                }, 200);
            }
        }
        
        // Configurar eventos de interacción
        function configurarEventosInteractivos() {
            // Array para seguir los nodos seleccionados
            let selectedNodes = [];
            
            // Grupo para las etiquetas permanentes de nodos seleccionados
            const permanentLabelGroup = svg.append('g')
                .attr('class', 'permanent-labels')
                .attr('pointer-events', 'none');
            
            // Función para mostrar tooltip
            function showTooltip(event, d) {
                // Construir contenido del tooltip
                let tooltipContent = `<div style="text-align: center;"><strong style="color:${getNodeColor(d)}; font-size:15px">${d.name}</strong></div>`;
                
                // Añadir separador
                tooltipContent += `<div style="height: 1px; background-color: #eee; margin: 8px 0;"></div>`;
                
                // Información específica según tipo de nodo
                if (d.level === 1) {
                    // Información para época
                    const origenesCount = linksFiltered.filter(l => 
                        (typeof l.source === 'object' ? l.source.id : l.source) === d.id
                    ).length;
                    
                    tooltipContent += `<div><strong>Época histórica</strong></div>`;
                    tooltipContent += `<div>Conectado a ${origenesCount} orígenes culinarios</div>`;
                } else if (d.level === 2) {
                    // Información para origen
                    const platillosCount = linksFiltered.filter(l => 
                        l.type === 'origen-platillo' && 
                        (typeof l.source === 'object' ? l.source.id : l.source) === d.id
                    ).length;
                    
                    tooltipContent += `<div><strong>Origen culinario</strong></div>`;
                    tooltipContent += `<div>Conectado a ${platillosCount} platillos</div>`;
                    
                    // Buscar la época relacionada
                    const epocaLink = linksFiltered.find(l => 
                        l.type === 'epoca-origen' && 
                        (typeof l.target === 'object' ? l.target.id : l.target) === d.id
                    );
                    
                    if (epocaLink) {
                        const epocaId = typeof epocaLink.source === 'object' ? epocaLink.source.id : epocaLink.source;
                        const epoca = nodes.find(n => n.id === epocaId);
                        if (epoca) {
                            tooltipContent += `<div>Época: ${epoca.name}</div>`;
                        }
                    }
                } else if (d.level === 3) {
                    // Información para platillo
                    tooltipContent += `<div><strong>Platillo</strong></div>`;
                    tooltipContent += `<div>Origen: ${d.origen}</div>`;
                    tooltipContent += `<div>Época: ${d.epoca}</div>`;
                    
                    // Mostrar ingredientes principales si existen
                    if (d.ingredientes && d.ingredientes.length > 0) {
                        // Filtrar ingredientes principales
                        const ingredientesPrincipales = INGREDIENTES_PRINCIPALES.filter(
                            ing => d.ingredientes.some(i => i && i.includes(ing))
                        );
                        
                        if (ingredientesPrincipales.length > 0) {
                            tooltipContent += `<div style="margin-top: 8px;"><strong>Ingredientes principales:</strong></div>`;
                            tooltipContent += `<div>${ingredientesPrincipales.join(', ').toLowerCase()}</div>`;
                        }
                    }
                }
                
                // Mostrar tooltip con transición suave
                tooltip
                    .html(tooltipContent)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px')
                    .transition()
                    .duration(200)
                    .style('opacity', 1);
            }
            
            nodeElements.on('mouseover', function(event, d) {
                // Determinar si este nodo está entre los seleccionados
                const isNodeSelected = selectedNodes.some(node => node.id === d.id);
                
                // Resaltar categorías relacionadas con este nodo si es un platillo (nivel 3)
                if (d.level === 3 && window.highlightCategoriesForNode) {
                    window.highlightCategoriesForNode(d.id);
                }
                
                // Si hay nodos seleccionados
                if (selectedNodes.length > 0) {
                    // Solo mostrar tooltip y no modificar el resaltado
                    showTooltip(event, d);
                    
                    // Si este nodo está entre los seleccionados, podemos destacarlo un poco más 
                    if (isNodeSelected) {
                        if (d.level !== 1) {
                            d3.select(this).select('circle')
                                .attr('stroke-width', 3.5);
                        } else {
                            d3.select(this).select('circle[fill^="url(#pattern"]')
                                .attr('stroke-width', 3.5);
                        }
                    }
                    
                    return;
                }
                
                // Comportamiento normal de hover cuando no hay seleccionados
                // Aplicar efecto de hover a este nodo
                if (d.level !== 1) {
                    d3.select(this).select('circle')
                        .attr('stroke', getNodeColor(d))
                        .attr('stroke-width', 2);
                } else {
                    d3.select(this).select('circle[fill^="url(#pattern"]')
                        .attr('stroke', '#B8860B')
                        .attr('stroke-width', 2.5);
                    
                    d3.select(this).select('circle[fill="' + colorPalette.epoca + '"]')
                        .attr('opacity', 0.6);
                }
                
                // Mostrar enlaces conectados con mayor opacidad
                linkElements.attr('opacity', l => {
                    if (l.source.id === d.id || l.target.id === d.id) {
                        return 0.8; // Mayor opacidad para enlaces conectados
                    } else {
                        return 0.1; // Baja opacidad para enlaces no relacionados
                    }
                });
                
                // Resaltar nodos conectados con lógica especial para épocas
                nodeElements.each(function(n) {
                    const nodeGroup = d3.select(this);
                    
                    // Verificar conexión directa
                    const isDirectlyConnected = linksFiltered.some(l => 
                        (l.source.id === d.id && l.target.id === n.id) || 
                        (l.target.id === d.id && l.source.id === n.id)
                    );
                    
                    // Para épocas (nivel 1), también resaltar los platillos (nivel 3) relacionados
                    // a través de los orígenes conectados a esta época
                    let isIndirectlyConnected = false;
                    if (d.level === 1 && n.level === 3) {
                        // Encuentra orígenes conectados a esta época
                        const origenesConectados = linksFiltered
                            .filter(l => l.source.id === d.id && l.type === 'epoca-origen')
                            .map(l => l.target.id);
                            
                        // Verifica si este platillo está conectado a alguno de esos orígenes
                        isIndirectlyConnected = linksFiltered.some(l => 
                            l.type === 'origen-platillo' && 
                            origenesConectados.includes(l.source.id) && 
                            l.target.id === n.id
                        );
                    }
                    
                    // Aplicar opacidad según conexión y nivel
                    let opacity;
                    if (n === d || isDirectlyConnected || isIndirectlyConnected) {
                        // Nodos conectados o el propio nodo: alta opacidad
                        opacity = 1;
                    } else if (n.level === 2) {
                        // Nodos de origen no conectados: mantener 25% de opacidad para mejorar contraste
                        opacity = 0.25;
                    } else {
                        // Resto de nodos no conectados: muy baja opacidad
                        opacity = 0.15;
                    }
                    nodeGroup.selectAll('circle').attr('opacity', opacity);
                });
                
                // Mostrar etiquetas para nodos conectados
                labelElements
                    .style('font-size', n => {
                        // Aumentar tamaño de la etiqueta del nodo actual
                        if (n.id === d.id) return '11px';
                        // Verificar si este nodo está conectado al nodo actual
                        const isConnected = linksFiltered.some(l => 
                            (l.source.id === d.id && l.target.id === n.id) || 
                            (l.target.id === d.id && l.source.id === n.id)
                        );
                        return isConnected ? '10px' : '9px';
                    })
                    .attr('opacity', n => {
                        // Verificar si este nodo está conectado al nodo actual
                        const isConnected = linksFiltered.some(l => 
                            (l.source.id === d.id && l.target.id === n.id) || 
                            (l.target.id === d.id && l.source.id === n.id)
                        );
                        
                        if (n.id === d.id) return 1; // Nodo actual visible
                        if (isConnected) return 0.9; // Nodos conectados visibles
                        return 0.1; // Resto muy transparentes
                    });
                
                // Mostrar tooltip
                showTooltip(event, d);
            })
            .on('mouseout', function(event, d) {
                // Si hay nodos seleccionados, solo ocultar tooltip pero mantener resaltado
                if (selectedNodes.length > 0) {
                    // Ocultar tooltip
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 0);
                    return;
                }
                
                // Restaurar estilo normal para este nodo
                if (d.level !== 1) {
                    d3.select(this).select('circle')
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 1);
                } else {
                    d3.select(this).select('circle[fill^="url(#pattern"]')
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 1.5);
                    
                    d3.select(this).select('circle[fill="' + colorPalette.epoca + '"]')
                        .attr('opacity', 0.3);
                }
                    
                // Restaurar opacidad original de enlaces
                linkElements.attr('opacity', d => {
                    if (ingredienteActivo) {
                        return 0.6; // Opacidad 60% para todas las líneas
                    }
                    return 0.4;
                });
                
                // Restaurar opacidad original de nodos, respetando los seleccionados
                nodeElements.each(function(n) {
                    const nodeGroup = d3.select(this);
                    const isSelected = selectedNodes.some(node => node.id === n.id);
                    
                    // Si el nodo está seleccionado, mantener opacidad alta
                    if (isSelected) {
                        nodeGroup.selectAll('circle').attr('opacity', 1);
                        return; // Terminar esta ejecución de la función callback
                    }
                    
                    if (n.level === 1) {
                        // Para nodos de nivel 1 (épocas)
                        nodeGroup.selectAll('circle').each(function() {
                            const circle = d3.select(this);
                            const isBackground = circle.attr('fill') === colorPalette.epoca;
                            const isPattern = circle.attr('fill') && circle.attr('fill').startsWith('url(#pattern');
                            
                            if (isBackground) {
                                circle.attr('opacity', 0.3);
                            } else if (isPattern) {
                                circle.attr('opacity', ingredienteActivo ? (n.isRelevant ? 1 : 0.3) : 0.9);
                            }
                        });
                    } else {
                        // Opacidad para nodos nivel 2 (orígenes) y nivel 3 (platillos)
                        let opacity;
                        if (n.level === 2) {
                            // Nodos de origen siempre con 50% de opacidad en estado normal
                            opacity = 0.5;
                        } else {
                            // Resto de nodos (nivel 3 - platillos) con opacidad normal
                            opacity = ingredienteActivo ? (n.isRelevant ? 1 : 0.2) : 0.85;
                        }
                        nodeGroup.selectAll('circle').attr('opacity', opacity);
                    }
                });
                
                // Restaurar estado original de etiquetas
                labelElements
                    .style('font-size', '9px')
                    .attr('opacity', d => {
                        // Solo mostrar etiquetas para orígenes (nivel 2)
                        return d.level === 2 ? 0.9 : 0;
                    });
                
                // Ocultar tooltip
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0);
                    
                // Restaurar resaltado de categorías si aplica
                if (window.resetCategoryHighlights) {
                    window.resetCategoryHighlights();
                }
            })
            .on('click', function(event, d) {
                // Función para aplicar resaltado a un nodo y sus conexiones
                function highlightNode(node) {
                    // Resaltar el nodo seleccionado
                    if (node.level !== 1) {
                        d3.select(this).select('circle')
                            .attr('stroke', getNodeColor(node))
                            .attr('stroke-width', 3);
                    } else {
                        d3.select(this).select('circle[fill^="url(#pattern"]')
                            .attr('stroke', '#B8860B')
                            .attr('stroke-width', 3);
                        
                        d3.select(this).select('circle[fill="' + colorPalette.epoca + '"]')
                            .attr('opacity', 0.6);
                    }
                    
                    // Mostrar enlaces conectados con mayor opacidad
                    linkElements.attr('opacity', l => {
                        if (l.source.id === node.id || l.target.id === node.id) {
                            return 0.8; // Mayor opacidad para enlaces conectados
                        } else {
                            return 0.1; // Baja opacidad para enlaces no relacionados
                        }
                    });
                    
                    // Resaltar nodos conectados
                    nodeElements.each(function(n) {
                        const nodeGroup = d3.select(this);
                        
                        // Verificar conexión directa
                        const isDirectlyConnected = linksFiltered.some(l => 
                            (l.source.id === node.id && l.target.id === n.id) || 
                            (l.target.id === node.id && l.source.id === n.id)
                        );
                        
                        // Para épocas (nivel 1), también resaltar los platillos (nivel 3) relacionados
                        let isIndirectlyConnected = false;
                        if (node.level === 1 && n.level === 3) {
                            // Encuentra orígenes conectados a esta época
                            const origenesConectados = linksFiltered
                                .filter(l => l.source.id === node.id && l.type === 'epoca-origen')
                                .map(l => l.target.id);
                                
                            // Verifica si este platillo está conectado a alguno de esos orígenes
                            isIndirectlyConnected = linksFiltered.some(l => 
                                l.type === 'origen-platillo' && 
                                origenesConectados.includes(l.source.id) && 
                                l.target.id === n.id
                            );
                        }
                        
                        // Aplicar opacidad según conexión y nivel
                        let opacity;
                        if (n === node || isDirectlyConnected || isIndirectlyConnected) {
                            // Nodos conectados o el propio nodo: alta opacidad
                            opacity = 1;
                        } else if (n.level === 2) {
                            // Nodos de origen no conectados: mantener 25% de opacidad para mejorar contraste
                            opacity = 0.25;
                        } else {
                            // Resto de nodos no conectados: muy baja opacidad
                            opacity = 0.15;
                        }
                        nodeGroup.selectAll('circle').attr('opacity', opacity);
                    });
                    
                    // No mostrar etiquetas permanentemente, solo en hover
                    // Las etiquetas se mostrarán solo durante el evento mouseover
                }
                
                // Función para restaurar el estado normal (sin resaltado)
                function resetHighlighting() {
                    // Restaurar opacidad original de enlaces
                    linkElements.attr('opacity', d => {
                        if (ingredienteActivo) {
                            return 0.6; // Opacidad 60% para todas las líneas
                        }
                        return 0.4;
                    });
                    
                    // Restaurar opacidad original de nodos, respetando los seleccionados
                    nodeElements.each(function(n) {
                        const nodeGroup = d3.select(this);
                        const isSelected = selectedNodes.some(node => node.id === n.id);
                        
                        // Si el nodo está seleccionado, mantener opacidad alta y resaltado
                        if (isSelected) {
                            nodeGroup.selectAll('circle').attr('opacity', 1);
                            
                            // También mantener el estilo visual de selección
                            if (n.level !== 1) {
                                nodeGroup.select('circle')
                                    .attr('stroke', getNodeColor(n))
                                    .attr('stroke-width', 3);
                            } else {
                                nodeGroup.select('circle[fill^="url(#pattern"]')
                                    .attr('stroke', '#B8860B')
                                    .attr('stroke-width', 3);
                            }
                            return; // Pasar al siguiente nodo
                        }
                        
                        if (n.level === 1) {
                            // Para nodos de nivel 1 (épocas)
                            nodeGroup.selectAll('circle').each(function() {
                                const circle = d3.select(this);
                                const isBackground = circle.attr('fill') === colorPalette.epoca;
                                const isPattern = circle.attr('fill') && circle.attr('fill').startsWith('url(#pattern');
                                
                                if (isBackground) {
                                    circle.attr('opacity', 0.3);
                                } else if (isPattern) {
                                    circle.attr('opacity', ingredienteActivo ? (n.isRelevant ? 1 : 0.3) : 0.9);
                                }
                            });
                        } else if (n.level === 2) {
                            // Para nodos de nivel 2 (orígenes) - siempre 50% de opacidad
                            nodeGroup.selectAll('circle').attr('opacity', 0.5);
                        } else {
                            // Para nodos de nivel 3 (platillos)
                            const opacity = ingredienteActivo ? (n.isRelevant ? 1 : 0.2) : 0.85;
                            nodeGroup.selectAll('circle').attr('opacity', opacity);
                        }
                        
                        // Restaurar estilo normal para todos los nodos
                        if (n.level !== 1) {
                            nodeGroup.select('circle')
                                .attr('stroke', '#fff')
                                .attr('stroke-width', 1);
                        } else {
                            nodeGroup.select('circle[fill^="url(#pattern"]')
                                .attr('stroke', '#fff')
                                .attr('stroke-width', 1.5);
                        }
                    });
                    
                    // Restaurar estado original de etiquetas
                    labelElements
                        .style('font-size', '9px')
                        .attr('opacity', d => {
                            // Solo mostrar etiquetas para orígenes (nivel 2)
                            return d.level === 2 ? 0.9 : 0;
                        });
                    
                    // Eliminar todas las etiquetas permanentes si no hay nodos seleccionados
                    if (selectedNodes.length === 0) {
                        permanentLabelGroup.selectAll('text').remove();
                    }
                }
                
                // Función para recalcular el anillo de categorías cuando se selecciona un origen
                function recalculateCategoryRingForOrigin(originNode) {
                    // Verificar que sea un nodo de nivel 2 (origen)
                    if (originNode.level !== 2) return;
                    
                    console.log(`Recalculando anillo para origen: ${originNode.name}`);
                    
                    // 1. Identificar los platillos conectados a este origen
                    const platillosDelOrigen = new Set();
                    
                    linksFiltered.forEach(link => {
                        if (link.type === 'origen-platillo' && link.source.id === originNode.id) {
                            platillosDelOrigen.add(link.target.id);
                        }
                    });
                    
                    // 2. Filtrar nodos para incluir solo el origen seleccionado y sus platillos
                    const nodosParaAnillo = nodes.filter(node => {
                        if (node.id === originNode.id) return true; // El origen seleccionado
                        if (node.level === 3 && platillosDelOrigen.has(node.id)) return true; // Platillos conectados
                        return false;
                    });
                    
                    // 3. Filtrar enlaces relacionados con estos nodos
                    const enlacesParaAnillo = links.filter(link => {
                        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                        
                        return (sourceId === originNode.id && platillosDelOrigen.has(targetId));
                    });
                    
                    // 4. Volver a crear el anillo de categorías con los datos filtrados
                    if (window.createCategoryRing) {
                        console.log(`Regenerando anillo para ${platillosDelOrigen.size} platillos del origen "${originNode.name}"`);
                        
                        // Primero eliminar cualquier anillo previo para evitar superposiciones
                        svg.select('.type-ring').remove();
                        svg.select('.category-legend').remove();
                        
                        // Luego crear el nuevo anillo filtrado - con hover desactivado ya que hay nodos seleccionados
                        window.createCategoryRing(
                            svg, 
                            nodosParaAnillo, 
                            enlacesParaAnillo, 
                            radiusLevel3, 
                            radiusLevel4, 
                            width, 
                            height, 
                            ingredienteActivo,
                            true // Deshabilitar hover cuando hay nodos seleccionados
                        );
                    }
                }
                
                // Nueva función para recalcular el anillo cuando se seleccionan múltiples orígenes
                function recalculateCategoryRingForMultipleOrigins(originNodes) {
                    // Verificar que tengamos orígenes para procesar
                    if (!originNodes || originNodes.length === 0) return;
                    
                    console.log(`Recalculando anillo para ${originNodes.length} orígenes seleccionados`);
                    
                    // 1. Identificar todos los platillos conectados a cualquiera de los orígenes seleccionados
                    const platillosDeOrigenes = new Set();
                    const origenesIds = originNodes.map(n => n.id);
                    
                    // Recopilar todos los IDs de platillos conectados a cualquiera de los orígenes
                    linksFiltered.forEach(link => {
                        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                        
                        if (link.type === 'origen-platillo' && origenesIds.includes(sourceId)) {
                            platillosDeOrigenes.add(targetId);
                        }
                    });
                    
                    // 2. Filtrar nodos para incluir los orígenes seleccionados y sus platillos
                    const nodosParaAnillo = nodes.filter(node => {
                        if (origenesIds.includes(node.id)) return true; // Los orígenes seleccionados
                        if (node.level === 3 && platillosDeOrigenes.has(node.id)) return true; // Platillos conectados
                        return false;
                    });
                    
                    // 3. Filtrar enlaces relacionados con estos nodos
                    const enlacesParaAnillo = links.filter(link => {
                        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                        
                        return (origenesIds.includes(sourceId) && platillosDeOrigenes.has(targetId));
                    });
                    
                    // 4. Volver a crear el anillo de categorías con los datos filtrados
                    if (window.createCategoryRing) {
                        console.log(`Regenerando anillo para ${platillosDeOrigenes.size} platillos de ${originNodes.length} orígenes seleccionados`);
                        
                        // Primero eliminar cualquier anillo previo para evitar superposiciones
                        svg.select('.type-ring').remove();
                        svg.select('.category-legend').remove();
                        
                        // Luego crear el nuevo anillo filtrado - con hover desactivado ya que hay nodos seleccionados
                        window.createCategoryRing(
                            svg, 
                            nodosParaAnillo, 
                            enlacesParaAnillo, 
                            radiusLevel3, 
                            radiusLevel4, 
                            width, 
                            height, 
                            ingredienteActivo,
                            true // Deshabilitar hover cuando hay nodos seleccionados
                        );
                    }
                }
                
                // Lógica principal del click con selección múltiple
                // Verificar si el nodo ya está seleccionado
                const nodeIndex = selectedNodes.findIndex(node => node.id === d.id);
                
                // Función para actualizar las etiquetas permanentes
                function updatePermanentLabels() {
                    // Eliminar etiquetas existentes
                    permanentLabelGroup.selectAll('text').remove();
                    
                    // Si no hay nodos seleccionados, no hacer nada más
                    if (selectedNodes.length === 0) return;
                    
                    // Crear etiquetas para todos los nodos seleccionados
                    permanentLabelGroup.selectAll('text')
                        .data(selectedNodes)
                        .enter()
                        .append('text')
                        .attr('x', d => isFinite(d.x) ? d.x : 0)
                        .attr('y', d => {
                            const radius = getNodeRadius(d);
                            return isFinite(d.y) ? d.y - radius - 5 : 0;
                        })
                        .attr('text-anchor', 'middle')
                        .style('font-family', 'Cardo, serif')
                        .style('font-size', '10px')
                        .style('font-weight', 'bold')
                        .style('fill', '#333')
                        .style('paint-order', 'stroke')
                        .style('stroke', 'white')
                        .style('stroke-width', '2px')
                        .style('pointer-events', 'none')
                        .text(d => {
                            // Truncar texto demasiado largo
                            const maxLength = 20;
                            return d.name.length > maxLength 
                                ? d.name.substring(0, maxLength) + '...' 
                                : d.name;
                        });
                    
                    // Modificar el handler de tick para actualizar las etiquetas
                    const originalTick = simulation.on('tick');
                    
                    simulation.on('tick', () => {
                        // Ejecutar el tick original primero
                        if (typeof originalTick === 'function') {
                            originalTick();
                        }
                        
                        // Luego actualizar las etiquetas permanentes si hay nodos seleccionados
                        if (selectedNodes.length > 0) {
                            permanentLabelGroup.selectAll('text')
                                .attr('x', d => isFinite(d.x) ? d.x : 0)
                                .attr('y', d => {
                                    const radius = getNodeRadius(d);
                                    return isFinite(d.y) ? d.y - radius - 5 : 0;
                                });
                        }
                    });
                }
                
                // Agregamos la actualización de etiquetas a la función de tick existente
                // No creamos un nuevo tick handler
                
                // Todos los nodos se manejan de la misma manera para permitir selección múltiple
                if (nodeIndex !== -1) {
                    // Si el nodo ya está seleccionado, lo quitamos de la selección
                    selectedNodes.splice(nodeIndex, 1);
                    
                    // Restaurar la visualización normal sin resaltar este nodo
                    resetHighlighting();
                    
                    // Si aún quedan otros nodos seleccionados, resaltarlos
                    if (selectedNodes.length > 0) {
                        applyMultipleHighlighting(selectedNodes);
                        
                        // Si quedan nodos de origen seleccionados, regenerar el anillo
                        // para mostrar todos los platillos relacionados con los orígenes seleccionados
                        const selectedOrigins = selectedNodes.filter(n => n.level === 2);
                        if (selectedOrigins.length > 0) {
                            recalculateCategoryRingForMultipleOrigins(selectedOrigins);
                        }
                    } else {
                        // Regenerar el anillo principal si no hay nodos seleccionados - con hover activado
                        if (window.createCategoryRing) {
                            svg.select('.type-ring').remove();
                            svg.select('.category-legend').remove();
                            
                            window.createCategoryRing(
                                svg, 
                                nodesFiltered, 
                                linksFiltered, 
                                radiusLevel3, 
                                radiusLevel4, 
                                width, 
                                height, 
                                ingredienteActivo,
                                false // No hay nodos seleccionados, hover activado
                            );
                        }
                    }
                } else {
                    // Si es un nuevo nodo, lo añadimos a la selección
                    selectedNodes.push(d);
                    
                    // Resetear y aplicar nuevo resaltado
                    resetHighlighting();
                    applyMultipleHighlighting(selectedNodes);
                    
                    // Si es un nodo de origen, recalcular el anillo
                    if (d.level === 2) {
                        const selectedOrigins = selectedNodes.filter(n => n.level === 2);
                        recalculateCategoryRingForMultipleOrigins(selectedOrigins);
                    }
                }
                
                // Actualizar etiquetas permanentes
                updatePermanentLabels();
                
                // Función para aplicar resaltado a múltiples nodos
                function applyMultipleHighlighting(nodes) {
                    // Crear un mapa para almacenar qué nodos y enlaces deben resaltarse
                    const connectedNodes = new Set();
                    const connectedLinks = new Set();
                    
                    // Para cada nodo seleccionado, encontrar sus conexiones
                    nodes.forEach(node => {
                        // Añadir el nodo a los conectados
                        connectedNodes.add(node.id);
                        
                        // Encontrar y marcar nodos conectados directamente
                        linksFiltered.forEach(link => {
                            if (link.source.id === node.id) {
                                connectedNodes.add(link.target.id);
                                connectedLinks.add(link.index);
                            } else if (link.target.id === node.id) {
                                connectedNodes.add(link.source.id);
                                connectedLinks.add(link.index);
                            }
                        });
                        
                        // Para épocas (nivel 1), también resaltar los platillos (nivel 3) relacionados
                        if (node.level === 1) {
                            // Encuentra orígenes conectados a esta época
                            const origenesConectados = linksFiltered
                                .filter(l => l.source.id === node.id && l.type === 'epoca-origen')
                                .map(l => l.target.id);
                                
                            // Añadir los orígenes
                            origenesConectados.forEach(id => connectedNodes.add(id));
                            
                            // Encontrar platillos conectados a estos orígenes
                            linksFiltered.forEach(link => {
                                if (link.type === 'origen-platillo' && 
                                    origenesConectados.includes(link.source.id)) {
                                    connectedNodes.add(link.target.id);
                                    connectedLinks.add(link.index);
                                }
                            });
                        }
                        
                        // Para orígenes (nivel 2), asegurar que resaltamos todos sus platillos
                        if (node.level === 2) {
                            // Encontrar todos los platillos conectados a este origen
                            linksFiltered.forEach(link => {
                                if (link.type === 'origen-platillo' && link.source.id === node.id) {
                                    connectedNodes.add(link.target.id);
                                    connectedLinks.add(link.index);
                                }
                            });
                        }
                    });
                    
                    // Aplicar estilo a los nodos
                    nodeElements.each(function(n) {
                        const nodeGroup = d3.select(this);
                        const isConnected = connectedNodes.has(n.id);
                        
                        // Comprobar si este nodo está seleccionado
                        const isSelected = selectedNodes.some(node => node.id === n.id);
                        
                        // Establecer opacidad según selección, conexión y nivel
                        let opacity;
                        if (isSelected) {
                            // Nodos seleccionados: siempre máxima opacidad sin transparencia
                            opacity = 1;
                            
                            // Resaltar visualmente los nodos de origen seleccionados con un borde más llamativo
                            if (n.level === 2) {
                                nodeGroup.select('circle')
                                    .attr('stroke', '#B8860B')  // Borde dorado
                                    .attr('stroke-width', 3);   // Más grueso
                            }
                        } else if (isConnected) {
                            // Nodos conectados: alta opacidad
                            opacity = 1;
                        } else if (n.level === 2) {
                            // Nodos de origen no conectados: mantener 25% de opacidad para contraste
                            opacity = 0.25;
                        } else {
                            // Resto de nodos no conectados: muy baja opacidad
                            opacity = 0.15;
                        }
                        nodeGroup.selectAll('circle').attr('opacity', opacity);
                        
                        // Añadir estilo a los nodos seleccionados
                        if (selectedNodes.some(node => node.id === n.id)) {
                            if (n.level !== 1) {
                                nodeGroup.select('circle')
                                    .attr('stroke', getNodeColor(n))
                                    .attr('stroke-width', 3);
                            } else {
                                nodeGroup.select('circle[fill^="url(#pattern"]')
                                    .attr('stroke', '#B8860B')
                                    .attr('stroke-width', 3);
                                    
                                nodeGroup.select('circle[fill="' + colorPalette.epoca + '"]')
                                    .attr('opacity', 0.6);
                            }
                        }
                    });
                    
                    // Aplicar estilo a los enlaces
                    linkElements.attr('opacity', l => {
                        return connectedLinks.has(l.index) ? 0.8 : 0.1;
                    });
                }
                
                // Comportamiento original de fijar/desfijar el nodo al hacer clic
                if (d.fx !== null || d.fy !== null) {
                    // Desfijar si ya estaba fijo
                    d.fx = null;
                    d.fy = null;
                    
                    // Restaurar apariencia normal si no está seleccionado
                    if (!selectedNodes.some(node => node.id === d.id)) {
                        if (d.level === 1) {
                            d3.select(this).select('circle[fill^="url(#pattern"]')
                                .attr('stroke', '#fff')
                                .attr('stroke-width', 1.5);
                        } else {
                            d3.select(this).select('circle').attr('stroke', '#fff');
                        }
                    }
                } else {
                    // Fijar en su posición actual
                    d.fx = d.x;
                    d.fy = d.y;
                    
                    // Indicar visualmente que está fijo
                    if (d.level === 1) {
                        d3.select(this).select('circle[fill^="url(#pattern"]')
                            .attr('stroke', '#FFD700')
                            .attr('stroke-width', 2);
                    } else {
                        d3.select(this).select('circle')
                            .attr('stroke', '#FFD700')
                            .attr('stroke-width', 1.5);
                    }
                }
            });
        }
        
        // Añadir controles (leyenda y botones) - posicionados más a la izquierda y en la parte superior
        const controlsContainer = d3.select('#network')
            .append('div')
            .attr('class', 'graph-controls')
            .style('position', 'absolute')
            .style('top', '15px') // Volver a la parte superior
            .style('right', '80px')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '15px')
            .style('background-color', 'rgba(255,255,255,0.5)')
            .style('padding', '6px 12px')
            .style('border-radius', '6px')
            .style('box-shadow', '0 1px 4px rgba(0,0,0,0.1)')
            .style('border', '1px solid rgba(174, 124, 52, 0.3)')
            .style('z-index', '100');
            
        // Añadir título para mostrar la época filtrada
        controlsContainer.append('div')
            .attr('class', 'filter-title')
            .style('font-family', 'Cardo, serif')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('color', '#9B2226')
            .style('margin-right', '10px')
            .text('México Prehispánico');
        
        // Añadir leyenda
        const legendContainer = controlsContainer
            .append('div')
            .attr('class', 'graph-legend')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '8px');
            
        // Categorías de nodos con colores
        const legendItems = [
            { label: 'Épocas', color: colorPalette.epoca },
            { label: 'Orígenes', color: colorPalette.origen },
            { label: 'Platillos', color: colorPalette.platillo }
        ];
        
        // Crear cada elemento de la leyenda
        legendItems.forEach(item => {
            // Contenedor por ítem
            const itemContainer = legendContainer
                .append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('margin-right', '8px');
                
            // Círculo de color
            itemContainer.append('div')
                .style('width', '10px')
                .style('height', '10px')
                .style('border-radius', '50%')
                .style('background-color', item.color)
                .style('margin-right', '4px');
                
            // Texto de la etiqueta
            itemContainer.append('span')
                .text(item.label)
                .style('font-size', '11px')
                .style('color', '#333')
                .style('font-family', 'Cardo, serif');
        });
        
        // Añadir botón para reiniciar filtros (ahora solo vuelve a filtrar por época)
        const resetButton = controlsContainer
            .append('button')
            .attr('class', 'reset-button')
            .text('Reiniciar vista')
            .style('background-color', '#073B4C')
            .style('color', 'white')
            .style('border', 'none')
            .style('border-radius', '6px')
            .style('padding', '6px 10px')
            .style('margin-right', '6px')
            .style('cursor', 'pointer')
            .style('font-family', 'Cardo, serif')
            .style('font-size', '12px')
            .style('transition', 'background-color 0.2s')
            .on('mouseover', function() {
                d3.select(this).style('background-color', '#0A4F66');
            })
            .on('mouseout', function() {
                d3.select(this).style('background-color', '#073B4C');
            })
            .on('click', function() {
                // Reiniciar grafo - pero solo a la época prehispánica
                nodesFiltered.forEach(node => {
                    node.fx = null;
                    node.fy = null;
                });
                
                // Crear función para filtrar por época prehispánica
                function filtrarSoloPorEpocaPrehispanica() {
                    const epocaFiltro = 'México Prehispánico (Antes de 1521)';
                    
                    // Obtener el nodo de la época prehispánica
                    const epocaNode = nodes.find(n => n.level === 1 && n.name === epocaFiltro);
                    if (!epocaNode) {
                        console.error('No se encontró la época prehispánica en los datos');
                        return;
                    }
                    
                    // Identificar orígenes conectados a esta época
                    const origenesConectados = new Set();
                    links.forEach(link => {
                        if (link.type === 'epoca-origen' && 
                            (typeof link.source === 'object' ? link.source.id : link.source) === epocaNode.id) {
                            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                            origenesConectados.add(targetId);
                        }
                    });
                    
                    // Identificar platillos conectados a estos orígenes
                    const platillosConectados = new Set();
                    links.forEach(link => {
                        if (link.type === 'origen-platillo' && 
                            origenesConectados.has(typeof link.source === 'object' ? link.source.id : link.source)) {
                            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                            platillosConectados.add(targetId);
                        }
                    });
                    
                    // Filtrar nodos - SOLO mantenemos la época prehispánica en nivel 1
                    nodesFiltered = nodes.filter(node => {
                        if (node.level === 1) return node.id === epocaNode.id;
                        if (node.level === 2) return origenesConectados.has(node.id);
                        if (node.level === 3) return platillosConectados.has(node.id);
                        return false;
                    });
                    
                    // Filtrar enlaces solo con nodos que hemos conservado
                    linksFiltered = links.filter(link => {
                        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                        
                        if (link.type === 'epoca-origen') {
                            return sourceId === epocaNode.id && origenesConectados.has(targetId);
                        }
                        if (link.type === 'origen-platillo') {
                            return origenesConectados.has(sourceId) && platillosConectados.has(targetId);
                        }
                        return false;
                    });
                    
                    // Marcar todos los nodos como relevantes
                    nodesFiltered.forEach(node => {
                        node.isRelevant = true;
                    });
                    
                    // Marcar todos los enlaces como relevantes
                    linksFiltered.forEach(link => {
                        link.isRelevant = true;
                        link.opacity = 0.6; // Opacidad media
                    });
                }
                
                // Desactivar filtrado por ingrediente y activar por época
                ingredienteActivo = null;
                filtrarSoloPorEpocaPrehispanica();
                actualizarVisualizacion(true); // Con recentrado
                
                simulation.alpha(1).restart();
            });
            
        // Añadir botón para reiniciar el zoom
        const resetZoomButton = controlsContainer
            .append('button')
            .attr('class', 'reset-zoom-button')
            .text('Zoom inicial')
            .style('background-color', '#9B2226')
            .style('color', 'white')
            .style('border', 'none')
            .style('border-radius', '6px')
            .style('padding', '6px 10px')
            .style('cursor', 'pointer')
            .style('font-family', 'Cardo, serif')
            .style('font-size', '12px')
            .style('transition', 'background-color 0.2s')
            .on('mouseover', function() {
                d3.select(this).style('background-color', '#B42B30');
            })
            .on('mouseout', function() {
                d3.select(this).style('background-color', '#9B2226');
            })
            .on('click', function() {
                // Reiniciar el zoom a la escala inicial
                zoomContainer.transition()
                    .duration(400)
                    .call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1.2));
            });
        
        // Cargar y procesar los datos
        d3.text('./json/platillos_expandido.csv')
            .catch(error => {
                console.error("Error cargando CSV inicial:", error);
                // Intentar ruta alternativa
                return d3.text('./platillos_expandido.csv');
            })
            .then(function(data) {
                // Parsear los datos CSV
                const rows = data.split('\n').slice(1); // Omitir encabezado
                
                console.log('Iniciando procesamiento de datos del CSV...');
                
                // Procesar los datos para crear la estructura del grafo
                const epocas = new Map(); // Nivel 1 (centro)
                const origenes = new Map(); // Nivel 2 (medio)
                const platillos = new Map(); // Nivel 3 (exterior)
                
                // Enlaces entre niveles
                links = [];
                
                // Conjunto para mantener registro de enlaces únicos
                const uniqueLinks = new Set();
                
                // Para el conteo de conexiones 
                const origenConnections = new Map();
                const epocaConnections = new Map();
                
                // Mapa para almacenar la relación entre platillos e ingredientes
                const platillosIngredientes = new Map();
                
                // Mapa para registrar las épocas asociadas a cada origen
                const origenEpocas = new Map();
                
                rows.forEach(row => {
                    if (!row.trim()) return; // Saltar filas vacías
                    
                    const fields = row.split('|');
                    if (fields.length < 14) return; // Verificar que tenga suficientes campos
                    
                    const nombrePlatillo = fields[0].trim();
                    const origenPlatillo = fields[1].trim();
                    const epocaPlatillo = fields[11].trim();
                    const ingrediente = fields[13] ? fields[13].trim().toUpperCase() : '';
                    
                    // Saltear si algún campo esencial está vacío
                    if (!nombrePlatillo || !origenPlatillo || !epocaPlatillo) return;
                    
                    // Registrar la relación entre platillo e ingrediente
                    const platilloKey = `${nombrePlatillo}-${origenPlatillo}`;
                    if (ingrediente) {
                        if (!platillosIngredientes.has(platilloKey)) {
                            platillosIngredientes.set(platilloKey, new Set());
                        }
                        platillosIngredientes.get(platilloKey).add(ingrediente);
                    }
                    
                    // 1. Añadir nodo de época si no existe
                    if (!epocas.has(epocaPlatillo)) {
                        epocas.set(epocaPlatillo, {
                            id: epocaPlatillo,
                            name: epocaPlatillo,
                            level: 1, // Nivel 1: épocas (centro)
                            connections: 0
                        });
                        epocaConnections.set(epocaPlatillo, 0);
                    }
                    
                    // 2. Añadir nodo de origen si no existe
                    if (!origenes.has(origenPlatillo)) {
                        origenes.set(origenPlatillo, {
                            id: origenPlatillo,
                            name: origenPlatillo,
                            level: 2, // Nivel 2: orígenes (medio)
                            connections: 0,
                            epocas: new Set() // Para registrar con qué épocas está relacionado
                        });
                        origenConnections.set(origenPlatillo, 0);
                    }
                    
                    // Registrar relación entre origen y época
                    origenes.get(origenPlatillo).epocas.add(epocaPlatillo);
                    
                    // Registrar época asociada a este origen para enlaces
                    if (!origenEpocas.has(origenPlatillo)) {
                        origenEpocas.set(origenPlatillo, new Set());
                    }
                    origenEpocas.get(origenPlatillo).add(epocaPlatillo);
                    
                    // 3. Añadir nodo de platillo si no existe
                    if (!platillos.has(platilloKey)) {
                        platillos.set(platilloKey, {
                            id: platilloKey,
                            name: nombrePlatillo,
                            origen: origenPlatillo,
                            epoca: epocaPlatillo,
                            level: 3, // Nivel 3: platillos (exterior)
                            ingredientes: [] // Se llenará después
                        });
                        
                        // Crear enlace entre origen y platillo
                        const linkKeyOtP = `${origenPlatillo}-${platilloKey}`;
                        if (!uniqueLinks.has(linkKeyOtP)) {
                            links.push({
                                source: origenPlatillo,
                                target: platilloKey,
                                value: 1,
                                type: 'origen-platillo'
                            });
                            uniqueLinks.add(linkKeyOtP);
                            
                            // Incrementar contador de conexiones para el origen
                            origenConnections.set(origenPlatillo, 
                                (origenConnections.get(origenPlatillo) || 0) + 1);
                        }
                    }
                });
                
                // Crear enlaces entre épocas y orígenes
                origenEpocas.forEach((epocasSet, origen) => {
                    epocasSet.forEach(epoca => {
                        const linkKeyEtO = `${epoca}-${origen}`;
                        if (!uniqueLinks.has(linkKeyEtO)) {
                            links.push({
                                source: epoca,
                                target: origen,
                                value: 1,
                                type: 'epoca-origen'
                            });
                            uniqueLinks.add(linkKeyEtO);
                            
                            // Incrementar conteo de conexiones para la época
                            epocaConnections.set(epoca, 
                                (epocaConnections.get(epoca) || 0) + 1);
                        }
                    });
                });
                
                // Actualizar el conteo de conexiones para los nodos
                epocas.forEach((node, key) => {
                    node.connections = epocaConnections.get(key) || 0;
                });
                
                origenes.forEach((node, key) => {
                    node.connections = origenConnections.get(key) || 0;
                });
                
                // Completar la información de ingredientes para cada platillo
                platillos.forEach((platillo, key) => {
                    if (platillosIngredientes.has(key)) {
                        platillo.ingredientes = Array.from(platillosIngredientes.get(key));
                    } else {
                        platillo.ingredientes = [];
                    }
                    
                    // Obtener el tipo de platillo del CSV para anillo de categorías (nivel 4)
                    const fields = rows.find(row => {
                        const fields = row.split('|');
                        if (fields.length < 14) return false;
                        return fields[0].trim() === platillo.name;
                    });
                    
                    if (fields) {
                        const rowFields = fields.split('|');
                        if (rowFields.length >= 11) {
                            platillo.tipo_platillo = rowFields[10].trim(); // TIPO_Platillo
                        }
                    }
                });
                
                // Convertir maps a arrays para D3
                nodes = [
                    ...Array.from(epocas.values()),
                    ...Array.from(origenes.values()),
                    ...Array.from(platillos.values())
                ];
                
                // Inicialmente, mostrar todos los nodos
                nodesFiltered = [...nodes];
                linksFiltered = [...links];
                
                // Guardar datos para acceso externo
                window.grafoData = {
                    nodes,
                    links
                };
                
                // Inicializar visualización
                actualizarVisualizacion();
                
                // Notificar que el grafo está inicializado
                setTimeout(() => {
                    window.grafoInicializado = true;
                    console.log('Grafo inicializado correctamente');
                    
                    // Crear una función especial de inicialización para filtrar solo por época prehispánica
                    function filtrarPorEpocaPrehispanica() {
                        console.log('Filtrando exclusivamente por época prehispánica');
                        const epocaFiltro = 'México Prehispánico (Antes de 1521)';
                        
                        // Obtener el nodo de la época prehispánica
                        const epocaNode = nodes.find(n => n.level === 1 && n.name === epocaFiltro);
                        if (!epocaNode) {
                            console.error('No se encontró la época prehispánica en los datos');
                            return;
                        }
                        
                        // Identificar orígenes conectados a esta época
                        const origenesConectados = new Set();
                        links.forEach(link => {
                            if (link.type === 'epoca-origen' && 
                                (typeof link.source === 'object' ? link.source.id : link.source) === epocaNode.id) {
                                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                                origenesConectados.add(targetId);
                            }
                        });
                        
                        // Identificar platillos conectados a estos orígenes
                        const platillosConectados = new Set();
                        links.forEach(link => {
                            if (link.type === 'origen-platillo' && 
                                origenesConectados.has(typeof link.source === 'object' ? link.source.id : link.source)) {
                                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                                platillosConectados.add(targetId);
                            }
                        });
                        
                        // Filtrar nodos - SOLO mantenemos la época prehispánica en nivel 1
                        nodesFiltered = nodes.filter(node => {
                            if (node.level === 1) return node.id === epocaNode.id;
                            if (node.level === 2) return origenesConectados.has(node.id);
                            if (node.level === 3) return platillosConectados.has(node.id);
                            return false;
                        });
                        
                        // Filtrar enlaces solo con nodos que hemos conservado
                        linksFiltered = links.filter(link => {
                            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                            
                            if (link.type === 'epoca-origen') {
                                return sourceId === epocaNode.id && origenesConectados.has(targetId);
                            }
                            if (link.type === 'origen-platillo') {
                                return origenesConectados.has(sourceId) && platillosConectados.has(targetId);
                            }
                            return false;
                        });
                        
                        // Marcar todos los nodos como relevantes
                        nodesFiltered.forEach(node => {
                            node.isRelevant = true;
                        });
                        
                        // Marcar todos los enlaces como relevantes
                        linksFiltered.forEach(link => {
                            link.isRelevant = true;
                            link.opacity = 0.6; // Opacidad media
                        });
                        
                        // Forzar actualización de la visualización
                        actualizarVisualizacion();
                        
                        // Asegurar zoom apropiado después de filtrar - sin desplazamiento adicional
                        setTimeout(() => {
                            zoomContainer.transition().duration(300)
                                .call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1.0));
                        }, 300);
                    }
                    
                    // Aplicar un ligero zoom inicial - sin desplazamiento adicional
                    zoomContainer.transition().duration(500)
                        .call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1.0));
                    
                    // Siempre iniciar filtrando por época prehispánica, ignorar cualquier otro filtro inicial
                    setTimeout(() => {
                        filtrarPorEpocaPrehispanica();
                    }, 300);
                }, 300);
            })
            .catch(function(error) {
                console.error('Error al cargar o procesar los datos:', error);
                
                // Crear datos estáticos para permitir visualización mínima
                console.log('Usando datos estáticos de respaldo para recuperación');
                
                // Datos mínimos para mostrar
                nodes = [
                    {id: 'Prehispánica', name: 'México Prehispánico (Antes de 1521)', level: 1, connections: 5},
                    {id: 'Azteca', name: 'Azteca', level: 2, connections: 3},
                    {id: 'Maya', name: 'Maya', level: 2, connections: 2},
                    {id: 'Zapoteca', name: 'Zapoteca', level: 2, connections: 2},
                    {id: 'Enchiladas', name: 'Enchiladas', level: 3, origen: 'Azteca', epoca: 'Prehispánica', ingredientes: ['MAÍZ', 'CHILE']},
                    {id: 'Tamales', name: 'Tamales', level: 3, origen: 'Azteca', epoca: 'Prehispánica', ingredientes: ['MAÍZ', 'FRIJOL']},
                    {id: 'Atole', name: 'Atole', level: 3, origen: 'Maya', epoca: 'Prehispánica', ingredientes: ['MAÍZ']},
                    {id: 'Pozole', name: 'Pozole', level: 3, origen: 'Zapoteca', epoca: 'Prehispánica', ingredientes: ['MAÍZ']}
                ];
                
                links = [
                    {source: 'Prehispánica', target: 'Azteca', value: 2, type: 'epoca-origen'},
                    {source: 'Prehispánica', target: 'Maya', value: 2, type: 'epoca-origen'},
                    {source: 'Prehispánica', target: 'Zapoteca', value: 2, type: 'epoca-origen'},
                    {source: 'Azteca', target: 'Enchiladas', value: 1, type: 'origen-platillo'},
                    {source: 'Azteca', target: 'Tamales', value: 1, type: 'origen-platillo'},
                    {source: 'Maya', target: 'Atole', value: 1, type: 'origen-platillo'},
                    {source: 'Zapoteca', target: 'Pozole', value: 1, type: 'origen-platillo'}
                ];
                
                // Inicialmente, mostrar todos los nodos
                nodesFiltered = [...nodes];
                linksFiltered = [...links];
                
                // Guardar datos para acceso externo
                window.grafoData = {
                    nodes,
                    links
                };
                
                // Mostrar mensaje de error discreto
                d3.select('#network')
                    .append('div')
                    .attr('class', 'error-message')
                    .style('position', 'absolute')
                    .style('top', '50%')
                    .style('left', '50%')
                    .style('transform', 'translate(-50%, -50%)')
                    .style('background-color', 'rgba(246, 240, 228, 0.9)')
                    .style('padding', '15px 20px')
                    .style('border-radius', '8px')
                    .style('border-left', '4px solid #9B2226')
                    .style('box-shadow', '0 2px 10px rgba(0,0,0,0.1)')
                    .style('max-width', '90%')
                    .style('width', '320px')
                    .style('text-align', 'center')
                    .style('z-index', '100')
                    .style('font-family', 'Cardo, serif')
                    .style('color', '#333')
                    .html('<strong style="color:#9B2226">Datos de demostración</strong><br>No se pudieron cargar los datos completos.');
                
                // Inicializar visualización con datos de respaldo
                actualizarVisualizacion();
                
                // Notificar que el grafo está inicializado
                setTimeout(() => {
                    window.grafoInicializado = true;
                    console.log('Grafo inicializado con datos de respaldo');
                    
                    // Aplicar un zoom adecuado para los datos de respaldo - sin desplazamiento adicional
                    zoomContainer.transition().duration(500)
                        .call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1.0));
                }, 300);
            });
        
        // Añadir integración con el sistema de filtrado
        window.filtrarGrafoPorIngrediente = function(ingrediente) {
            // Verificar si el contenedor del grafo existe antes de filtrar
            if (!document.getElementById('network')) {
                console.error('Error: Contenedor del grafo no encontrado (#network)');
                // Intentar regenerar el grafo
                regenerateGraph();
                return;
            }
            
            // Filtrar con manejo de errores
            try {
                // Aplicar doble filtro: por época e ingrediente
                const epocaFiltro = 'México Prehispánico (Antes de 1521)';
                
                // Encontrar el nodo de la época
                const epocaNode = nodes.find(n => n.level === 1 && n.name === epocaFiltro);
                if (!epocaNode) {
                    console.error('No se encontró la época prehispánica');
                    return;
                }
                
                // 1. Identificar orígenes conectados a la época prehispánica
                const origenesEpoca = new Set();
                links.forEach(link => {
                    if (link.type === 'epoca-origen' && 
                        (typeof link.source === 'object' ? link.source.id : link.source) === epocaNode.id) {
                        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                        origenesEpoca.add(targetId);
                    }
                });
                
                // 2. Identificar platillos conectados a los orígenes de la época prehispánica
                const platillosEpoca = new Set();
                links.forEach(link => {
                    if (link.type === 'origen-platillo' && 
                        origenesEpoca.has(typeof link.source === 'object' ? link.source.id : link.source)) {
                        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                        platillosEpoca.add(targetId);
                    }
                });
                
                // 3. Aplicar el filtro por ingrediente dentro del conjunto de platillos de la época
                if (ingrediente) {
                    console.log(`Filtrando por época prehispánica e ingrediente: ${ingrediente}`);
                    
                    // Normalizar nombre del ingrediente
                    const ingredienteNormalizado = ingrediente.trim().toUpperCase();
                    ingredienteActivo = ingredienteNormalizado;
                    
                    // Identificar platillos de la época que contienen el ingrediente
                    const platillosConIngrediente = new Set();
                    
                    nodes.forEach(node => {
                        if (node.level === 3 && 
                            platillosEpoca.has(node.id) && 
                            node.ingredientes && 
                            node.ingredientes.length > 0) {
                            
                            // Verificar si alguno de los ingredientes contiene el filtro
                            const tieneIngrediente = node.ingredientes.some(ing => 
                                ing && typeof ing === 'string' && ing.includes(ingredienteNormalizado)
                            );
                            
                            if (tieneIngrediente) {
                                platillosConIngrediente.add(node.id);
                                node.isRelevant = true;
                            } else {
                                node.isRelevant = false;
                            }
                        }
                    });
                    
                    // Identificar orígenes conectados a estos platillos (dentro de la época)
                    const origenesRelevantes = new Set();
                    links.forEach(link => {
                        if (link.type === 'origen-platillo') {
                            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                            
                            if (platillosConIngrediente.has(targetId) && origenesEpoca.has(sourceId)) {
                                origenesRelevantes.add(sourceId);
                            }
                        }
                    });
                    
                    // Marcar orígenes como relevantes
                    nodes.forEach(node => {
                        if (node.level === 2) {
                            node.isRelevant = origenesRelevantes.has(node.id);
                        }
                    });
                    
                    // Marcar época como relevante
                    nodes.forEach(node => {
                        if (node.level === 1 && node.id === epocaNode.id) {
                            node.isRelevant = true;
                        }
                    });
                    
                    // Filtrar nodos - DOBLE FILTRO (época + ingrediente)
                    nodesFiltered = nodes.filter(node => {
                        if (node.level === 1) return node.id === epocaNode.id;
                        if (node.level === 2) return origenesEpoca.has(node.id) && origenesRelevantes.has(node.id);
                        if (node.level === 3) return platillosConIngrediente.has(node.id);
                        return false;
                    });
                    
                    // Filtrar enlaces
                    linksFiltered = links.filter(link => {
                        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                        
                        if (link.type === 'epoca-origen') {
                            return sourceId === epocaNode.id && origenesRelevantes.has(targetId);
                        }
                        if (link.type === 'origen-platillo') {
                            return origenesRelevantes.has(sourceId) && platillosConIngrediente.has(targetId);
                        }
                        return false;
                    });
                } else {
                    // Solo filtrar por época prehispánica si no hay ingrediente
                    console.log('Filtrando solo por época prehispánica');
                    ingredienteActivo = null;
                    
                    // Filtrar nodos - SOLO época prehispánica
                    nodesFiltered = nodes.filter(node => {
                        if (node.level === 1) return node.id === epocaNode.id;
                        if (node.level === 2) return origenesEpoca.has(node.id);
                        if (node.level === 3) return platillosEpoca.has(node.id);
                        return false;
                    });
                    
                    // Filtrar enlaces
                    linksFiltered = links.filter(link => {
                        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                        
                        if (link.type === 'epoca-origen') {
                            return sourceId === epocaNode.id && origenesEpoca.has(targetId);
                        }
                        if (link.type === 'origen-platillo') {
                            return origenesEpoca.has(sourceId) && platillosEpoca.has(targetId);
                        }
                        return false;
                    });
                    
                    // Marcar todos los nodos como relevantes
                    nodesFiltered.forEach(node => {
                        node.isRelevant = true;
                    });
                }
                
                // Marcar todos los enlaces como relevantes
                linksFiltered.forEach(link => {
                    link.isRelevant = true;
                    link.opacity = 0.6;
                });
                
                // Actualizar la visualización
                actualizarVisualizacion(false);
            } catch (error) {
                console.error('Error al filtrar el grafo:', error);
            }
        };
    } // Fin de la función initGraph
    
    // Iniciar la creación del grafo
    initGraph();

    // Reintentar hasta encontrar el contenedor (section-loader puede tardar)
    var _retryCount = 0;
    var _retryMax = 30; // 30 intentos × 500ms = 15 segundos máximo
    var _retryInterval = setInterval(function() {
        _retryCount++;
        if (document.getElementById('network') && document.querySelector('#network svg')) {
            clearInterval(_retryInterval);
            return;
        }
        if (_retryCount >= _retryMax) {
            clearInterval(_retryInterval);
            console.warn('circularGraph: contenedor no encontrado tras ' + _retryMax + ' intentos');
            return;
        }
        regenerateGraph();
    }, 500);
});