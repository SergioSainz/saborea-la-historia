const SankeyConfig = {
    defaultColors: {
        // Granos y semillas (tonos amarillos y cafés claros)
        'maíz': '#FFE5B4',     // Amarillo pastel
        'amaranto': '#FFE4C4',  // Beige claro
        'chía': '#F5DEB3',     // Beige

        // Chiles y pimientos (tonos rojos y naranjas suaves)
        'chile': '#FFB3B3',    // Rojo pastel
        'chile habanero': '#FFCCCC', // Rosa claro

        // Hierbas y verduras (tonos verdes suaves)
        'epazote': '#B3E6B3',  // Verde menta claro
        'papaloquelite': '#98FB98', // Verde pastel
        'hoja santa': '#C1FFC1', // Verde agua
        'chaya': '#E0FFE0',    // Verde muy claro
        'huauzontle': '#CCFFCC', // Verde pastel claro
        'verdolagas': '#D1FFD1', // Verde suave
        'romeritos': '#B4EEB4', // Verde salvia
        'quintoniles': '#C1FFC1', // Verde claro

        // Flores (tonos pastel vibrantes)
        'flor de calabaza': '#FFE5CC', // Naranja pastel
        'flor de colorín': '#FFB3E6', // Rosa pastel

        // Cactáceas y agaves (verdes azulados)
        'nopal': '#B3E6CC',    // Verde azulado claro
        'maguey': '#B3E6D9',   // Verde menta

        // Frutas y vegetales (varios tonos pastel)
        'jitomate': '#FFB3B3', // Rojo suave
        'calabaza': '#FFE5CC', // Naranja claro
        'aguacate': '#C1E6C1', // Verde suave
        'camote': '#FFD9CC',   // Naranja rosado
        'jicama': '#F0FFF0',   // Blanco verdoso
        'chilacayote': '#E6FFE6', // Verde muy claro
        
        // Frutos exóticos (tonos cálidos suaves)
        'tejocote': '#FFD9B3', // Durazno claro
        'capulín': '#FFB3D9',  // Rosa claro
        'nanche': '#FFE5B3',   // Amarillo durazno

        // Frutos tropicales (tonos vibrantes suaves)
        'guanábana': '#E6FFE6', // Verde blanquecino
        'papaya': '#FFE5CC',   // Naranja suave
        'anona': '#FFE5D9',    // Rosa durazno
        'pitahaya': '#FFB3D9', // Rosa claro
        'zapote': '#FFD9CC',   // Rosa naranja
        'frijol': 'rgba(181, 67, 34, 0.52)',
        'pepitas': '#F5DEB3',
        'huitlacoche':'#a5a5a5',
        // Otros ingredientes
        'cacao': '#E6CCCC',    // Café rosado claro
        'vainilla': '#FFF0E6', // Crema
        'achiote': '#FFD9B3',  // Naranja claro

        // Colores por defecto para categorías
        'estados': 'rgba(181, 67, 34, 0.52)',  // Lavanda muy claro
        'platillos': '#629adf', // Azul muy claro
        'inactive': '#F5F5F5'  // Gris muy claro
    },

    getIngredientColor: function(ingrediente) {
        const nombre = ingrediente.toLowerCase();
        // Buscar coincidencia exacta primero
        if (this.defaultColors[nombre]) {
            return this.defaultColors[nombre];
        }
        // Si no hay coincidencia exacta, buscar coincidencia parcial
        for (let key in this.defaultColors) {
            if (nombre.includes(key)) {
                return this.defaultColors[key];
            }
        }
        return this.defaultColors.platillos;
    },
    createSankeyOption: function(sankeyData) {
        // Asignar niveles explícitos a los nodos
        sankeyData.nodes = sankeyData.nodes.map(node => ({
            ...node,
            depth: node.category === 'ingrediente' ? 0 : 
                   node.category === 'platillo' ? 1 : 2
        }));
    
        // Calcular conexiones
        const connectionCount = {};
        sankeyData.links.forEach(link => {
            connectionCount[link.source] = (connectionCount[link.source] || 0) + link.value;
            connectionCount[link.target] = (connectionCount[link.target] || 0) + link.value;
        });
    
        // Ordenar nodos por categoría y conexiones
        const nodes = sankeyData.nodes.sort((a, b) => {
            // Primero ordenar por profundidad (categoría)
            if (a.depth !== b.depth) return a.depth - b.depth;
            
            // Si son estados (depth 2), ordenar alfabéticamente
            if (a.depth === 2) {
                return a.name.localeCompare(b.name);
            }
            
            // Para ingredientes y platillos, mantener el orden por número de conexiones
            return (connectionCount[b.name] || 0) - (connectionCount[a.name] || 0);
        }).map(node => ({
            ...node,
            value: connectionCount[node.name] || 0
        }));
    
        // Validar y limpiar enlaces
        const links = sankeyData.links.filter(link => {
            const sourceNode = nodes.find(n => n.name === link.source);
            const targetNode = nodes.find(n => n.name === link.target);
            return sourceNode && targetNode && sourceNode.depth < targetNode.depth;
        }).sort((a, b) => b.value - a.value);
    
        return {
            title: [
                {
                    text: 'Ingredientes',
                    left: '4.5%',
                    top: '1%',
                    textStyle: {
                        fontSize: 16,
                        fontFamily: 'Libre Baskerville',
                        color: '#013971'
                    }
                },
                {
                    text: 'Platillos',
                    left: '43.5%',
                    top: '1%',
                    textStyle: {
                        fontSize: 16,
                        fontFamily: 'Libre Baskerville',
                        color: '#013971'
                    }
                },
                {
                    text: 'Estados',
                    left: '83%',
                    top: '1%',
                    textStyle: {
                        fontSize: 16,
                        fontFamily: 'Libre Baskerville',
                        color: '#013971'
                    }
                }
            ],
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove',
                formatter: params => {
                    const value = connectionCount[params.data.name] || 0;
                    return `${params.data.name}: ${value} conexiones`;
                }
            },
            series: [{
                type: 'sankey',
                left: '5%',
                right: '15%',
                top: '5%',
                bottom: '5%',
                nodeWidth: 20,
                nodePadding: 40,
                layoutIterations: 100,
                emphasis: {
                    focus: 'adjacency'
                },
                data: nodes,
                links: links,
                orient: 'horizontal',
                label: {
                    position: 'right',
                    fontSize: 10,
                    color: '#013971',
                    distance: 10,
                    align: 'left',
                    verticalAlign: 'middle',
                    formatter: '{b}'
                },
                levels: [
                    {
                        depth: 0,
                        itemStyle: {
                            color: d => SankeyConfig.getIngredientColor(d.name)
                        }
                    },
                    {
                        depth: 1,
                        itemStyle: {
                            color: SankeyConfig.defaultColors.platillos
                        }
                    },
                    {
                        depth: 2,
                        itemStyle: {
                            color: SankeyConfig.defaultColors.estados
                        }
                    }
                ],
                lineStyle: {
                    color: 'source',
                    curveness: 0.5,
                    opacity: 0.7
                }
            }]
        };
    }
};