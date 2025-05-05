class DataProcessorD3 {
    constructor() {
        this.currentFilter = null;
        this.colors = {
            ingredientes: {
                'MAíZ': '#F49A3F',
                'FRIJOL': '#2B6867',
                'CHILE': '#F5584A',
                'CALABAZA': '#F5A6CE',
                'CACAO': '#71C2F5',
                'default': '#98AFC7'
            },
            destinos: '#2e83bf',
            culturas: '#013971',
            inactive: '#CCCCCC'
        };
    }

    csvToArray(str, delimiter = "|") {
        const headers = str.slice(0, str.indexOf("\n")).split(delimiter);
        const rows = str.slice(str.indexOf("\n") + 1).split("\n");
        
        return rows
            .filter(row => row.trim() !== '')
            .map(row => {
                const values = row.split(delimiter);
                return headers.reduce((object, header, index) => {
                    object[header.trim()] = values[index] ? values[index].trim() : '';
                    return object;
                }, {});
            });
    }

    processDataForSankey(csvText) {
        const data = this.csvToArray(csvText);
        
        console.log("Total rows parsed:", data.length);
        
        if (data.length === 0) {
            console.error("No data to process");
            return { nodes: [], links: [] };
        }
        
        const nodeMap = new Map();
        const links = [];
        
        // Filtrar solo datos del México Prehispánico
        const filteredData = data.filter(row => 
            row.Epoca === 'México Prehispánico (Antes de 1521)'
        );
    
        console.log("Filtered data (México Prehispánico):", filteredData.length);
        
        // Mostrar algunos ejemplos de los datos filtrados
        console.log("Sample filtered data:", filteredData.slice(0, 3));
    
        filteredData.forEach(row => {
            const ingrediente = row.Ingrediente;
            const destino = row.Destino;
            const cultura = row["Cultura prehispánica"];
            const platillos = parseInt(row.Platillos) || 1;
    
            if (!ingrediente || !destino || !cultura) {
                console.log('Skipping row with missing data:', row);
                return;
            }
    
            // Crear nodos si no existen
            if (!nodeMap.has(ingrediente)) {
                nodeMap.set(ingrediente, {
                    id: ingrediente,
                    name: ingrediente,
                    type: 'ingrediente',
                    value: 0
                });
            }
            
            if (!nodeMap.has(destino)) {
                nodeMap.set(destino, {
                    id: destino,
                    name: destino,
                    type: 'destino',
                    value: 0
                });
            }
            
            if (!nodeMap.has(cultura)) {
                nodeMap.set(cultura, {
                    id: cultura,
                    name: cultura,
                    type: 'cultura',
                    value: 0
                });
            }
    
            // Actualizar valores
            nodeMap.get(ingrediente).value += platillos;
            nodeMap.get(destino).value += platillos;
            nodeMap.get(cultura).value += platillos;
    
            // Crear enlaces
            links.push({
                source: ingrediente,
                target: destino,
                value: platillos
            });
    
            links.push({
                source: destino,
                target: cultura,
                value: platillos
            });
        });
    
        console.log("Total nodes created:", nodeMap.size);
        console.log("Total links created:", links.length);
        console.log("Sample link:", links[0]);
        
        return { 
            nodes: Array.from(nodeMap.values()), 
            links: links 
        };
    }
    
    getNodeColor(node) {
        if (node.type === 'ingrediente') {
            for (let key in this.colors.ingredientes) {
                if (node.name.includes(key)) {
                    return this.colors.ingredientes[key];
                }
            }
            return this.colors.ingredientes.default;
        } else if (node.type === 'destino') {
            return this.colors.destinos;
        } else if (node.type === 'cultura') {
            return this.colors.culturas;
        }
        return this.colors.inactive;
    }
    
    getLinkColor(link) {
        const source = typeof link.source === 'object' ? link.source : { name: link.source, type: 'ingrediente' };
        return this.getNodeColor(source);
    }
}

window.DataProcessorD3 = new DataProcessorD3();