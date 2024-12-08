const DataProcessor = {
    currentFilter: null,

    processDataForSankey: function(data) {
        const nodes = [];
        const links = [];
        const addedNodes = new Set();

        // Primero agregamos todos los nodos en el orden deseado
        data.features.forEach(feature => {
            const alimentos = feature.properties.alimentos;
            const platillos = feature.properties.platillos;
            const estado = feature.properties.estado;

            // 1. Agregar nodos de ingredientes (primera columna)
            alimentos.forEach(alimento => {
                if (!addedNodes.has(alimento)) {
                    nodes.push({
                        name: alimento,
                        category: 'ingrediente',
                        itemStyle: {
                            color: SankeyConfig.getIngredientColor(alimento)
                        }
                    });
                    addedNodes.add(alimento);
                }
            });

            // 2. Agregar nodos de platillos (segunda columna)
            platillos.forEach(platillo => {
                if (!addedNodes.has(platillo)) {
                    nodes.push({
                        name: platillo,
                        category: 'platillo',
                        itemStyle: {
                            color: SankeyConfig.defaultColors.platillos
                        }
                    });
                    addedNodes.add(platillo);
                }
            });

            // 3. Agregar nodo del estado (tercera columna)
            if (!addedNodes.has(estado)) {
                nodes.push({
                    name: estado,
                    category: 'estado',
                    itemStyle: {
                        color: SankeyConfig.defaultColors.estados
                    }
                });
                addedNodes.add(estado);
            }
        });

        // Crear los enlaces en el nuevo orden
        data.features.forEach(feature => {
            const estado = feature.properties.estado;
            const platillos = feature.properties.platillos;

            // Enlaces de ingredientes a platillos
            if (feature.properties.relaciones) {
                feature.properties.relaciones.forEach(relacion => {
                    links.push({
                        source: relacion.origen,
                        target: relacion.destino,
                        value: relacion.peso || 1,
                        lineStyle: {
                            color: SankeyConfig.getIngredientColor(relacion.origen),
                            opacity: 0.7
                        }
                    });
                });
            }

            // Enlaces de platillos a estados
            platillos.forEach(platillo => {
                links.push({
                    source: platillo,
                    target: estado,
                    value: 1,
                    lineStyle: {
                        color: SankeyConfig.defaultColors.platillos,
                        opacity: 0.7
                    }
                });
            });
        });

        return { nodes, links };
    },

    filterByIngredient: function(sankeyData, ingrediente) {
        this.currentFilter = ingrediente;
        
        const relevantNodes = new Set([ingrediente]);
        const platillosRelacionados = new Set();
        const estadosRelacionados = new Set();
        const filteredLinks = [];
    
        // Encontrar platillos relacionados
        sankeyData.links.forEach(link => {
            if (link.source === ingrediente) {
                relevantNodes.add(link.target);
                platillosRelacionados.add(link.target);
                filteredLinks.push(link);
            }
        });
    
        // Encontrar estados relacionados
        sankeyData.links.forEach(link => {
            if (platillosRelacionados.has(link.source)) {
                relevantNodes.add(link.target);
                estadosRelacionados.add(link.target);
                filteredLinks.push(link);
            }
        });
    
        // Filtrar y ajustar los nodos
        const filteredNodes = sankeyData.nodes
            .filter(node => relevantNodes.has(node.name))
            .map(node => ({
                ...node,
                itemStyle: {
                    color: node.name === ingrediente 
                        ? SankeyConfig.getIngredientColor(node.name)
                        : platillosRelacionados.has(node.name)
                            ? SankeyConfig.defaultColors.platillos
                            : SankeyConfig.defaultColors.estados,
                    opacity: 1
                },
                label: {
                    show: true,
                    position: 'right',
                    fontSize: 10,
                    color: '#333'
                },
                // Aumentar el valor para que ocupen más espacio
                value: 1000 // Un valor alto para que todos los nodos sean grandes
            }));
    
        // Ajustar los enlaces
        const adjustedLinks = filteredLinks.map(link => ({
            ...link,
            value: 100, // Aumentar el valor de los enlaces
            lineStyle: {
                color: link.lineStyle.color,
                opacity: 0.7,
                width: 5 // Aumentar el ancho de las líneas
            }
        }));
    
        return {
            nodes: filteredNodes,
            links: adjustedLinks
        };
    },

    resetVisualization: function(sankeyData) {
        this.currentFilter = null;
        return {
            nodes: sankeyData.nodes.map(node => ({
                ...node,
                itemStyle: {
                    color: node.category === 'ingrediente'
                        ? SankeyConfig.getIngredientColor(node.name)
                        : node.category === 'estado'
                            ? SankeyConfig.defaultColors.estados
                            : SankeyConfig.defaultColors.platillos,
                    opacity: 1
                },
                // Restablecer configuración de etiqueta
                label: {
                    show: true,
                    position: 'right',
                    fontSize: 10,
                    color: '#333'
                }
            })),
            links: sankeyData.links.map(link => ({
                ...link,
                lineStyle: {
                    color: link.lineStyle.color,
                    opacity: 0.7
                }
            }))
        };
    },

    reapplyFilter: function(sankeyData) {
        if (this.currentFilter) {
            return this.filterByIngredient(sankeyData, this.currentFilter);
        }
        return this.resetVisualization(sankeyData);
    }
};