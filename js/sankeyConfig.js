const SankeyConfig = {
    defaultColors: {
        maiz: '#F4D03F',
        chile: '#C0392B',
        frijol: '#6C3483',
        chocolate: '#935116',
        pescado: '#5DADE2',
        coco: '#FDFEFE',
        estados: '#34495E',
        platillos: '#795548',
        inactive: '#CCCCCC'
    },

    getIngredientColor: function(ingrediente) {
        const nombre = ingrediente.toLowerCase();
        for (let key in this.defaultColors) {
            if (nombre.includes(key)) {
                return this.defaultColors[key];
            }
        }
        return this.defaultColors.platillos;
    },

    createSankeyOption: function(sankeyData) {
        return {
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove'
            },
            series: [{
                type: 'sankey',
                left: '10%',
                right: '10%',
                emphasis: {
                    focus: 'adjacency'
                },
                data: sankeyData.nodes,
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
                layoutIterations: 64,
                nodeAlign: 'justify'
            }]
        };
    }
};