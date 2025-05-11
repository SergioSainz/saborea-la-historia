/**
 * CategoryRing.js - Implementa un cuarto nivel en forma de anillo para el grafo circular
 * Este anillo muestra las categorías de platillos (TIPO_Platillo) como barras apiladas
 * 
 * El anillo está ubicado después del nivel 3 (exterior), con espacio entre ambos niveles
 * Usa colores tierra (marrones, ocres, terracota) para cada categoría
 * Permite interacción bidireccional (hover/click en categoría resalta nodos, selección de nodo resalta categorías)
 * Incluye leyendas a la derecha del grafo
 * 
 * Optimizado para la interacción con nodos - desactiva completamente todos los eventos de hover del anillo
 * cuando hay nodos seleccionados para evitar interferencia con la selección/filtrado de nodos
 */

// Función principal para crear el anillo de categorías
function createCategoryRing(svg, nodes, links, radiusLevel3, radiusLevel4, width, height, ingredienteActivo, disableHover) {
    console.log('Inicializando anillo de categorías de platillos...');
    
    // El parámetro disableHover indica si se debe desactivar el hover (true cuando hay nodos seleccionados)
    
    // Eliminar anillo y leyenda previos si existen
    svg.selectAll('.type-ring, .category-legend').remove();
    
    // Grupo principal para el anillo de categorías - NO necesita desplazamiento adicional
    // ya que todo el SVG ya está desplazado
    const typeRingGroup = svg.append('g')
        .attr('class', 'type-ring')
        .attr('transform', 'translate(0, 0)'); // Sin desplazamiento adicional para mantener alineación con el grafo

    // Categorías principales de platillos con sus colores en paleta tierra
    const tiposPlatillos = [
        { id: 'Moles', color: '#8B4513', desc: 'Moles' }, // Marrón oscuro
        { id: 'Carnes', color: '#A52A2A', desc: 'Carnes' }, // Marrón rojizo
        { id: 'Antojitos', color: '#D2691E', desc: 'Antojitos' }, // Chocolate
        { id: 'Tamales', color: '#CD853F', desc: 'Tamales' }, // Marrón arena
        { id: 'Especialidades Regionales', color: '#B8860B', desc: 'Esp. Regionales' }, // Dorado oscuro
        { id: 'Desayunos y Entradas', color: '#DAA520', desc: 'Desayunos' }, // Dorado
        { id: 'Sopas', color: '#BC8F8F', desc: 'Sopas' }, // Rosado terroso
        { id: 'Postres', color: '#DEB887', desc: 'Postres' }, // Burlywood
        { id: 'Mariscos', color: '#F4A460', desc: 'Mariscos' }, // Arena
        { id: 'Salsas', color: '#D2B48C', desc: 'Salsas' }, // Tan
        { id: 'Platos Principales', color: '#A0522D', desc: 'Platos Principales' }, // Siena
        { id: 'Pollo', color: '#B87333', desc: 'Pollo' }, // Cobre
        { id: 'Bebidas', color: '#E6BE8A', desc: 'Bebidas' } // Beige dorado
    ];
    
    // Crear mapa de colores para rápido acceso
    const colorMap = {};
    tiposPlatillos.forEach(tipo => {
        colorMap[tipo.id] = tipo.color;
    });
    
    // Función para determinar el color según tipo
    function getCategoryColor(categoria) {
        return colorMap[categoria] || '#996633'; // Color marrón por defecto
    }
    
    // Datos para el anillo: conteo de platillos por categoría y relación con los nodos
    const categoryCounts = {};
    const categoryPlatillos = {};
    
    // Inicializar el contador y mapeo para cada categoría
    tiposPlatillos.forEach(tipo => {
        categoryCounts[tipo.id] = 0;
        categoryPlatillos[tipo.id] = [];
    });
    
    // Contar platillos por categoría del conjunto filtrado
    nodes.forEach(node => {
        if (node.level === 3) { // Solo platillos (nivel 3)
            const tipoPlatillo = node.tipo_platillo; // Obtenemos del nodo
            if (tipoPlatillo && categoryCounts.hasOwnProperty(tipoPlatillo)) {
                categoryCounts[tipoPlatillo]++;
                categoryPlatillos[tipoPlatillo].push(node.id);
            }
        }
    });
    
    // Calcular ángulos para el diagrama de arco
    const total = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    
    // No crear anillo si no hay datos suficientes
    if (total === 0) {
        console.log('No hay datos suficientes para crear el anillo de categorías');
        return;
    }
    
    console.log(`Total de platillos categorizados: ${total}`);
    
    // Preparar datos para el arco
    // Primero crear array con los datos
    let arcDataUnsorted = [];
    
    tiposPlatillos.forEach(tipo => {
        const count = categoryCounts[tipo.id];
        if (count > 0) {
            arcDataUnsorted.push({
                id: tipo.id,
                count: count,
                nodes: categoryPlatillos[tipo.id],
                color: getCategoryColor(tipo.id),
                desc: tipo.desc
            });
        }
    });
    
    // Ordenar los datos de mayor a menor según el conteo
    arcDataUnsorted.sort((a, b) => b.count - a.count);
    
    // Asignar ángulos después de ordenar
    let startAngle = 0;
    const arcData = [];
    
    arcDataUnsorted.forEach(item => {
        const angle = (item.count / total) * (2 * Math.PI);
        arcData.push({
            ...item,
            startAngle: startAngle,
            endAngle: startAngle + angle
        });
        startAngle += angle;
    });
    
    // Crear el generador de arco
    const arc = d3.arc()
        .innerRadius(radiusLevel3 + 35) // Aumentamos el espacio entre nivel 3 y anillo
        .outerRadius(radiusLevel4)
        .padAngle(0.03) // Mayor separación entre segmentos
        .cornerRadius(6); // Añadimos border radius a las barras
    
    // Crear los segmentos del anillo con transición sencilla
    const segments = typeRingGroup.selectAll('.category-segment')
        .data(arcData)
        .enter()
        .append('path')
        .attr('class', 'category-segment')
        .attr('d', arc)
        .attr('fill', d => d.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0) // Iniciar invisible
        .attr('cursor', disableHover ? 'default' : 'pointer') // Cambiar cursor según estado
        .attr('id', d => `segment-${d.id.replace(/\s+/g, '-').toLowerCase()}`);
        
    // Animar aparición de segmentos con un retraso secuencial
    segments.transition()
        .duration(600)
        .delay((d, i) => i * 40) // Retraso escalonado para efecto secuencial
        .attr('opacity', 0.85) // Animar a opacidad final
        .ease(d3.easeBackOut.overshoot(1.1)); // Efecto de rebote ligero
    
    // Eliminamos las etiquetas en el arco completamente
    // No creamos ninguna etiqueta en los anillos como se solicitó
    
    // Limpiar cualquier evento previo para evitar duplicados o comportamientos inesperados
    // Esto es crítico cuando se recrean los anillos con diferentes configuraciones de disableHover
    segments.on('mouseover', null).on('mouseout', null).on('click', null);
    
    // Agregar leyenda, movida más a la izquierda y bajada un 30% desde la parte superior
    // Ajustamos la posición de la leyenda para ser coherente con el desplazamiento del grafo
    const legendOffset = width * 0.07; // Reducimos el desplazamiento horizontal de la leyenda (0.12 - 0.05)
    const legendGroup = svg.append('g')
        .attr('class', 'category-legend')
        .attr('transform', `translate(${width/2 - legendOffset}, ${-height/2 + (height * 0.3)})`) // Bajada 30% desde arriba
        .style('pointer-events', 'all'); // Asegurar que recibe eventos
    
    // Título de la leyenda con animación sencilla - mejorado
    legendGroup.append('text')
        .attr('class', 'legend-title')
        .attr('x', 0)
        .attr('y', 0)
        .attr('font-size', '16px') // Aumentado de 14px a 16px
        .attr('font-weight', 'bold')
        .attr('font-family', 'Cardo, serif')
        .attr('fill', '#121212') // Gris más oscuro, casi negro
        .attr('opacity', 0) // Iniciar invisible
        .text('Categorías de Platillos')
        .transition()
        .duration(600)
        .delay(200) // Pequeño retraso inicial
        .attr('opacity', 1) // Hacer visible
        .ease(d3.easeQuadOut); // Curva de animación suave
    
    // Crear leyenda para cada categoría (solo las que tienen datos) ordenada de mayor a menor
    const filteredCategories = tiposPlatillos
        .filter(tipo => categoryCounts[tipo.id] > 0)
        .sort((a, b) => categoryCounts[b.id] - categoryCounts[a.id]);
    
    const legendItems = legendGroup.selectAll('.legend-item')
        .data(filteredCategories)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${25 + i * 24})`) // Mayor espaciado vertical
        .attr('cursor', disableHover ? 'default' : 'pointer') // Cambiar cursor según estado
        .attr('opacity', 0); // Iniciar invisible
    
    // Animar aparición de elementos de leyenda con retraso secuencial
    legendItems.transition()
        .duration(400)
        .delay((d, i) => 600 + i * 50) // Retraso después de la animación del anillo
        .attr('opacity', 1)
        .ease(d3.easeQuadOut);
    
    // Rectángulos de color - más grandes
    legendItems.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 14) // Aumentado de 12 a 14
        .attr('height', 14) // Aumentado de 12 a 14
        .attr('fill', d => d.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5);
    
    // Etiquetas de texto (conteo primero, luego tipo) - más grandes y con gris más fuerte
    legendItems.append('text')
        .attr('x', 22) // Aumentado de 20 a 22 para más separación con el rectángulo
        .attr('y', 11) // Ajustado para alinear verticalmente con los rectángulos más grandes
        .attr('font-size', '13px')
        .attr('font-family', 'Cardo, serif')
        .attr('fill', '#1a1a1a') // Gris más oscuro (casi negro) para mejor contraste
        .attr('font-weight', '500') // Ligeramente más negrita que normal
        .text(d => `${categoryCounts[d.id]} ${d.id}`);
    
    // Contador de categorías con animación - con posición corregida
    legendGroup.append('text')
        .attr('class', 'categories-count')
        .attr('x', 0)
        .attr('y', 45 + filteredCategories.length * 24) // Ajustado al nuevo espaciado de 24px entre elementos
        .attr('font-size', '12px')
        .attr('font-family', 'Cardo, serif')
        .attr('font-style', 'italic')
        .attr('fill', '#444')
        .attr('font-weight', '500')
        .attr('opacity', 0) // Iniciar invisible
        .text(`Total: ${total} platillos`)
        .transition()
        .duration(500)
        .delay(600 + filteredCategories.length * 50 + 200) // Aparecer después de todos los elementos
        .attr('opacity', 1)
        .ease(d3.easeQuadOut);
    
    // --------- INTERACTIVIDAD ----------
    
    // 1. Interactividad de los segmentos del anillo
    segments.on('mouseover.categoryRing', function(event, d) {
        // Si el hover está desactivado porque hay nodos seleccionados, no hacer nada
        if (disableHover) return;
        
        // Destacar visualmente este segmento
        d3.select(this)
            .transition().duration(200)
            .attr('opacity', 1)
            .attr('stroke-width', 2)
            .attr('stroke', '#333');
        
        // Recopilar todos los orígenes conectados a esta categoría
        const origenesConectados = new Set();
        
        // Primero identificar todos los platillos de esta categoría y sus orígenes asociados
        d.nodes.forEach(platilloId => {
            links.forEach(link => {
                if (link.type === 'origen-platillo' && link.target.id === platilloId) {
                    origenesConectados.add(link.source.id);
                }
            });
        });
        
        // Destacar nodos relacionados
        d3.selectAll('.nodes .node').each(function(node) {
            if (node.level === 3 && d.nodes.includes(node.id)) {
                // Resaltar platillos de esta categoría
                d3.select(this).select('circle')
                    .transition().duration(200)
                    .attr('opacity', 1)
                    .attr('stroke', d.color)
                    .attr('stroke-width', 2);
                
            } else if (node.level === 2 && origenesConectados.has(node.id)) {
                // Resaltar orígenes conectados a cualquier platillo de esta categoría
                // Aumentamos la opacidad del 50% normal al 90%
                d3.select(this).select('circle')
                    .transition().duration(200)
                    .attr('opacity', 0.9) // Aumentar desde 0.5 a 0.9 al hacer hover
                    .attr('stroke', '#663300')
                    .attr('stroke-width', 1.5);
                
            } else {
                // Atenuar otros nodos
                d3.select(this).selectAll('circle')
                    .transition().duration(200)
                    .attr('opacity', 0.2);
            }
        });
        
        // Atenuar enlaces no relacionados
        d3.selectAll('.links line').each(function(link) {
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            const relatedToCategory = d.nodes.includes(targetId);
            
            d3.select(this)
                .transition().duration(200)
                .attr('opacity', relatedToCategory ? 0.8 : 0.1);
        });
        
        // Mostrar tooltip con información de la categoría
        const tipContainer = d3.select('body').append('div')
            .attr('class', 'category-tooltip')
            .style('position', 'absolute')
            .style('background-color', 'rgba(255, 255, 255, 0.95)')
            .style('border', `2px solid ${d.color}`)
            .style('border-radius', '6px')
            .style('padding', '8px 12px')
            .style('font-family', "'Cardo', serif")
            .style('font-size', '12px')
            .style('color', '#333')
            .style('pointer-events', 'none')
            .style('z-index', 1000)
            .style('box-shadow', '0 2px 8px rgba(0,0,0,0.15)')
            .style('max-width', '260px')
            .style('opacity', 0)
            .style('transition', 'opacity 0.2s ease')
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        
        const content = `
            <div style="text-align: center; margin-bottom: 5px;">
                <strong style="font-size: 14px; color: ${d.color}">${d.id}</strong>
            </div>
            <div style="font-size: 12px; margin-bottom: 3px;">
                <strong>${d.count}</strong> platillos en esta categoría
            </div>
            <div style="font-size: 11px; font-style: italic; color: #666;">
                ${Math.round((d.count / total) * 100)}% del total
            </div>
        `;
        
        tipContainer.html(content)
            .transition().duration(200)
            .style('opacity', 1);
        
        // Guardar referencia para poder eliminarla en mouseout
        d3.select(this).datum().tooltip = tipContainer;
    })
    .on('mouseout.categoryRing', function(event, d) {
        // Si el hover está desactivado porque hay nodos seleccionados, no hacer nada
        if (disableHover) {
            // Solo eliminar el tooltip si existe
            if (d.tooltip) {
                d.tooltip.transition().duration(200)
                    .style('opacity', 0)
                    .remove();
            }
            return;
        }
        
        // Comprobar si este segmento está seleccionado
        const isSelected = window.categoryRingSelection === d.id;
        
        // Restaurar apariencia de este segmento según su estado de selección
        d3.select(this)
            .transition().duration(200)
            .attr('opacity', isSelected ? 1 : 0.85)
            .attr('stroke-width', isSelected ? 2 : 0.5)
            .attr('stroke', isSelected ? '#333' : '#fff');
        
        // Restaurar apariencia de los nodos
        d3.selectAll('.nodes .node').each(function(node) {
            const baseOpacity = ingredienteActivo ? 
                (node.isRelevant ? 1 : 0.2) : 
                (node.level === 1 ? 0.9 : 0.85);
                
            d3.select(this).selectAll('circle')
                .transition().duration(200)
                .attr('opacity', baseOpacity)
                .attr('stroke', '#fff')
                .attr('stroke-width', node.level === 1 ? 1.5 : 1);
        });
        
        // Restaurar apariencia de los enlaces
        d3.selectAll('.links line')
            .transition().duration(200)
            .attr('opacity', ingredienteActivo ? 0.6 : 0.4);
        
        // Eliminar tooltip
        if (d.tooltip) {
            d.tooltip.transition().duration(200)
                .style('opacity', 0)
                .remove();
        }
    })
    .on('click', function(event, d) {
        console.log(`Categoría seleccionada: ${d.id} con ${d.count} platillos`);
        
        // Variable estática para rastrear la categoría seleccionada
        // Asegurarse de que exista en el objeto global window para mantener persistencia
        if (typeof window.categoryRingSelection === 'undefined') {
            window.categoryRingSelection = null;
        }
        
        // Comprobar si esta categoría ya está seleccionada
        if (window.categoryRingSelection === d.id) {
            // Deseleccionar la categoría
            window.categoryRingSelection = null;
            
            // Restaurar todos los segmentos a apariencia normal
            segments
                .transition().duration(300)
                .attr('opacity', 0.85)
                .attr('stroke-width', 0.5)
                .attr('stroke', '#fff');
                
            // Restaurar apariencia de nodos y enlaces
            d3.selectAll('.nodes .node').each(function(node) {
                const baseOpacity = ingredienteActivo ? 
                    (node.isRelevant ? 1 : 0.2) : 
                    (node.level === 1 ? 0.9 : 0.85);
                    
                d3.select(this).selectAll('circle')
                    .transition().duration(300)
                    .attr('opacity', baseOpacity)
                    .attr('stroke', '#fff')
                    .attr('stroke-width', node.level === 1 ? 1.5 : 1);
            });
            
            // Restaurar enlaces
            d3.selectAll('.links line')
                .transition().duration(300)
                .attr('opacity', ingredienteActivo ? 0.6 : 0.4);
        } else {
            // Seleccionar esta categoría y deseleccionar las demás
            window.categoryRingSelection = d.id;
            
            // Atenuar todos los segmentos
            segments
                .transition().duration(300)
                .attr('opacity', 0.3)
                .attr('stroke-width', 0.5)
                .attr('stroke', '#fff');
                
            // Destacar solo el segmento seleccionado
            d3.select(this)
                .transition().duration(300)
                .attr('opacity', 1)
                .attr('stroke-width', 2)
                .attr('stroke', '#333');
                
            // Atenuar todos los nodos primero
            d3.selectAll('.nodes .node').each(function(node) {
                d3.select(this).selectAll('circle')
                    .transition().duration(300)
                    .attr('opacity', 0.2)
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1);
            });
            
            // Luego destacar solo los nodos relacionados con esta categoría
            d3.selectAll('.nodes .node').each(function(node) {
                if (node.level === 3 && d.nodes.includes(node.id)) {
                    // Resaltar platillos de esta categoría
                    d3.select(this).select('circle')
                        .transition().duration(300)
                        .attr('opacity', 1)
                        .attr('stroke', d.color)
                        .attr('stroke-width', 2);
                    
                    // También resaltar orígenes conectados
                    const origenesConectados = new Set();
                    links.forEach(link => {
                        if (link.type === 'origen-platillo' && link.target.id === node.id) {
                            origenesConectados.add(link.source.id);
                        }
                    });
                    
                    d3.selectAll('.nodes .node').each(function(origenNode) {
                        if (origenNode.level === 2 && origenesConectados.has(origenNode.id)) {
                            d3.select(this).select('circle')
                                .transition().duration(300)
                                .attr('opacity', 0.8)
                                .attr('stroke', '#663300')
                                .attr('stroke-width', 1.5);
                        }
                    });
                }
            });
            
            // Destacar enlaces relacionados y atenuar los demás
            d3.selectAll('.links line').each(function(link) {
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                const relatedToCategory = d.nodes.includes(targetId);
                
                d3.select(this)
                    .transition().duration(300)
                    .attr('opacity', relatedToCategory ? 0.8 : 0.1);
            });
        }
    });
    
    // 2. Interactividad de la leyenda
    legendItems.on('mouseover.categoryLegend', function(event, d) {
        // Si el hover está desactivado porque hay nodos seleccionados, no hacer nada
        if (disableHover) return;
        
        // Destacar visualmente este ítem de leyenda
        d3.select(this).select('rect')
            .transition().duration(200)
            .attr('stroke', '#333')
            .attr('stroke-width', 2);
            
        // Resaltar el segmento correspondiente
        d3.select(`#segment-${d.id.replace(/\s+/g, '-').toLowerCase()}`)
            .transition().duration(200)
            .attr('opacity', 1)
            .attr('stroke-width', 2)
            .attr('stroke', '#333');
            
        // Resaltar platillos de esta categoría (mismo comportamiento que hover en segmento)
        const categoryNodes = categoryPlatillos[d.id] || [];
        
        // Recopilar todos los orígenes conectados a esta categoría
        const origenesConectados = new Set();
        
        // Identificar todos los orígenes asociados a los platillos de esta categoría
        categoryNodes.forEach(platilloId => {
            links.forEach(link => {
                if (link.type === 'origen-platillo' && link.target.id === platilloId) {
                    origenesConectados.add(link.source.id);
                }
            });
        });
        
        d3.selectAll('.nodes .node').each(function(node) {
            if (node.level === 3 && categoryNodes.includes(node.id)) {
                // Resaltar platillos de esta categoría
                d3.select(this).select('circle')
                    .transition().duration(200)
                    .attr('opacity', 1)
                    .attr('stroke', d.color)
                    .attr('stroke-width', 2);
            } else if (node.level === 2 && origenesConectados.has(node.id)) {
                // Resaltar orígenes conectados a cualquier platillo de esta categoría
                // Aumentamos la opacidad del 50% normal al 90%
                d3.select(this).select('circle')
                    .transition().duration(200)
                    .attr('opacity', 0.9) // Aumentar desde 0.5 a 0.9 al hacer hover
                    .attr('stroke', '#663300')
                    .attr('stroke-width', 1.5);
            } else {
                // Atenuar otros nodos
                d3.select(this).selectAll('circle')
                    .transition().duration(200)
                    .attr('opacity', 0.2);
            }
        });
        
        // Atenuar enlaces no relacionados
        d3.selectAll('.links line').each(function(link) {
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            const relatedToCategory = categoryNodes.includes(targetId);
            
            d3.select(this)
                .transition().duration(200)
                .attr('opacity', relatedToCategory ? 0.8 : 0.1);
        });
    })
    .on('mouseout.categoryLegend', function(event, d) {
        // Si el hover está desactivado porque hay nodos seleccionados, no hacer nada adicional
        if (disableHover) {
            // Restaurar solo la apariencia del ítem de leyenda
            d3.select(this).select('rect')
                .transition().duration(200)
                .attr('stroke', '#fff')
                .attr('stroke-width', 0.5);
            return;
        }
        
        // Restaurar apariencia del ítem de leyenda
        d3.select(this).select('rect')
            .transition().duration(200)
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5);
            
        // Comprobar si esta es la categoría seleccionada
        const isSelected = window.categoryRingSelection === d.id;
        
        // Restaurar apariencia del segmento correspondiente según su estado de selección
        d3.select(`#segment-${d.id.replace(/\s+/g, '-').toLowerCase()}`)
            .transition().duration(200)
            .attr('opacity', isSelected ? 1 : 0.85)
            .attr('stroke-width', isSelected ? 2 : 0.5)
            .attr('stroke', isSelected ? '#333' : '#fff');
            
        // Restaurar apariencia de los nodos
        d3.selectAll('.nodes .node').each(function(node) {
            const baseOpacity = ingredienteActivo ? 
                (node.isRelevant ? 1 : 0.2) : 
                (node.level === 1 ? 0.9 : 0.85);
                
            d3.select(this).selectAll('circle')
                .transition().duration(200)
                .attr('opacity', baseOpacity)
                .attr('stroke', '#fff')
                .attr('stroke-width', node.level === 1 ? 1.5 : 1);
        });
        
        // Restaurar apariencia de los enlaces
        d3.selectAll('.links line')
            .transition().duration(200)
            .attr('opacity', ingredienteActivo ? 0.6 : 0.4);
    })
    .on('click', function(event, d) {
        console.log(`Categoría seleccionada desde leyenda: ${d.id}`);
        
        // Encontrar y hacer clic en el segmento correspondiente para reutilizar la lógica
        const segmentId = `segment-${d.id.replace(/\s+/g, '-').toLowerCase()}`;
        const segmentElement = d3.select(`#${segmentId}`).node();
        
        if (segmentElement) {
            // Simular un clic en el segmento correspondiente para aprovechar la lógica
            const segmentData = d3.select(segmentElement).datum();
            
            // Usar la misma variable global de selección
            
            // Comprobar si esta categoría ya está seleccionada
            if (window.categoryRingSelection === segmentData.id) {
                // Deseleccionar la categoría
                window.categoryRingSelection = null;
                
                // Restaurar todos los segmentos a apariencia normal
                segments
                    .transition().duration(300)
                    .attr('opacity', 0.85)
                    .attr('stroke-width', 0.5)
                    .attr('stroke', '#fff');
                    
                // Restaurar apariencia de nodos y enlaces
                d3.selectAll('.nodes .node').each(function(node) {
                    const baseOpacity = ingredienteActivo ? 
                        (node.isRelevant ? 1 : 0.2) : 
                        (node.level === 1 ? 0.9 : 0.85);
                        
                    d3.select(this).selectAll('circle')
                        .transition().duration(300)
                        .attr('opacity', baseOpacity)
                        .attr('stroke', '#fff')
                        .attr('stroke-width', node.level === 1 ? 1.5 : 1);
                });
                
                // Restaurar enlaces
                d3.selectAll('.links line')
                    .transition().duration(300)
                    .attr('opacity', ingredienteActivo ? 0.6 : 0.4);
            } else {
                // Seleccionar esta categoría y deseleccionar las demás
                window.categoryRingSelection = segmentData.id;
                
                // Atenuar todos los segmentos
                segments
                    .transition().duration(300)
                    .attr('opacity', 0.3)
                    .attr('stroke-width', 0.5)
                    .attr('stroke', '#fff');
                    
                // Destacar solo el segmento seleccionado
                d3.select(segmentElement)
                    .transition().duration(300)
                    .attr('opacity', 1)
                    .attr('stroke-width', 2)
                    .attr('stroke', '#333');
                    
                // Atenuar todos los nodos primero
                d3.selectAll('.nodes .node').each(function(node) {
                    d3.select(this).selectAll('circle')
                        .transition().duration(300)
                        .attr('opacity', 0.2)
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 1);
                });
                
                // Luego destacar solo los nodos relacionados con esta categoría
                d3.selectAll('.nodes .node').each(function(node) {
                    if (node.level === 3 && segmentData.nodes.includes(node.id)) {
                        // Resaltar platillos de esta categoría
                        d3.select(this).select('circle')
                            .transition().duration(300)
                            .attr('opacity', 1)
                            .attr('stroke', segmentData.color)
                            .attr('stroke-width', 2);
                        
                        // También resaltar orígenes conectados
                        const origenesConectados = new Set();
                        links.forEach(link => {
                            if (link.type === 'origen-platillo' && link.target.id === node.id) {
                                origenesConectados.add(link.source.id);
                            }
                        });
                        
                        d3.selectAll('.nodes .node').each(function(origenNode) {
                            if (origenNode.level === 2 && origenesConectados.has(origenNode.id)) {
                                d3.select(this).select('circle')
                                    .transition().duration(300)
                                    .attr('opacity', 0.8)
                                    .attr('stroke', '#663300')
                                    .attr('stroke-width', 1.5);
                            }
                        });
                    }
                });
                
                // Destacar enlaces relacionados y atenuar los demás
                d3.selectAll('.links line').each(function(link) {
                    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                    const relatedToCategory = segmentData.nodes.includes(targetId);
                    
                    d3.select(this)
                        .transition().duration(300)
                        .attr('opacity', relatedToCategory ? 0.8 : 0.1);
                });
            }
        }
    });
    
    // 3. Función para resaltar categorías desde nodos (a ser integrada en circularGraph.js)
    window.highlightCategoriesForNode = function(nodeId) {
        // Buscar las categorías relacionadas con este nodo
        for (const categoria in categoryPlatillos) {
            if (categoryPlatillos[categoria].includes(nodeId)) {
                // Resaltar segmento correspondiente
                d3.select(`#segment-${categoria.replace(/\s+/g, '-').toLowerCase()}`)
                    .transition().duration(200)
                    .attr('opacity', 1)
                    .attr('stroke-width', 2)
                    .attr('stroke', '#333');
            }
        }
    };
    
    window.resetCategoryHighlights = function() {
        // Si hay una categoría seleccionada, mantener su estado
        if (window.categoryRingSelection) {
            // Primero resetear todos los segmentos
            segments
                .transition().duration(200)
                .attr('opacity', 0.3) // Atenuar todos
                .attr('stroke-width', 0.5)
                .attr('stroke', '#fff');
                
            // Luego destacar solo el segmento seleccionado
            d3.select(`#segment-${window.categoryRingSelection.replace(/\s+/g, '-').toLowerCase()}`)
                .transition().duration(200)
                .attr('opacity', 1)
                .attr('stroke-width', 2)
                .attr('stroke', '#333');
        } else {
            // Si no hay selección, restaurar todos los segmentos a apariencia normal
            segments
                .transition().duration(200)
                .attr('opacity', 0.85)
                .attr('stroke-width', 0.5)
                .attr('stroke', '#fff');
        }
    };
    
    console.log('Anillo de categorías creado exitosamente');
    return {
        highlightCategoriesForNode: window.highlightCategoriesForNode,
        resetCategoryHighlights: window.resetCategoryHighlights
    };
}

// Función para obtener el tipo de platillo a partir de su ID
function getTipoPlatillo(platilloId, csvData) {
    // Implementación pendiente: esto puede requerir parsear el CSV
    // o usar una estructura de datos preexistente para buscar el TIPO_Platillo
    return 'Categoría Desconocida';
}

// Exposición de la función principal como método público
window.createCategoryRing = createCategoryRing;