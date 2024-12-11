document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let map = null;
    let sankeyChart = null;
    let sankeyData = null;
    let currentState = 'all';
    let currentIngredient = null;
    let primerPlatoMap = null;
    let ingredientCategories = null;
    let tooltipData = null;

    // Inicializar visualizaciones
    function initializeVisualizations() {
        if (!sankeyChart && document.getElementById('network')) {
            sankeyChart = echarts.init(document.getElementById('network'));
            window.addEventListener('resize', () => {
                sankeyChart.resize();
            });
        }

        if (document.getElementById('primer-plato-map')) {
            primerPlatoMap = new PrimerPlatoMap();
            primerPlatoMap.initialize('primer-plato-map');
        }

        if (!map && document.getElementById('map')) {
            map = L.map('map', {
                zoomControl: false,
                dragging: false,
                touchZoom: false,
                scrollWheelZoom: false
            }).setView([23.6345, -102.5528], 5);
        }
    }

    function createCategoryControls(categories) {
        const container = document.createElement('div');
        container.className = 'category-controls';
        
        const allButton = document.createElement('button');
        allButton.className = 'category-button active';
        allButton.textContent = 'Todos';
        allButton.onclick = () => filterByCategory('all');
        container.appendChild(allButton);

        const uniqueCategories = [...new Set(categories.classified_ingredients.map(item => item.category))];
        uniqueCategories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-button';
            button.textContent = category;
            button.style.backgroundColor = SankeyConfig.defaultColors.categoryColors[category] || '#FFF';
            button.style.color = '#013971';
            button.onclick = () => filterByCategory(category);
            container.appendChild(button);
        });

        const networkDiv = document.getElementById('network');
        networkDiv.parentNode.insertBefore(container, networkDiv);
    }

    function filterByCategory(category) {
        document.querySelectorAll('.category-button').forEach(button => {
            button.classList.toggle('active', button.textContent === (category === 'all' ? 'Todos' : category));
        });

        const filteredData = DataProcessor.filterByCategory(sankeyData, category, ingredientCategories);
        updateSankeyChart(filteredData);
    }

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
                
                if (sankeyData) {
                    const ingrediente = element.querySelector('h3')?.textContent;
                    const hasFlowerImage = element.querySelector('img.rotate-180');
                    
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

                if (primerPlatoMap) {
                    primerPlatoMap.updateVisualization(element);
                }
            });
    
        return scroller;
    }

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
                        const filteredData = DataProcessor.filterByState(
                            DataProcessor.filterByIngredient(sankeyData, currentIngredient),
                            feature.properties.name
                        );
                        updateSankeyChart(filteredData);
                    } else {
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
                        const filteredData = DataProcessor.filterByIngredient(sankeyData, currentIngredient);
                        updateSankeyChart(filteredData);
                    } else {
                        const resetData = DataProcessor.resetVisualization(sankeyData);
                        updateSankeyChart(resetData);
                    }
                });
            }
        }).addTo(map);
    }

    function updateSankeyChart(data) {
        const option = SankeyConfig.createSankeyOption(data, tooltipData);
        sankeyChart.setOption(option);
    }

    // Inicialización
    initializeVisualizations();

    // Cargar datos y configurar visualizaciones
    Promise.all([
        fetch('./json/aperitivo.json'),
        fetch('./json/categorias_ingredientes.json'),
        fetch('./json/tooltip.json')
    ])
    .then(responses => Promise.all(responses.map(response => response.json())))
    .then(([sankeyJson, categoriesJson, tooltipsJson]) => {
        sankeyData = DataProcessor.processDataForSankey(sankeyJson);
        ingredientCategories = categoriesJson;
        tooltipData = tooltipsJson;
        
        const option = SankeyConfig.createSankeyOption(sankeyData, tooltipData);
        sankeyChart.setOption(option);

        createCategoryControls(categoriesJson);
        setupScrollama();

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

    window.addEventListener('beforeunload', () => {
        if (map) {
            map.remove();
            map = null;
        }
        if (sankeyChart) {
            sankeyChart.dispose();
            sankeyChart = null;
        }
        if (primerPlatoMap) {
            primerPlatoMap.dispose();
            primerPlatoMap = null;
        }
    });
});