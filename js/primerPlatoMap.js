// primerPlatoMap.js

class PrimerPlatoMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.currentStep = 0;
        this.currentIngredient = null;
        this.data = null;
        this.markersVisible = true;
    }

    async initialize(containerId) {
        // Inicializar el mapa
        this.map = new maplibregl.Map({
            container: containerId,
            style: 'https://tiles.stadiamaps.com/styles/stamen_watercolor.json?api_key=bb35bcf5-8067-47a7-a4b2-5c0fb5ccdb42',
            center: [-102.5528, 23.6345],
            zoom: 4.0,
            maxBounds: [
                [-119.8, 14.5],
                [-85.3, 32.7]
            ],
            minZoom: 4,
            maxZoom: 8
        });

        // Cargar datos
        try {
            const response = await fetch('../json/primer_plato.json');
            this.data = await response.json();
        } catch (error) {
            console.error('Error cargando datos:', error);
        }

        // Configurar el mapa cuando se cargue
        this.map.on('load', () => {
            this.setupBaseLayers();
            this.setupGeoJSONLayers();
            this.setupMarkers();
            this.setupInteractions();
        });

        return this;
    }

    setupBaseLayers() {
        // Capa base de acuarela
        const tileUrl = 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key=bb35bcf5-8067-47a7-a4b2-5c0fb5ccdb42';
        
        this.map.addSource('watercolor', {
            'type': 'raster',
            'tiles': [tileUrl],
            'tileSize': 256
        });

        this.map.addLayer({
            'id': 'watercolor-layer',
            'type': 'raster',
            'source': 'watercolor',
            'minzoom': 2,
            'maxzoom': 16
        });
    }

    async setupGeoJSONLayers() {
        try {
            const response = await fetch('json/cordenadas.geojson');
            const mexicoStates = await response.json();

            // Añadir fuente de estados
            this.map.addSource('estados', {
                'type': 'geojson',
                'data': mexicoStates
            });

            // Capa de relleno de estados
            this.map.addLayer({
                'id': 'estados-fill',
                'type': 'fill',
                'source': 'estados',
                'paint': {
                    'fill-color': '#f8f9fa',
                    'fill-opacity': 0.1
                }
            });

            // Capa de bordes de estados
            this.map.addLayer({
                'id': 'estados-border',
                'type': 'line',
                'source': 'estados',
                'paint': {
                    'line-color': 'rgba(113, 57, 1, 0.5)',
                    'line-width': 1.5,
                    'line-opacity': 0.3
                }
            });

            // Interacciones con estados
            this.map.on('mouseenter', 'estados-fill', () => {
                this.map.getCanvas().style.cursor = 'pointer';
            });

            this.map.on('mouseleave', 'estados-fill', () => {
                this.map.getCanvas().style.cursor = '';
            });

        } catch (error) {
            console.error('Error cargando GeoJSON:', error);
        }
    }

    setupMarkers() {
        if (!this.data?.ingredientes) return;
    
        // Limpiar marcadores existentes
        this.clearMarkers();
    
        // Crear nuevos marcadores
        this.data.ingredientes.forEach(ingrediente => {
            // Crear elemento del marcador
            const el = document.createElement('div');
            el.className = 'marker-ingrediente';
            
            // Contenedor para el icono
            const iconContainer = document.createElement('div');
            iconContainer.className = 'marker-icon-container';
            
            // Crear un div para el ícono temporal
            const iconDiv = document.createElement('div');
            iconDiv.className = 'marker-icon';
            iconDiv.style.backgroundColor = '#013971';
            iconDiv.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <use href="#${ingrediente.iconoTemp}"/>
            </svg>`;
            
            iconContainer.appendChild(iconDiv);
            el.appendChild(iconContainer);
    
            // Crear popup
            const popup = new maplibregl.Popup({
                offset: [0, -10],
                className: 'marker-popup',
                closeButton: false
            }).setHTML(`
                <h3>${ingrediente.nombre}</h3>
                <p><strong>Origen:</strong> ${ingrediente.origen}</p>
                <p><strong>Uso:</strong> ${ingrediente.uso}</p>
                <p>${ingrediente.descripcion}</p>
            `);
    
            // Crear marcador
            const marker = new maplibregl.Marker({
                element: el,
                anchor: 'bottom'
            })
                .setLngLat(ingrediente.coordinates)
                .setPopup(popup)
                .addTo(this.map);
    
            this.markers.push(marker);
        });
    }

    setupInteractions() {
        // Interacciones con marcadores
        this.markers.forEach(marker => {
            const element = marker.getElement();
            const iconContainer = element.querySelector('.marker-icon-container');
            
            element.addEventListener('mouseenter', () => {
                iconContainer.classList.add('hover');
            });
    
            element.addEventListener('mouseleave', () => {
                iconContainer.classList.remove('hover');
            });
    
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                const coordinates = marker.getLngLat();
                this.map.flyTo({
                    center: coordinates,
                    zoom: 6,
                    duration: 1500
                });
            });
        });
    }

    clearMarkers() {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
    }

    toggleMarkers(show) {
        this.markersVisible = show;
        this.markers.forEach(marker => {
            const element = marker.getElement();
            element.style.display = show ? 'block' : 'none';
        });
    }

    highlightState(stateName) {
        if (!this.map.getLayer('estados-fill')) return;

        this.map.setPaintProperty('estados-fill', 'fill-opacity', [
            'match',
            ['get', 'name'],
            stateName,
            0.5,
            0.1
        ]);
    }

    resetStateHighlight() {
        if (!this.map.getLayer('estados-fill')) return;
        this.map.setPaintProperty('estados-fill', 'fill-opacity', 0.1);
    }

    updateVisualization(element) {
        // Obtener información del paso actual
        const step = element.getAttribute('data-step');
        const ingrediente = element.querySelector('h3')?.textContent;

        switch(step) {
            case 'inicio':
                this.resetView();
                this.toggleMarkers(true);
                break;
            case 'ingredientes':
                if (ingrediente && this.data?.ingredientes) {
                    const ingredienteData = this.data.ingredientes.find(i => i.nombre === ingrediente);
                    if (ingredienteData) {
                        this.highlightIngredient(ingredienteData);
                    }
                }
                break;
            case 'estados':
                const estado = element.getAttribute('data-state');
                if (estado) {
                    this.highlightState(estado);
                }
                break;
            default:
                this.resetView();
        }
    }

    highlightIngredient(ingrediente) {
        this.currentIngredient = ingrediente.nombre;
        
        // Centrar mapa en el ingrediente
        this.map.flyTo({
            center: ingrediente.coordinates,
            zoom: 6,
            duration: 1500
        });

        // Resaltar estado relacionado
        this.highlightState(ingrediente.estado);

        // Resaltar marcador
        const marker = this.markers.find(m => 
            m.getLngLat().lng === ingrediente.coordinates[0] && 
            m.getLngLat().lat === ingrediente.coordinates[1]
        );

        if (marker) {
            const element = marker.getElement();
            element.style.transform = 'scale(1.2)';
            marker.togglePopup();
        }
    }

    resetView() {
        this.currentIngredient = null;
        this.resetStateHighlight();
        
        // Resetear vista del mapa
        this.map.flyTo({
            center: [-102.5528, 23.6345],
            zoom: 4.5,
            duration: 1500
        });

        // Resetear marcadores
        this.markers.forEach(marker => {
            const element = marker.getElement();
            element.style.transform = 'scale(1)';
            marker.getPopup().remove();
        });
    }

    dispose() {
        if (this.map) {
            this.clearMarkers();
            this.map.remove();
            this.map = null;
        }
    }
}

window.PrimerPlatoMap = PrimerPlatoMap;
// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el mapa
    const primerPlatoMap = new PrimerPlatoMap();
    primerPlatoMap.initialize('primer-plato-map');

    // Configurar Scrollama
    const scroller = scrollama();

    scroller
        .setup({
            step: '#primer-plato .content-block', // Selecciona los bloques de contenido dentro de la sección
            offset: 0.5,
            debug: false
        })
        .onStepEnter(response => {
            // Activar el bloque actual
            response.element.classList.add('active');
            
            // Actualizar la visualización del mapa
            primerPlatoMap.updateVisualization(response.element);
        })
        .onStepExit(response => {
            // Desactivar el bloque cuando sale de la vista
            response.element.classList.remove('active');
        });

    // Manejar redimensionamiento de ventana
    window.addEventListener('resize', scroller.resize);
});