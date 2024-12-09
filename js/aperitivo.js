document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let map = null;
    let sankeyChart = null;
    let sankeyData = null;
    let currentState = 'all';
    let currentIngredient = null;

    // Inicializar visualizaciones
    function initializeVisualizations() {
        // Inicializar Sankey
        if (!sankeyChart && document.getElementById('network')) {
            sankeyChart = echarts.init(document.getElementById('network'));
            window.addEventListener('resize', () => sankeyChart.resize());
        }

        // Inicializar mapa
        if (!map && document.getElementById('map')) {
            map = L.map('map', {
                zoomControl: false,
                dragging: false,
                touchZoom: false,
                scrollWheelZoom: false
            }).setView([23.6345, -102.5528], 5);
        }
    }

    // Configurar Scrollama
    function setupScrollama() {
        const scroller = scrollama();
        const ingredientesPermitidos = new Set(['Maíz', 'Frijol', 'Chile', 'Calabaza', 'Cacao']);
    
        scroller
            .setup({
                step: '.content-block',
                offset: 0.5,
                debug: false
            })
            .onStepEnter(response => {
                const { element } = response;
                const ingrediente = element.querySelector('h3')?.textContent;
                
                if (sankeyData) {
                    const hasFlowerImage = element.querySelector('img.rotate-180');
                    
                    // Si no hay ingrediente o no tiene la imagen rotate-180, mostrar todo
                    if (!ingrediente || !hasFlowerImage || !ingredientesPermitidos.has(ingrediente)) {
                        const resetData = DataProcessor.resetVisualization(sankeyData);
                        currentIngredient = null;
                        sankeyChart.setOption({
                            series: [{
                                data: resetData.nodes,
                                links: resetData.links
                            }]
                        });
                    } else {
                        // Solo filtrar si es un ingrediente permitido y tiene la imagen
                        currentIngredient = ingrediente;
                        const filteredData = DataProcessor.filterByIngredient(sankeyData, ingrediente);
                        sankeyChart.setOption({
                            series: [{
                                data: filteredData.nodes,
                                links: filteredData.links
                            }]
                        });
                    }
                }
            });
    
        return scroller;
    }

    // Configurar interacciones del mapa
    function setupMapInteractions(mexicoStates) {
        L.geoJSON(mexicoStates, {
            style: {
                fillColor: '#3388ff',
                weight: 1,
                opacity: 1,
                color: 'white',
                fillOpacity: 0.7
            },
            onEachFeature: (feature, layer) => {
                layer.bindTooltip(feature.properties.name);

                layer.on('mouseover', function(e) {
                    layer.setStyle({
                        fillOpacity: 0.9,
                        weight: 2
                    });

                    if (currentIngredient) {
                        // Si hay un ingrediente seleccionado, filtrar por estado e ingrediente
                        const filteredData = DataProcessor.filterByState(
                            DataProcessor.filterByIngredient(sankeyData, currentIngredient),
                            feature.properties.name
                        );
                        updateSankeyChart(filteredData);
                    } else {
                        // Si no hay ingrediente, solo filtrar por estado
                        const filteredData = DataProcessor.filterByState(sankeyData, feature.properties.name);
                        updateSankeyChart(filteredData);
                    }
                });

                layer.on('mouseout', function() {
                    layer.setStyle({
                        fillOpacity: 0.7,
                        weight: 1
                    });

                    if (currentIngredient) {
                        // Volver al filtro del ingrediente actual
                        const filteredData = DataProcessor.filterByIngredient(sankeyData, currentIngredient);
                        updateSankeyChart(filteredData);
                    } else {
                        // Volver a mostrar todos los datos
                        const resetData = DataProcessor.resetVisualization(sankeyData);
                        updateSankeyChart(resetData);
                    }
                });
            }
        }).addTo(map);
    }

    // Actualizar el gráfico Sankey
    function updateSankeyChart(data) {
        sankeyChart.setOption({
            series: [{
                data: data.nodes,
                links: data.links
            }]
        });
    }

    // Inicialización
    initializeVisualizations();

    // Cargar datos y configurar visualizaciones
    fetch('./json/aperitivo.json')  // Ruta relativa
        .then(response => response.json())
        .then(data => {
            sankeyData = DataProcessor.processDataForSankey(data);
            const option = SankeyConfig.createSankeyOption(sankeyData);
            sankeyChart.setOption(option);

            setupScrollama();

            // Cargar y configurar mapa
            fetch('json/cordenadas.geojson')
                .then(response => response.json())
                .then(mexicoStates => {
                    if (map) {
                        setupMapInteractions(mexicoStates);
                        map.fitBounds(L.geoJSON(mexicoStates).getBounds());
                    }
                });
        })
        .catch(error => console.error('Error:', error));

    // Limpieza
    window.addEventListener('beforeunload', () => {
        if (map) {
            map.remove();
            map = null;
        }
        if (sankeyChart) {
            sankeyChart.dispose();
            sankeyChart = null;
        }
    });
});