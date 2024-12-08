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
        // Calcular el total de conexiones para cada nodo (entrada + salida)
        const connectionCount = {};
        sankeyData.links.forEach(link => {
            connectionCount[link.source] = (connectionCount[link.source] || 0) + link.value;
            connectionCount[link.target] = (connectionCount[link.target] || 0) + link.value;
        });
    
        // Ordenar los nodos por categoría y número de conexiones
        const sortedNodes = sankeyData.nodes.map(node => ({
            ...node,
            value: connectionCount[node.name] || 0
        }));
    
        // Ordenar de forma descendente por número de conexiones dentro de cada categoría
        const orderedNodes = sortedNodes.sort((a, b) => {
            // Primero ordenar por categoría
            if (a.category !== b.category) {
                const categoryOrder = { ingrediente: 0, platillo: 1, estado: 2 };
                return categoryOrder[a.category] - categoryOrder[b.category];
            }
            // Dentro de la misma categoría, ordenar por número de conexiones (descendente)
            return b.value - a.value;
        });
    
        return {
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
                left: '10%',
                right: '10%',
                top: '5%',
                bottom: '5%',
                emphasis: {
                    focus: 'adjacency'
                },
                data: orderedNodes,
                links: sankeyData.links,
                orient: 'horizontal',
                label: {
                    position: 'right',
                    fontSize: 10,
                    color: '#333'
                },
                lineStyle: {
                    color: 'source',
                    curveness: 0.5,
                    opacity: 0.7
                },
                layoutIterations: 100,
                nodeAlign: 'left',
                nodeSort: 'desc' // Esto asegura que los nodos se ordenen de mayor a menor
            }]
        };
    }
};