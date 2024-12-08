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
        // Calcular el total de conexiones para cada nodo
        const connectionCount = {};
        sankeyData.links.forEach(link => {
            connectionCount[link.source] = (connectionCount[link.source] || 0) + link.value;
            connectionCount[link.target] = (connectionCount[link.target] || 0) + link.value;
        });
    
        // Preparar los nodos con sus valores ajustados
        const nodes = sankeyData.nodes.map(node => ({
            ...node,
            value: connectionCount[node.name] || 0
        }));
    
        // Ordenar los nodos por categoría y conexiones
        nodes.sort((a, b) => {
            // Primero por categoría
            if (a.category !== b.category) {
                const categoryOrder = { ingrediente: 0, platillo: 1, estado: 2 };
                return categoryOrder[a.category] - categoryOrder[b.category];
            }
            // Dentro de cada categoría, por número de conexiones (descendente)
            return b.value - a.value;
        });
        sankeyData.links.sort((a, b) => b.value - a.value);
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
                left: '5%',
                right: '15%',  // Aumentado para dar más espacio a las etiquetas
                top: '5%',
                bottom: '5%',
                nodeWidth: 20,
                nodeAlign: 'justify',  // Alinea los nodos de manera uniforme
                nodeSort: 'desc',      // Ordena los nodos de forma descendente
                layoutIterations: 100, // Mayor número de iteraciones para mejor ordenamiento
                nodePadding: 40,   // Aumentado el espacio entre nodos
                // Configuración adicional que puede afectar el ordenamiento visual
                orient: 'horizontal', // Dirección del diagrama
                scaling: 0.95,        // Factor de escala para el tamaño de los nodos
                emphasis: {
                    focus: 'adjacency'
                },
                data: nodes,
                links: sankeyData.links,
                orient: 'horizontal',
                label: {
                    position: 'right',
                    fontSize: 12,    // Aumentado el tamaño de fuente
                    color: '#333',
                    distance: 10,    // Distancia de la etiqueta al nodo
                    align: 'left',   // Alineación del texto
                    verticalAlign: 'middle',
                    formatter: '{b}' // Muestra solo el nombre
                },
                lineStyle: {
                    color: 'source',
                    curveness: 0.5,
                    opacity: 0.7
                },
                layoutIterations: 100,
                nodeAlign: 'justify',
                nodeSort: 'desc',
                scaling: 0.95
            }]
        };
    }
};