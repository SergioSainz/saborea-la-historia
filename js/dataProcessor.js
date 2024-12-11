const DataProcessor = {
    currentFilter: null,
    currentCategory: null,

    processDataForSankey: function(data) {
        const nodes = [];
        const links = [];
        const addedNodes = new Set();

        data.features.forEach(feature => {
            const alimentos = feature.properties.alimentos;
            const platillos = feature.properties.platillos;
            const estado = feature.properties.estado;

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

        data.features.forEach(feature => {
            const estado = feature.properties.estado;
            const platillos = feature.properties.platillos;

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

    filterByCategory: function(sankeyData, category, ingredientCategories) {
        if (!category || category === 'all') {
            return this.resetVisualization(sankeyData);
        }

        this.currentCategory = category;
        
        const categoryIngredients = new Set(
            ingredientCategories.classified_ingredients
                .filter(item => item.category === category)
                .map(item => item.ingredient)
        );

        const relevantNodes = new Set();
        const platillosRelacionados = new Set();
        const estadosRelacionados = new Set();
        const filteredLinks = [];

        sankeyData.links.forEach(link => {
            if (categoryIngredients.has(link.source)) {
                relevantNodes.add(link.source);
                relevantNodes.add(link.target);
                platillosRelacionados.add(link.target);
                filteredLinks.push({
                    ...link,
                    lineStyle: {
                        ...link.lineStyle,
                        color: SankeyConfig.defaultColors.categoryColors[category]
                    }
                });
            }
        });

        sankeyData.links.forEach(link => {
            if (platillosRelacionados.has(link.source)) {
                relevantNodes.add(link.target);
                estadosRelacionados.add(link.target);
                filteredLinks.push(link);
            }
        });

        const filteredNodes = sankeyData.nodes
            .filter(node => relevantNodes.has(node.name))
            .map(node => ({
                ...node,
                itemStyle: {
                    color: categoryIngredients.has(node.name)
                        ? SankeyConfig.defaultColors.categoryColors[category]
                        : platillosRelacionados.has(node.name)
                            ? SankeyConfig.defaultColors.platillos
                            : SankeyConfig.defaultColors.estados,
                    opacity: 1
                }
            }));

        return {
            nodes: filteredNodes,
            links: filteredLinks
        };
    },

    filterByIngredient: function(sankeyData, ingrediente) {
        this.currentFilter = ingrediente;
        
        const relevantNodes = new Set([ingrediente]);
        const platillosRelacionados = new Set();
        const estadosRelacionados = new Set();
        const filteredLinks = [];
    
        sankeyData.links.forEach(link => {
            if (link.source === ingrediente) {
                relevantNodes.add(link.target);
                platillosRelacionados.add(link.target);
                filteredLinks.push(link);
            }
        });
    
        sankeyData.links.forEach(link => {
            if (platillosRelacionados.has(link.source)) {
                relevantNodes.add(link.target);
                estadosRelacionados.add(link.target);
                filteredLinks.push(link);
            }
        });
    
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
                value: 1000
            }));
    
        const adjustedLinks = filteredLinks.map(link => ({
            ...link,
            value: 100,
            lineStyle: {
                color: link.lineStyle.color,
                opacity: 0.7,
                width: 5
            }
        }));
    
        return {
            nodes: filteredNodes,
            links: adjustedLinks
        };
    },

    resetVisualization: function(sankeyData) {
        this.currentFilter = null;
        this.currentCategory = null;
    
        const connectionCount = {};
        sankeyData.links.forEach(link => {
            connectionCount[link.source] = (connectionCount[link.source] || 0) + link.value;
            connectionCount[link.target] = (connectionCount[link.target] || 0) + link.value;
        });
    
        const orderedNodes = sankeyData.nodes.sort((a, b) => {
            if (a.depth !== b.depth) return a.depth - b.depth;
            if (a.depth === 2) {
                return a.name.localeCompare(b.name);
            }
            return (connectionCount[b.name] || 0) - (connectionCount[a.name] || 0);
        }).map(node => ({
            ...node,
            itemStyle: {
                color: node.category === 'ingrediente'
                    ? SankeyConfig.getIngredientColor(node.name)
                    : node.category === 'estado'
                        ? SankeyConfig.defaultColors.estados
                        : SankeyConfig.defaultColors.platillos,
                opacity: 1
            },
            label: {
                show: true,
                position: 'right',
                fontSize: 10,
                color: '#333'
            }
        }));
    
        return {
            nodes: orderedNodes,
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
        if (this.currentCategory) {
            return this.filterByCategory(sankeyData, this.currentCategory);
        }
        if (this.currentFilter) {
            return this.filterByIngredient(sankeyData, this.currentFilter);
        }
        return this.resetVisualization(sankeyData);
    }
};