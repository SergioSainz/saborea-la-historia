// filteredConnectionMap.js

class FilteredConnectionMap {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.data = [];
        this.connections = [];
        this.markers = [];
        this.currentCategory = null;
        this.animationFrameId = null;
        this.startTime = Date.now();
    }

    async initialize() {
        // Crear contenedor del mapa si no existe
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }

        // Inicializar el mapa con vista global
        this.map = new maplibregl.Map({
            container: this.containerId,
            style: 'https://tiles.stadiamaps.com/styles/stamen_watercolor.json?api_key=bb35bcf5-8067-47a7-a4b2-5c0fb5ccdb42',
            center: [-40, 30],
            zoom: 1.8,
            minZoom: 1,
            maxZoom: 8
        });

        // Cargar datos CSV
        await this.loadData();

        // Configurar el mapa cuando se cargue
        this.map.on('load', () => {
            this.setupLayers();
            this.setupControls();
            
            // Mostrar primera categoría por defecto
            const categories = this.getCategories();
            if (categories.length > 0) {
                this.filterByCategory(categories[0]);
            }
        });

        return this;
    }

    async loadData() {
        try {
            const response = await fetch('json/mapa.csv');
            const text = await response.text();
            
            // Parsear CSV
            const lines = text.trim().split('\n');
            const headers = lines[0].split('|');
            
            this.data = lines.slice(1).map(line => {
                const values = line.split('|');
                return {
                    categoria: values[0],
                    origen: values[1],
                    latitud_origen: parseFloat(values[2]),
                    longitud_origen: parseFloat(values[3]),
                    destino: values[4],
                    latitud_destino: parseFloat(values[5]),
                    longitud_destino: parseFloat(values[6]),
                    ingredientes: parseInt(values[7])
                };
            });
        } catch (error) {
            console.error('Error loading CSV data:', error);
        }
    }

    getCategories() {
        return [...new Set(this.data.map(d => d.categoria))];
    }

    setupLayers() {
        // Fuente para las conexiones
        this.map.addSource('connections', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': []
            }
        });

        // Capa de líneas
        this.map.addLayer({
            'id': 'connection-lines',
            'type': 'line',
            'source': 'connections',
            'paint': {
                'line-color': [
                    'match',
                    ['get', 'categoria'],
                    'Verduras y Hierbas', '#8B7355',
                    'Condimentos, Aceites y Endulzantes', '#B8860B',
                    'Carnes y Mariscos', '#CD853F',
                    'Lácteos y Huevos', '#D2B48C',
                    '#A0522D'
                ],
                'line-width': [
                    'interpolate',
                    ['linear'],
                    ['get', 'ingredientes'],
                    1, 2,
                    20, 6
                ],
                'line-opacity': 0.8
            }
        });

        // Fuente para puntos animados
        this.map.addSource('animated-dots', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': []
            }
        });

        // Capa de puntos animados
        this.map.addLayer({
            'id': 'animated-dots',
            'type': 'circle',
            'source': 'animated-dots',
            'paint': {
                'circle-radius': 6,
                'circle-color': '#8B4513', /* Marrón (SaddleBrown) */
                'circle-opacity': 0.9,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#DAA520' /* Dorado fuerte (GoldenRod) */
            }
        });
        
        // Fuente para los estados de México (mapa coroplético)
        this.map.addSource('mexico-states', {
            'type': 'geojson',
            'data': '/json/estados-poligonos.geojson'
        });
        
        // Agregar una capa de contorno muy suave para los estados
        this.map.addLayer({
            'id': 'mexico-states-outline',
            'type': 'line',
            'source': 'mexico-states',
            'layout': {},
            'paint': {
                'line-color': 'rgba(255, 255, 255, 0.2)',
                'line-width': 0.5,
                'line-opacity': 0.4,
                // Suavizar los bordes y reducir el detalle
                'line-blur': 3,
                // Simplificar la geometría para reducir detalles
                'line-simplify': 0.8
            }
        });
        
        // Capa para el relleno coroplético de los estados
        this.map.addLayer({
            'id': 'mexico-states-fill',
            'type': 'fill',
            'source': 'mexico-states',
            'layout': {},
            'paint': {
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'ingredientes_count'],
                    0, 'rgba(255, 255, 255, 0.1)',
                    1, 'rgba(135, 206, 235, 0.5)',  /* Azul cielo (SkyBlue) */
                    5, 'rgba(70, 130, 180, 0.6)',   /* Azul acero (SteelBlue) */
                    10, 'rgba(160, 82, 45, 0.65)',  /* Café (Sienna) */
                    20, 'rgba(178, 34, 34, 0.75)',  /* Rojo ladrillo medio (Firebrick) */
                    50, 'rgba(139, 0, 0, 0.85)'     /* Rojo ladrillo oscuro (DarkRed) */
                ],
                'fill-opacity': 0.5
            },
            'filter': ['==', 'ingredientes_count', 0] // Inicialmente no mostrar ninguno
        });
    }

    setupControls() {
        // Configurar el select de categorías
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            const categories = this.getCategories();
            categoryFilter.innerHTML = categories.map(cat => 
                `<option value="${cat}">${cat}</option>`
            ).join('');
            
            categoryFilter.addEventListener('change', (e) => {
                this.filterByCategory(e.target.value);
            });
        }
        
        // Se ha eliminado el control de opacidad
        
        // Configurar tutorial de primera vez
        this.setupTutorial();
    }

    filterByCategory(category) {
        this.currentCategory = category;
        
        // Filtrar datos por categoría
        const filteredData = this.data.filter(d => d.categoria === category);
        
        // Crear conexiones con curva
        this.connections = filteredData.map(d => {
            const midLng = (d.longitud_origen + d.longitud_destino) / 2;
            const midLat = (d.latitud_origen + d.latitud_destino) / 2;
            
            const dx = d.longitud_destino - d.longitud_origen;
            const dy = d.latitud_destino - d.latitud_origen;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const curveFactor = Math.min(distance * 0.2, 10);
            const perpX = -dy / distance * curveFactor;
            const perpY = dx / distance * curveFactor;
            
            const controlPoint = [midLng + perpX, midLat + perpY];
            
            const arcPoints = [];
            const numSteps = 20;
            
            for (let i = 0; i <= numSteps; i++) {
                const t = i / numSteps;
                const lng = (1 - t) * (1 - t) * d.longitud_origen + 
                           2 * (1 - t) * t * controlPoint[0] + 
                           t * t * d.longitud_destino;
                const lat = (1 - t) * (1 - t) * d.latitud_origen + 
                           2 * (1 - t) * t * controlPoint[1] + 
                           t * t * d.latitud_destino;
                arcPoints.push([lng, lat]);
            }
            
            return {
                ...d,
                coordinates: arcPoints
            };
        });

        // Actualizar visualización
        this.updateConnections();
        this.updateNodes(filteredData);
        this.updateTopRoutes(filteredData);
        this.startAnimation();
    }

    updateConnections() {
        const features = this.connections.map(conn => ({
            'type': 'Feature',
            'properties': {
                'categoria': conn.categoria,
                'ingredientes': conn.ingredientes
            },
            'geometry': {
                'type': 'LineString',
                'coordinates': conn.coordinates
            }
        }));

        this.map.getSource('connections').setData({
            'type': 'FeatureCollection',
            'features': features
        });
    }

    updateNodes(data) {
        // Limpiar marcadores existentes
        this.markers.forEach(marker => marker.remove());
        this.markers = [];

        // Notas curiosas por ubicación - época virreinal
        const notes = {
            'México': 'Capital del virreinato, mestizaje culinario',
            'España': 'Cerdo y especias transformaron la cocina',
            'China': 'Arroz llegó por el Galeón de Manila',
            'India': 'Canela y pimienta para nuevos guisos',
            'Italia': 'Pasta y quesos en conventos novohispanos',
            'CDMX': 'Mercados virreinales, sabores del mundo',
            'Puebla': 'Conventos crearon el mole poblano',
            'Veracruz': 'Primera puerta de sabores ultramarinos',
            'Oaxaca': 'Mezcal y chocolate en manos indígenas',
            'Michoacán': 'Dulces conventuales con frutos locales',
            'Jalisco': 'Tequila nació en haciendas virreinales',
            'Yucatán': 'Cochinita pibil fusionó dos mundos',
            'Francia': 'Repostería llegó con los Borbones',
            'Portugal': 'Dulces de yema en conventos mexicanos',
            'Filipinas': 'Coco y especias vía Acapulco',
            'Alemania': 'Cerveza llegó con colonos del siglo XVI',
            'Perú': 'Papa y quinoa en intercambio virreinal',
            'Cuba': 'Azúcar y ron transformaron bebidas',
            'Argentina': 'Carnes saladas para largos viajes',
            'Guatemala': 'Cacao criollo para chocolate real',
            'Holanda': 'Quesos llegaron con comerciantes',
            'Inglaterra': 'Té y galletas en casas virreinales',
            'Turquía': 'Café llegó por rutas mediterráneas',
            'Líbano': 'Tacos árabes nacieron del shawarma',
            'Grecia': 'Aceite de oliva en cocinas conventuales',
            'Japón': 'Sake llegó tardíamente por el Pacífico',
            'Brasil': 'Cachaça y frutas tropicales',
            'Chile': 'Vinos llegaron con misioneros',
            'Colombia': 'Café y cacao en rutas comerciales',
            'Egipto': 'Especias y técnicas de conservación'
        };
        
        // Lista de estados mexicanos para identificar destinos nacionales
        const estadosMexicanos = [
            'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 
            'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 
            'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 
            'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 
            'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas', 'CDMX',
            'Ciudad de México', 'Distrito Federal'
        ];

        // Contar ingredientes por ubicación
        const nodeCounts = {};
        const estadosData = {};
        const puntosDestino = [];
        
        // Preparamos una solicitud al mapa para obtener feature bajo un punto
        // Esto permitirá identificar en qué estado cae una coordenada
        const getEstadoPorCoordenada = async (longitud, latitud) => {
            try {
                // Usar el método queryRenderedFeatures para obtener los features en un punto
                const features = this.map.queryRenderedFeatures(
                    this.map.project([longitud, latitud]),
                    { layers: ['mexico-states-fill'] }
                );
                
                if (features && features.length > 0) {
                    return features[0].properties.nom_edo;
                }
                
                return null;
            } catch (error) {
                console.error('Error al identificar estado por coordenada:', error);
                return null;
            }
        };
        
        data.forEach(d => {
            // Procesar origen
            const origenKey = `${d.origen}_${d.latitud_origen}_${d.longitud_origen}`;
            if (!nodeCounts[origenKey]) {
                nodeCounts[origenKey] = {
                    name: d.origen,
                    coords: [d.longitud_origen, d.latitud_origen],
                    ingredientes: 0,
                    note: notes[d.origen] || 'Puerto comercial del virreinato',
                    esMexicano: estadosMexicanos.includes(d.origen)
                };
            }
            nodeCounts[origenKey].ingredientes += d.ingredientes;
            
            // Procesar destino
            const destinoKey = `${d.destino}_${d.latitud_destino}_${d.longitud_destino}`;
            if (!nodeCounts[destinoKey]) {
                nodeCounts[destinoKey] = {
                    name: d.destino,
                    coords: [d.longitud_destino, d.latitud_destino],
                    ingredientes: 0,
                    note: notes[d.destino] || 'Destino de rutas virreinales',
                    esMexicano: estadosMexicanos.includes(d.destino)
                };
            }
            nodeCounts[destinoKey].ingredientes += d.ingredientes;
            
            // Si es un estado mexicano, actualizar datos para el mapa coroplético
            if (estadosMexicanos.includes(d.destino)) {
                if (!estadosData[d.destino]) {
                    estadosData[d.destino] = 0;
                }
                estadosData[d.destino] += d.ingredientes;
            }
            
            // Guardar todos los puntos de destino para determinar en qué estado caen
            puntosDestino.push({
                coords: [d.longitud_destino, d.latitud_destino],
                ingredientes: d.ingredientes,
                nombre: d.destino
            });
        });
        
        // Si el mapa ya está cargado, procesamos los puntos para asignarlos a estados
        if (this.map.loaded()) {
            // Primero actualizamos con los estados explícitos
            this.actualizarMapaCoropletico(estadosData);
            
            // Luego, para cada punto, intentamos determinar en qué estado cae
            setTimeout(() => {
                const estadosDataActualizado = {...estadosData};
                
                puntosDestino.forEach(punto => {
                    // Verificar si la coordenada cae dentro de algún polígono de estado
                    const features = this.map.queryRenderedFeatures(
                        this.map.project(punto.coords),
                        { layers: ['mexico-states-fill'] }
                    );
                    
                    if (features && features.length > 0) {
                        // Si encontramos un estado, sumamos los ingredientes a ese estado
                        const estadoNombre = features[0].properties.nom_edo;
                        if (!estadosDataActualizado[estadoNombre]) {
                            estadosDataActualizado[estadoNombre] = 0;
                        }
                        estadosDataActualizado[estadoNombre] += punto.ingredientes;
                        console.log(`Punto ${punto.nombre} cae en estado ${estadoNombre}, añadiendo ${punto.ingredientes} ingredientes`);
                    }
                });
                
                // Actualizamos de nuevo con los datos enriquecidos
                this.actualizarMapaCoropletico(estadosDataActualizado);
            }, 1000); // Esperamos a que el mapa termine de renderizar
        } else {
            // Si el mapa no está listo, solo actualizamos con los datos iniciales
            this.actualizarMapaCoropletico(estadosData);
        }

        // Crear marcadores solo para destinos internacionales
        Object.entries(nodeCounts).forEach(([key, node]) => {
            // Saltear estados mexicanos (se mostrarán como mapa coroplético)
            if (node.esMexicano) {
                return;
            }
            
            // Calcular tamaño
            const minSize = 20;
            const maxSize = 60;
            const scale = Math.min(node.ingredientes / 50, 1);
            const size = minSize + (maxSize - minSize) * scale;

            // Crear elemento HTML
            const el = document.createElement('div');
            el.className = 'node-marker';
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;
            el.style.borderRadius = '50%';
            el.style.backgroundColor = this.getCategoryColor(this.currentCategory);
            el.style.border = '3px solid white';
            el.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
            el.style.cursor = 'pointer';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.color = 'white';
            el.style.fontWeight = 'bold';
            el.style.fontSize = size > 40 ? '14px' : '12px';
            el.textContent = node.ingredientes;

            // Crear popup
            const popup = new maplibregl.Popup({
                offset: [0, -size/2],
                closeButton: false
            }).setHTML(`
                <div style="font-family: sans-serif; padding: 5px;">
                    <h4 style="margin: 0 0 5px 0; color: ${this.getCategoryColor(this.currentCategory)};">
                        ${node.name}
                    </h4>
                    <p style="margin: 0 0 5px 0; color: #8B6F47; font-style: italic;">
                        "${node.note}"
                    </p>
                    <p style="margin: 0; color: #666;">
                        ${node.ingredientes} ingredientes
                    </p>
                </div>
            `);

            // Crear marcador MapLibre
            const marker = new maplibregl.Marker({
                element: el,
                anchor: 'center'
            })
            .setLngLat(node.coords)
            .addTo(this.map);

            // Eventos hover
            el.addEventListener('mouseenter', () => {
                popup.addTo(this.map);
                popup.setLngLat(node.coords);
            });

            el.addEventListener('mouseleave', () => {
                popup.remove();
            });

            this.markers.push(marker);
        });
    }
    
    // Método para actualizar el mapa coroplético
    actualizarMapaCoropletico(estadosData) {
        // Obtener la fuente GeoJSON y actualizar las propiedades
        fetch('/json/estados-poligonos.geojson')
            .then(response => response.json())
            .then(geojson => {
                // Calcular el máximo de ingredientes para normalizar 
                const maxIngredientes = Object.values(estadosData).reduce((max, count) => 
                    Math.max(max, count), 0);
                
                console.log(`Máximo ingredientes: ${maxIngredientes}`);
                
                // Actualizar las propiedades con los conteos de ingredientes
                geojson.features.forEach(feature => {
                    // En este GeoJSON, la propiedad es "nom_edo" en lugar de "nombre"
                    const estadoNombre = feature.properties.nom_edo;
                    
                    // Asignar conteo de ingredientes
                    feature.properties.ingredientes_count = estadosData[estadoNombre] || 0;
                    
                    // Añadir valor normalizado para tooltip y estilizado
                    feature.properties.ingredientes_porcentaje = maxIngredientes > 0 
                        ? Math.round((feature.properties.ingredientes_count / maxIngredientes) * 100) 
                        : 0;
                });
                
                // Actualizar la fuente de datos
                this.map.getSource('mexico-states').setData(geojson);
                
                // Quitar el filtro para mostrar todos los estados
                this.map.setFilter('mexico-states-fill', null);
                this.map.setFilter('mexico-states-outline', null);
                
                // Añadir popups interactivos para los estados
                this.setupEstadosInteraction();
                
                // Mostrar leyenda con valores reales
                this.updateLegend(maxIngredientes);
            })
            .catch(error => {
                console.error('Error al actualizar mapa coroplético:', error);
            });
    }
    
    // Método para actualizar la leyenda del mapa con valores reales
    updateLegend(maxValue) {
        // Buscar elementos de la leyenda
        const legendItems = document.querySelectorAll('.legend-item-value');
        if (legendItems.length === 0) return;
        
        // Valores para las 4 categorías de la leyenda (5%, 20%, 40%, 80%)
        const threshold1 = Math.round(maxValue * 0.05);
        const threshold2 = Math.round(maxValue * 0.20);
        const threshold3 = Math.round(maxValue * 0.40);
        const threshold4 = Math.round(maxValue * 0.80);
        
        // Actualizar texto de los elementos
        legendItems[0].textContent = `1-${threshold1} ingredientes`;
        legendItems[1].textContent = `${threshold1+1}-${threshold2} ingredientes`;
        legendItems[2].textContent = `${threshold2+1}-${threshold3} ingredientes`;
        legendItems[3].textContent = `${threshold3+1}+ ingredientes`;
    }
    
    // Configurar interacciones para el mapa coroplético
    setupEstadosInteraction() {
        // Variable para mantener el popup y el ID del estado con hover
        let estadoPopup = null;
        let hoveredStateId = null;
        
        // Interacción al hacer hover sobre un estado
        this.map.on('mouseenter', 'mexico-states-fill', (e) => {
            this.map.getCanvas().style.cursor = 'pointer';
            
            // Obtener propiedades del estado
            const properties = e.features[0].properties;
            const estadoId = properties.cvegeo; // En este geojson usamos cvegeo como id
            const estadoNombre = properties.nom_edo; // Nombre del estado en el nuevo GeoJSON
            const ingredientesCount = properties.ingredientes_count || 0;
            const nota = this.getEstadoNota(estadoNombre);
            
            // Actualizar el estado hover para efectos visuales
            if (hoveredStateId) {
                this.map.setFeatureState(
                    { source: 'mexico-states', id: hoveredStateId },
                    { hover: false }
                );
            }
            hoveredStateId = estadoId;
            this.map.setFeatureState(
                { source: 'mexico-states', id: estadoId },
                { hover: true }
            );
            
            // Determinar color basado en la cantidad de ingredientes
            let colorClass = 'color-scale-0';
            if (ingredientesCount > 0) {
                if (ingredientesCount <= 5) colorClass = 'color-scale-1';
                else if (ingredientesCount <= 10) colorClass = 'color-scale-2';
                else if (ingredientesCount <= 20) colorClass = 'color-scale-3';
                else colorClass = 'color-scale-4';
            }
            
            // Crear contenido del popup con mejor formato
            const popupContent = `
                <div style="font-family: 'Cardo', serif; padding: 10px; max-width: 250px;">
                    <h4 style="margin: 0 0 8px 0; font-family: 'Libre Baskerville', serif; color: ${this.getCategoryColor(this.currentCategory)}; border-bottom: 2px solid rgba(113, 57, 1, 0.2); padding-bottom: 5px;">
                        ${estadoNombre}
                    </h4>
                    <p style="margin: 0 0 8px 0; color: #8B6F47; font-style: italic; font-size: 14px;">
                        "${nota}"
                    </p>
                    <div style="display: flex; align-items: center; margin-top: 10px;">
                        <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${this.getCategoryColor(this.currentCategory)}; margin-right: 8px;"></div>
                        <p style="margin: 0; color: #666; font-weight: bold;">
                            ${ingredientesCount} ingredientes
                        </p>
                    </div>
                    ${estadoNombre ? 
                        `<div style="margin-top: 8px; font-size: 13px; color: #666;">
                            <span style="font-style: italic;">Población adulta:</span> 
                            ${properties.pob18ymas?.toLocaleString()} habitantes
                        </div>` 
                        : ''}
                </div>
            `;
            
            // Calcular coordenadas para el popup usando el centro del evento
            // En este GeoJSON no hay centroides predefinidos, así que usamos el punto donde el mouse está
            const coordinates = e.lngLat;
            
            // Crear el popup y añadirlo al mapa
            estadoPopup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                maxWidth: '300px',
                className: 'custom-popup'
            })
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(this.map);
        });
        
        // Quitar el popup al salir del estado
        this.map.on('mouseleave', 'mexico-states-fill', () => {
            this.map.getCanvas().style.cursor = '';
            
            // Quitar estado hover
            if (hoveredStateId) {
                this.map.setFeatureState(
                    { source: 'mexico-states', id: hoveredStateId },
                    { hover: false }
                );
            }
            hoveredStateId = null;
            
            // Quitar popup
            if (estadoPopup) {
                estadoPopup.remove();
                estadoPopup = null;
            }
        });
        
        // Hacer zoom en el estado al hacer clic
        this.map.on('click', 'mexico-states-fill', (e) => {
            const properties = e.features[0].properties;
            const estadoNombre = properties.nom_edo;
            
            // Usar la ubicación del clic como centro
            this.map.flyTo({
                center: e.lngLat,
                zoom: 5.5,
                duration: 1000
            });
        });
    }
    
    // Obtener una nota para un estado mexicano
    getEstadoNota(estado) {
        const notasEstados = {
            'Aguascalientes': 'Tradicional por sus vinos y guisos de chile',
            'Baja California': 'Fusión contemporánea con tradición vitivinícola',
            'Baja California Sur': 'Cocina peninsular con influencia marina',
            'Campeche': 'Cocina costeña con influencia maya',
            'Chiapas': 'Rica tradición de maíz, chile y hierba santa',
            'Chihuahua': 'Carnes norteñas y quesos artesanales',
            'Coahuila': 'Cabritos, dulces de leche y vinos regionales',
            'Colima': 'Recetas con coco y pescados locales',
            'Durango': 'Caldillos de res y platillos de venado',
            'Guanajuato': 'Guisos mineros y dulces típicos',
            'Guerrero': 'Sabores intensos con pozole y pescado a la talla',
            'Hidalgo': 'Barbacoa y platillos prehispánicos',
            'Jalisco': 'Cuna de la birria, tequila y pozole rojo',
            'México': 'Corazón de la gastronomía nacional',
            'Michoacán': 'Carnitas, uchepos y atápakuas tradicionales',
            'Morelos': 'Cecina de Yecapixtla y moles regionales',
            'Nayarit': 'Pescados zarandeados y camarones en coco',
            'Nuevo León': 'Cabrito, machaca y carne asada',
            'Oaxaca': 'Siete moles, tlayudas y chapulines',
            'Puebla': 'Cuna del mole poblano y los chiles en nogada',
            'Querétaro': 'Enchiladas queretanas y nopales regionales',
            'Quintana Roo': 'Pescados caribeños con sazón maya',
            'San Luis Potosí': 'Enchiladas potosinas y zacahuil monumental',
            'Sinaloa': 'Chilorio, aguachile y mariscos frescos',
            'Sonora': 'Carne asada, machaca y tortillas sobaqueras',
            'Tabasco': 'Pejelagarto y chocolate de origen',
            'Tamaulipas': 'Mariscos, carne seca y cabrito al pastor',
            'Tlaxcala': 'Mixiotes y mole prieto tradicional',
            'Veracruz': 'Huachinango a la veracruzana y acamayas',
            'Yucatán': 'Cochinita pibil y recados yucatecos',
            'Zacatecas': 'Asado de boda y mezcal artesanal',
            'CDMX': 'Mercados virreinales, sabores del mundo',
            'Ciudad de México': 'Crisol de sabores de todo el país',
            'Distrito Federal': 'Centro histórico de la gastronomía mexicana'
        };
        
        return notasEstados[estado] || 'Destino de rutas virreinales';
    }

    updateTopRoutes(data) {
        // Contar por ruta
        const routeCounts = {};
        
        data.forEach(d => {
            const routeKey = `${d.origen} → ${d.destino}`;
            if (!routeCounts[routeKey]) {
                routeCounts[routeKey] = 0;
            }
            routeCounts[routeKey] += d.ingredientes;
        });

        // Top 5
        const topRoutes = Object.entries(routeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Actualizar HTML con animación
        const routesList = document.getElementById('routes-list');
        if (routesList) {
            // Primero hacer fade out
            routesList.style.opacity = '0';
            routesList.style.transition = 'opacity 0.3s ease-out';
            
            setTimeout(() => {
                // Luego actualizar contenido
                routesList.innerHTML = topRoutes.map(([route, count], index) => `
                    <div style="margin: 8px 0; padding: 12px; background: rgba(210, 180, 140, 0.2); 
                         border-radius: 8px; border: 1px solid rgba(113, 57, 1, 0.2);
                         opacity: 0; transform: translateY(10px);
                         animation: slideIn 0.4s ease forwards;
                         animation-delay: ${index * 0.1}s;">
                        <strong style="color: #713901; font-size: 14px;">
                            ${index + 1}. ${route}
                        </strong>
                        <div style="color: #8B6F47; font-size: 13px; margin-top: 4px;">
                            ${count} ingredientes compartidos
                        </div>
                    </div>
                `).join('');
                
                // Hacer fade in
                routesList.style.opacity = '1';
                routesList.style.transition = 'opacity 0.3s ease-in';
            }, 300);
        }
    }

    getCategoryColor(category) {
        const colors = {
            'Verduras y Hierbas': '#8B7355',
            'Condimentos, Aceites y Endulzantes': '#B8860B',
            'Carnes y Mariscos': '#CD853F',
            'Lácteos y Huevos': '#D2B48C'
        };
        return colors[category] || '#A0522D';
    }

    startAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.animate();
    }

    animate() {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - this.startTime) / 1000;

        const animatedFeatures = [];

        this.connections.forEach((connection, index) => {
            const duration = 5;
            const offset = (index * 0.5);
            const progress = ((elapsedTime + offset) % duration) / duration;

            const coords = connection.coordinates;
            const pointIndex = Math.floor(progress * (coords.length - 1));
            const segmentProgress = (progress * (coords.length - 1)) % 1;
            
            let lng, lat;
            
            if (pointIndex < coords.length - 1) {
                const p1 = coords[pointIndex];
                const p2 = coords[pointIndex + 1];
                lng = p1[0] + (p2[0] - p1[0]) * segmentProgress;
                lat = p1[1] + (p2[1] - p1[1]) * segmentProgress;
            } else {
                lng = coords[coords.length - 1][0];
                lat = coords[coords.length - 1][1];
            }

            animatedFeatures.push({
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [lng, lat]
                }
            });
        });

        this.map.getSource('animated-dots').setData({
            'type': 'FeatureCollection',
            'features': animatedFeatures
        });

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    setupTutorial() {
        // Crear el tutorial cuando el usuario pase el mouse por primera vez
        const mapContainer = document.getElementById(this.containerId);
        let tutorialShown = false;
        
        // Función para mostrar el tutorial
        const showTutorial = () => {
            if (tutorialShown) return;
            
            // Verificar si ya se mostró (solo para hover automático)
            if (localStorage.getItem('mapTutorialShown') && !window.forceShowTutorial) {
                return;
            }
            
            tutorialShown = true;
            window.forceShowTutorial = false;
            
            // Crear overlay
            const overlay = document.createElement('div');
            overlay.id = 'map-tutorial-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 9998;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            `;
            
            // Crear popup de tutorial
            const tutorial = document.createElement('div');
            tutorial.style.cssText = `
                background: #F6F0E4;
                border-radius: 16px;
                padding: 30px;
                max-width: 500px;
                position: relative;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.4s ease;
                border: 3px solid #713901;
            `;
            
            tutorial.innerHTML = `
                <div style="text-align: center;">
                    <img src="img/Xolin/cara-1.png" 
                         alt="Xolín" 
                         style="width: 120px; height: auto; margin-bottom: 20px;">
                    <h3 style="color: #713901; font-family: 'Libre Baskerville', serif; margin-bottom: 20px;">
                        ¡Hola! Soy Xolín y te mostraré cómo explorar este mapa
                    </h3>
                    <div style="text-align: left; color: #444; font-family: 'Cardo', serif; font-size: 16px;">
                        <ul style="list-style: none; padding: 0;">
                            <li style="margin-bottom: 15px; display: flex; align-items: center;">
                                <span style="font-size: 24px; margin-right: 10px;">🔍</span>
                                <span>Usa el <strong>scroll del mouse</strong> para hacer zoom in y zoom out</span>
                            </li>
                            <li style="margin-bottom: 15px; display: flex; align-items: center;">
                                <span style="font-size: 24px; margin-right: 10px;">🖱️</span>
                                <span>Arrastra el mapa para <strong>explorar diferentes regiones</strong></span>
                            </li>
                            <li style="margin-bottom: 15px; display: flex; align-items: center;">
                                <span style="font-size: 24px; margin-right: 10px;">📍</span>
                                <span>Pasa el mouse sobre los <strong>nodos circulares</strong> para ver información de cada lugar</span>
                            </li>
                            <li style="margin-bottom: 15px; display: flex; align-items: center;">
                                <span style="font-size: 24px; margin-right: 10px;">🔄</span>
                                <span>Usa el <strong>filtro de categorías</strong> para explorar diferentes tipos de ingredientes</span>
                            </li>
                        </ul>
                    </div>
                    <button onclick="closeTutorial()" style="
                        margin-top: 20px;
                        padding: 12px 30px;
                        background: #713901;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                        font-family: 'Libre Baskerville', serif;
                        transition: background 0.3s ease;
                    " onmouseover="this.style.background='#8B6F47'" 
                       onmouseout="this.style.background='#713901'">
                        ¡Entendido, vamos a explorar!
                    </button>
                </div>
            `;
            
            overlay.appendChild(tutorial);
            document.body.appendChild(overlay);
            
            // Función global para cerrar el tutorial
            window.closeTutorial = () => {
                overlay.style.animation = 'fadeOut 0.3s ease';
                tutorial.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    overlay.remove();
                    localStorage.setItem('mapTutorialShown', 'true');
                }, 300);
            };
            
            // Cerrar con clic fuera del popup
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    window.closeTutorial();
                }
            });
            
            // Remover el listener después de mostrar el tutorial
            mapContainer.removeEventListener('mouseenter', showTutorial);
        };
        
        // Agregar listener para mostrar tutorial
        mapContainer.addEventListener('mouseenter', showTutorial);
        
        // Hacer la función showTutorial disponible globalmente
        window.showMapTutorial = () => {
            tutorialShown = false;  // Reset el estado
            showTutorial();
        };
    }

    dispose() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.markers.forEach(marker => marker.remove());
        if (this.map) {
            this.map.remove();
        }
    }
}

// Exportar para uso global
window.FilteredConnectionMap = FilteredConnectionMap;