/**
 * Diagrama Sankey usando D3.js
 */
class SankeyDiagram {
    constructor(containerId, tooltipData = []) {
        this.containerId = containerId;
        this.tooltipData = tooltipData;
        this.container = document.getElementById(containerId);
        this.width = 0;
        this.height = 0;
        this.margin = { top: 30, right: 100, bottom: 30, left: 100 };
        this.svg = null;
        this.sankey = null;
        this.graph = null;
        this.processor = window.DataProcessorD3;
        this.currentFilter = null;
        this.isInitialized = false;
        
        // Títulos de columnas
        this.columnTitles = ['Ingredientes', 'Platillos', 'Estados'];
    }
    
    /**
     * Inicializa el diagrama
     */
    initialize() {
        if (!this.container) {
            console.error(`Contenedor #${this.containerId} no encontrado`);
            return;
        }
        
        // Crear el elemento SVG
        this.setDimensions();
        this.createSvg();
        this.createSankey();
        
        // Añadir listener para redimensionar
        window.addEventListener('resize', this.resize.bind(this));
        
        this.isInitialized = true;
    }
    
    /**
     * Establece las dimensiones del gráfico basado en el contenedor
     */
    setDimensions() {
        const containerRect = this.container.getBoundingClientRect();
        this.width = containerRect.width - this.margin.left - this.margin.right;
        this.height = containerRect.height - this.margin.top - this.margin.bottom;
        
        // Asegurar dimensiones mínimas
        this.width = Math.max(this.width, 500);
        this.height = Math.max(this.height, 400);
    }
    
    /**
     * Crea el elemento SVG y los grupos principales
     */
    createSvg() {
        // Limpiar contenedor
        d3.select(`#${this.containerId}`).selectAll("svg").remove();
        
        this.svg = d3.select(`#${this.containerId}`)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
        
        // Añadir grupo para enlaces
        this.linksGroup = this.svg.append("g")
            .attr("class", "links");
        
        // Añadir grupo para nodos
        this.nodesGroup = this.svg.append("g")
            .attr("class", "nodes");
        
        // Añadir grupo para etiquetas
        this.labelsGroup = this.svg.append("g")
            .attr("class", "labels");
        
        // Añadir grupo para títulos de columnas
        this.titlesGroup = this.svg.append("g")
            .attr("class", "column-titles");
    }
    
    /**
     * Crea el objeto Sankey
     */
    createSankey() {
        this.sankey = d3.sankey()
            .nodeId(d => d.id || d.name)
            .nodeWidth(20)
            .nodePadding(10)
            .extent([[0, 0], [this.width, this.height]]);
    }
    
    /**
     * Redimensiona el diagrama
     */
    resize() {
        if (!this.isInitialized) return;
        
        this.setDimensions();
        this.createSvg();
        this.createSankey();
        
        if (this.graph) {
            this.update(this.graph);
        }
    }
    
    /**
     * Actualiza el diagrama con nuevos datos
     * @param {Object} data - Datos para el diagrama Sankey
     */
    update(data) {
        if (!this.isInitialized) {
            this.initialize();
        }
        
        this.graph = data;
        
        // Procesar los datos con el layout Sankey
        const { nodes, links } = this.sankey(data);
        
        // Limpiar gráfico anterior
        this.linksGroup.selectAll("path").remove();
        this.nodesGroup.selectAll("rect").remove();
        this.labelsGroup.selectAll("text").remove();
        this.titlesGroup.selectAll("text").remove();
        
        // Crear enlaces (links)
        const linkColorFn = d => this.processor.getLinkColor(d);
        
        this.linksGroup.selectAll("path")
            .data(links)
            .enter()
            .append("path")
            .attr("class", "sankey-link")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke", linkColorFn)
            .attr("stroke-width", d => Math.max(1, d.width))
            .attr("fill", "none")
            .attr("opacity", 0.7)
            .style("pointer-events", "all")
            .on("mouseover", this.handleLinkHover.bind(this))
            .on("mouseout", this.handleLinkOut.bind(this));
        
        // Crear nodos
        this.nodesGroup.selectAll("rect")
            .data(nodes)
            .enter()
            .append("rect")
            .attr("class", d => `sankey-node sankey-node-${d.type}`)
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => Math.max(8, d.y1 - d.y0))
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", d => this.processor.getNodeColor(d))
            .attr("opacity", 1)
            .on("mouseover", this.handleNodeHover.bind(this))
            .on("mouseout", this.handleNodeOut.bind(this))
            .on("click", this.handleNodeClick.bind(this));
        
        // Crear etiquetas
        this.labelsGroup.selectAll("text")
            .data(nodes)
            .enter()
            .append("text")
            .attr("class", d => `sankey-label sankey-label-${d.type}`)
            .attr("x", d => d.x0 < this.width / 2 ? d.x1 + 6 : d.x0 - 6)
            .attr("y", d => (d.y0 + d.y1) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", d => d.x0 < this.width / 2 ? "start" : "end")
            .text(d => d.name)
            .attr("fill", "#013971")
            .style("font-size", "12px")
            .style("font-family", "Cardo, serif");
        
        // Añadir títulos de columnas
        const columnPositions = [
            0,  // Ingredientes
            this.width / 2,  // Platillos
            this.width  // Estados
        ];
        
        this.titlesGroup.selectAll("text")
            .data(this.columnTitles)
            .enter()
            .append("text")
            .attr("class", "column-title")
            .attr("x", (d, i) => columnPositions[i])
            .attr("y", -15)
            .attr("text-anchor", (d, i) => i === 0 ? "start" : i === 2 ? "end" : "middle")
            .text(d => d)
            .attr("fill", "#013971")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("font-family", "Libre Baskerville, serif");
    }
    
    /**
     * Filtra el diagrama para mostrar un ingrediente específico
     * @param {string} ingrediente - Nombre del ingrediente a filtrar
     */
    filterByIngredient(ingrediente) {
        if (!this.data) return;
        
        console.log('Filtering by ingredient:', ingrediente);
        console.log('Total nodes:', this.data.nodes.length);
        console.log('Total links:', this.data.links.length);
        
        this.currentFilter = ingrediente;
        
        const filteredNodes = [];
        const filteredLinks = [];
        const relevantNodeIds = new Set();
        
        // Encontrar el ingrediente exacto
        relevantNodeIds.add(ingrediente);
        
        // Debug: mostrar los primeros enlaces para ver su estructura
        console.log('Sample link:', this.data.links[0]);
        
        // Primera pasada: encontrar destinos relacionados con el ingrediente
        this.data.links.forEach(link => {
            // Manejar tanto objetos como strings para source y target
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            console.log(`Checking link: ${sourceId} -> ${targetId}`);
            
            if (sourceId === ingrediente) {
                console.log('Found link from ingredient to:', targetId);
                relevantNodeIds.add(targetId);
                filteredLinks.push({
                    source: sourceId,
                    target: targetId,
                    value: link.value
                });
            }
        });
        
        // Segunda pasada: encontrar culturas relacionadas con los destinos
        this.data.links.forEach(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            if (relevantNodeIds.has(sourceId) && 
                sourceId !== ingrediente && 
                !relevantNodeIds.has(targetId)) {
                
                console.log('Found second level link:', sourceId, '->', targetId);
                relevantNodeIds.add(targetId);
                filteredLinks.push({
                    source: sourceId,
                    target: targetId,
                    value: link.value
                });
            }
        });
        
        // Filtrar nodos relevantes
        this.data.nodes.forEach(node => {
            if (relevantNodeIds.has(node.id)) {
                filteredNodes.push({...node});
            }
        });
        
        console.log('Filtered nodes:', filteredNodes.length);
        console.log('Filtered links:', filteredLinks.length);
        console.log('Relevant node IDs:', Array.from(relevantNodeIds));
        
        // Verificar si hay suficientes datos para mostrar
        if (filteredNodes.length > 1 && filteredLinks.length > 0) {
            this.update({ nodes: filteredNodes, links: filteredLinks });
        } else {
            console.warn('No se encontraron suficientes datos para filtrar');
            // En lugar de resetear, mostrar solo el nodo del ingrediente
            if (filteredNodes.length === 1) {
                this.update({ nodes: filteredNodes, links: [] });
            } else {
                this.resetFilter();
            }
        }
    }
    
    /**
     * Restablece el diagrama al estado original
     */
    resetFilter() {
        if (!this.graph || !this.isInitialized) return;
        
        this.currentFilter = null;
        this.update(this.graph);
    }
    
    /**
     * Maneja el evento hover sobre un nodo
     * @param {Event} event - Evento del navegador
     * @param {Object} d - Datos del nodo
     */
    handleNodeHover(event, d) {
        // Resaltar nodo
        d3.select(event.currentTarget)
            .attr("opacity", 0.8)
            .attr("stroke", "#013971")
            .attr("stroke-width", 2);
        
        // Mostrar tooltip
        this.showTooltip(event, d);
    }
    
    /**
     * Maneja el evento salir de un nodo
     * @param {Event} event - Evento del navegador
     */
    handleNodeOut() {
        // Restaurar nodo
        this.nodesGroup.selectAll("rect")
            .attr("opacity", 1)
            .attr("stroke", "none");
        
        // Ocultar tooltip
        this.hideTooltip();
    }
    
    /**
     * Maneja el evento hover sobre un enlace
     * @param {Event} event - Evento del navegador
     * @param {Object} d - Datos del enlace
     */
    handleLinkHover(event, d) {
        // Resaltar enlace
        d3.select(event.currentTarget)
            .attr("stroke-opacity", 0.5)
            .attr("stroke-width", d.width * 1.5);
        
        // Mostrar tooltip con información del enlace
        const sourceNode = typeof d.source === 'object' ? d.source : { name: d.source };
        const targetNode = typeof d.target === 'object' ? d.target : { name: d.target };
        
        this.showLinkTooltip(event, {
            source: sourceNode.name,
            target: targetNode.name,
            value: d.value
        });
    }
    
    /**
     * Maneja el evento salir de un enlace
     */
    handleLinkOut() {
        // Restaurar enlaces
        this.linksGroup.selectAll("path")
            .attr("stroke-opacity", 0.3)
            .attr("stroke-width", d => Math.max(1, d.width));
        
        // Ocultar tooltip
        this.hideTooltip();
    }
    
    /**
     * Maneja el clic en un nodo
     * @param {Event} event - Evento del navegador
     * @param {Object} d - Datos del nodo
     */
    handleNodeClick(event, d) {
        if (d.type === 'ingrediente' && this.processor.allowedIngredients.has(d.name)) {
            const ingrediente = d.name;
            
            if (this.currentFilter === ingrediente) {
                this.resetFilter();
            } else {
                this.filterByIngredient(ingrediente);
            }
        }
    }
    
    /**
     * Muestra un tooltip con información del nodo
     * @param {Event} event - Evento del navegador
     * @param {Object} d - Datos del nodo
     */
    showTooltip(event, d) {
        // Buscar información adicional en los datos de tooltip
        const tooltipInfo = this.tooltipData.find(item => item.ingredient === d.name);
        
        // Colores prehispánicos inspirados en arte mexicano antiguo para los tooltips
        const colorPalette = [
            "#9B2226", // Rojo carmín (similar al usado en códices)
            "#BB4D00", // Naranja rojizo (color de cerámica)
            "#AE7C34", // Dorado ocre (color maya)
            "#5F5F41", // Verde oliva (jade)
            "#28666E", // Azul-verde (color turquesa)
            "#073B4C"  // Azul oscuro (color usado en murales)
        ];
        
        // Seleccionar un color según el tipo de nodo
        let mainColor;
        if (d.type === 'ingrediente') {
            mainColor = colorPalette[1]; // Naranja para ingredientes
        } else if (d.type === 'destino') {
            mainColor = colorPalette[2]; // Dorado para destinos
        } else {
            mainColor = colorPalette[5]; // Azul para culturas
        }
        
        // Crear tooltip con estilo prehispánico
        let tooltipContent = `
            <div style="position: relative;">
                <div style="position: absolute; top: -10px; left: -10px; right: -10px; height: 5px; 
                     background: repeating-linear-gradient(90deg, ${mainColor}, ${mainColor} 5px, transparent 5px, transparent 10px);"></div>
                <div style="font-weight: bold; font-size: 15px; margin: 2px 0 8px 0; color: ${mainColor}; text-transform: uppercase;">
                    ${d.name}
                </div>`;
        
        if (tooltipInfo) {
            tooltipContent += `
                <div style="color: #444; font-size: 13px; margin-bottom: 8px;">
                    ${tooltipInfo.info}
                </div>
                <div style="color: #666; font-size: 12px; font-style: italic;">
                    ${tooltipInfo.preparation}
                </div>`;
        }
        
        // Añadir el tipo de nodo
        let tipoNodo = '';
        if (d.type === 'ingrediente') tipoNodo = 'Ingrediente prehispánico';
        else if (d.type === 'destino') tipoNodo = 'Platillo típico';
        else if (d.type === 'cultura') tipoNodo = 'Cultura prehispánica';
        
        tooltipContent += `
                <div style="margin-top: 5px; font-size: 11px; color: #777;">
                    ${tipoNodo}
                </div>
                <div style="position: absolute; bottom: -10px; left: -10px; right: -10px; height: 5px; 
                     background: repeating-linear-gradient(90deg, ${mainColor}, ${mainColor} 5px, transparent 5px, transparent 10px);"></div>
            </div>`;
        
        // Crear tooltip si no existe
        let tooltip = d3.select("body").select(".sankey-tooltip-container");
        if (tooltip.empty()) {
            tooltip = d3.select("body")
                .append("div")
                .attr("class", "sankey-tooltip-container");
        }
        
        // Actualizar estilos para que coincidan con el diseño prehispánico
        tooltip
            .style("background-color", "#F0EBCE") // Color de papel amate
            .style("border", "2px solid " + mainColor)
            .style("border-radius", "0")
            .style("padding", "12px 18px")
            .style("font-family", "'Libre Baskerville', serif")
            .style("box-shadow", "4px 4px 0 rgba(155, 34, 38, 0.5)")
            .style("transform", `rotate(${Math.random() * 2 - 1}deg)`); // Ligera rotación aleatoria
        
        // Posicionar y mostrar tooltip
        tooltip
            .html(tooltipContent)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px")
            .style("opacity", 1);
    }
    
    /**
     * Muestra un tooltip con información del enlace
     * @param {Event} event - Evento del navegador
     * @param {Object} d - Datos del enlace
     */
    showLinkTooltip(event, d) {
        // Colores prehispánicos inspirados en arte mexicano antiguo para los tooltips
        const colorPalette = [
            "#9B2226", // Rojo carmín (similar al usado en códices)
            "#BB4D00", // Naranja rojizo (color de cerámica)
            "#AE7C34", // Dorado ocre (color maya)
            "#5F5F41", // Verde oliva (jade)
            "#28666E", // Azul-verde (color turquesa)
            "#073B4C"  // Azul oscuro (color usado en murales)
        ];
        
        // Color aleatorio para dar variedad visual
        const mainColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        
        // Tooltip con estilo prehispánico para enlaces
        const tooltipContent = `
            <div style="position: relative;">
                <div style="position: absolute; top: -10px; left: -10px; right: -10px; height: 5px; 
                     background: repeating-linear-gradient(90deg, ${mainColor}, ${mainColor} 5px, transparent 5px, transparent 10px);"></div>
                <div style="font-weight: bold; font-size: 15px; margin: 2px 0 8px 0; color: ${mainColor}; text-transform: uppercase;">
                    CONEXIÓN
                </div>
                <div style="color: #444; font-size: 13px;">
                    <strong>${d.source}</strong> → <strong>${d.target}</strong>
                </div>
                <div style="margin-top: 5px; font-size: 11px; color: #777;">
                    ${d.value} platillo${d.value !== 1 ? 's' : ''}
                </div>
                <div style="position: absolute; bottom: -10px; left: -10px; right: -10px; height: 5px; 
                     background: repeating-linear-gradient(90deg, ${mainColor}, ${mainColor} 5px, transparent 5px, transparent 10px);"></div>
            </div>`;
        
        // Crear tooltip si no existe
        let tooltip = d3.select("body").select(".sankey-tooltip-container");
        if (tooltip.empty()) {
            tooltip = d3.select("body")
                .append("div")
                .attr("class", "sankey-tooltip-container");
        }
        
        // Actualizar estilos para que coincidan con el diseño prehispánico
        tooltip
            .style("background-color", "#F0EBCE") // Color de papel amate
            .style("border", "2px solid " + mainColor)
            .style("border-radius", "0")
            .style("padding", "12px 18px")
            .style("font-family", "'Libre Baskerville', serif")
            .style("box-shadow", "4px 4px 0 rgba(155, 34, 38, 0.5)")
            .style("transform", `rotate(${Math.random() * 2 - 1}deg)`); // Ligera rotación aleatoria
        
        // Posicionar y mostrar tooltip
        tooltip
            .html(tooltipContent)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px")
            .style("opacity", 1);
    }
    
    /**
     * Oculta el tooltip
     */
    hideTooltip() {
        d3.select("body").select(".sankey-tooltip-container")
            .style("opacity", 0);
    }
    
    /**
     * Libera recursos al destruir el componente
     */
    dispose() {
        window.removeEventListener('resize', this.resize);
        
        if (this.svg) {
            d3.select(`#${this.containerId}`).selectAll("svg").remove();
        }
        
        this.isInitialized = false;
    }
}

// Exportar como variable global
window.SankeyDiagram = SankeyDiagram;