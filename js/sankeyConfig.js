const SankeyConfig = {
    defaultColors: {
        // Category colors (pastel)
        categoryColors: {
            'Frutas': '#F5D2A6',          // Rosa mexicano suave
            'Base de la cocina mexicana': '#F49A3F',  // Verde-azul mexicano
            'Hierbas y especias': '#F58789',         // Azul mexicano profundo
            'Endulzantes y semillas': '#71C2F5',     // Terracota suave
            'Verduras': '#F5A6CE',        // Verde jade mexicano
            'Insectos': '#F5584A'         // Púrpura mexicano suave
        },

        // Colores para elementos principales
            'estados': '#2B6867',      // Verde jade profundo
            'platillos': '#2e83bf',    // Rosa mexicano oscuro
            'inactive': '#D92344'      // Gris medio suave
    },

    getIngredientColor: function(ingrediente, category = null) {
        if (category && this.defaultColors.categoryColors[category]) {
            return this.defaultColors.categoryColors[category];
        }
        return this.defaultColors.platillos;
    },

    createSankeyOption: function(sankeyData, tooltipData = []) {
        sankeyData.nodes = sankeyData.nodes.map(node => ({
            ...node,
            depth: node.category === 'ingrediente' ? 0 : 
                   node.category === 'platillo' ? 1 : 2,
            tooltip: tooltipData.find(t => t.ingredient === node.name)
        }));
    
        const connectionCount = {};
        sankeyData.links.forEach(link => {
            connectionCount[link.source] = (connectionCount[link.source] || 0) + link.value;
            connectionCount[link.target] = (connectionCount[link.target] || 0) + link.value;
        });
    
        const nodes = sankeyData.nodes.sort((a, b) => {
            if (a.depth !== b.depth) return a.depth - b.depth;
            if (a.depth === 2) return a.name.localeCompare(b.name);
            return (connectionCount[b.name] || 0) - (connectionCount[a.name] || 0);
        }).map(node => ({
            ...node,
            value: connectionCount[node.name] || 0
        }));
    
        const links = sankeyData.links.filter(link => {
            const sourceNode = nodes.find(n => n.name === link.source);
            const targetNode = nodes.find(n => n.name === link.target);
            return sourceNode && targetNode && sourceNode.depth < targetNode.depth;
        }).sort((a, b) => b.value - a.value);
    
        return {
            animation: true,
            animationDuration: 1000,
            animationEasing: 'cubicOut',
            animationDelay: function(idx) {
                return idx * 50;
            },
            animationDurationUpdate: 750,
            animationEasingUpdate: 'cubicInOut',
        
            // Ajuste del grid para mejor uso del espacio
            grid: {
                left: '5%',
                right: '5%',    // Aumentado para dar más espacio a etiquetas de estados
                top: '2%',      // Subido para evitar corte inferior
                bottom: '20%',   // Aumentado para evitar corte inferior
                containLabel: false
            },
        
            title: [
                {
                    text: 'Ingredientes',
                    left: '4.5%',
                    top: '2%',    // Ajustado para alinearse con el nuevo espacio superior
                    textStyle: {
                        fontSize: 16,
                        fontFamily: 'Libre Baskerville',
                        color: '#013971',
                        textShadowBlur: 2,
                        textShadowColor: 'rgba(0, 0, 0, 0.2)',
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    }
                },
                {
                    text: 'Platillos',
                    left: '43.5%',
                    top: '2%',
                    textStyle: {
                        fontSize: 16,
                        fontFamily: 'Libre Baskerville',
                        color: '#013971',
                        textShadowBlur: 2,
                        textShadowColor: 'rgba(0, 0, 0, 0.2)',
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    }
                },
                {
                    text: 'Estados',
                    left: '83%',
                    top: '2%',
                    textStyle: {
                        fontSize: 16,
                        fontFamily: 'Libre Baskerville',
                        color: '#013971',
                        textShadowBlur: 2,
                        textShadowColor: 'rgba(0, 0, 0, 0.2)',
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    }
                }
            ],
        
            // Tooltip mejorado
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#013971',
                borderWidth: 1,
                padding: 15,
                formatter: function(params) {
                    if (params.dataType === 'node' && params.data.tooltip) {
                        return `<div style="
                            padding: 12px;
                            background: linear-gradient(to bottom, rgba(255,255,255,0.98), rgba(240,240,255,0.98));
                            border-radius: 4px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        ">
                            <h4 style="
                                margin: 0 0 8px;
                                color: #013971;
                                border-bottom: 1px solid #eee;
                                padding-bottom: 5px;
                                font-family: 'Libre Baskerville';
                            ">${params.data.name}</h4>
                            <p style="
                                margin: 4px 0;
                                color: #333;
                            ">${params.data.tooltip.info}</p>
                            <p style="
                                margin: 4px 0;
                                font-style: italic;
                                color: #666;
                            ">${params.data.tooltip.preparation}</p>
                        </div>`;
                    }
                    return params.dataType === 'node' ? params.data.name : '';
                }
            },
        
            // Series principal con mejoras visuales
            series: [{
                type: 'sankey',
                left: '5%',      // Alineado con el grid
                right: '15%',    // Aumentado para etiquetas de estados
                top: '6%',      // Ajustado para dar más espacio arriba
                bottom: '25%',    // Ajustado para evitar corte inferior
                emphasis: {
                    focus: 'adjacency',
                    label: {
                        fontSize: 15,
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        padding: [4, 8],
                        borderRadius: 3
                    },
                    itemStyle: {
                        borderWidth: 1,
                        borderColor: '#fff',
                        shadowBlur: 10,
                        shadowColor: 'rgba(0,0,0,0.2)'
                    }
                },
                layoutIterations: 64,
                nodeWidth: 20,
                nodePadding: 20,  // Reducido para mejor distribución vertical
                data: nodes,
                links: links,
                orient: 'horizontal',
                
                label: {
                    position: function(params) {
                        // Ajuste de posición para cada columna
                        if (params.dataType === 'node') {
                            if (params.data.depth === 0) return 'left';
                            if (params.data.depth === 2) return { position: 'right', distance: 15 }; // Más espacio para estados
                            return 'right';
                        }
                    },
                    fontSize: 12,
                    color: '#013971',
                    distance: 20,
                    align: function(params) {
                        // Alineación específica para cada columna
                        if (params.dataType === 'node') {
                            if (params.data.depth === 0) return 'right';
                            return 'left';
                        }
                    },
                    verticalAlign: 'middle',
                    formatter: '{b}',
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    padding: [3, 6],
                    borderRadius: 2
                },
        
                levels: [
                    {
                        depth: 0,
                        itemStyle: {
                            color: d => this.getIngredientColor(d.name, d.category),
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.3)',
                            shadowBlur: 5,
                            shadowColor: 'rgba(0,0,0,0.2)'
                        }
                    },
                    {
                        depth: 1,
                        itemStyle: {
                            color: this.defaultColors.platillos,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.3)',
                            shadowBlur: 5,
                            shadowColor: 'rgba(0,0,0,0.2)'
                        }
                    },
                    {
                        depth: 2,
                        itemStyle: {
                            color: this.defaultColors.estados,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.3)',
                            shadowBlur: 5,
                            shadowColor: 'rgba(0,0,0,0.2)'
                        },
                        label: {
                            distance: 20  // Más espacio para etiquetas de estados
                        }
                    }
                ],
        
                lineStyle: {
                    color: 'source',
                    curveness: 0.7,
                    opacity: 0.5,
                    shadowBlur: 3,
                    shadowColor: 'rgba(0,0,0,0.2)',
                    gradientColor: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 1,
                        y2: 0,
                        colorStops: [{
                            offset: 0,
                            color: 'source'
                        }, {
                            offset: 1,
                            color: 'target'
                        }]
                    }
                }
            }]
        };
    }
};