/**
 * Gráfico radial para culturas prehispánicas y sus ingredientes
 * Visualiza las culturas prehispánicas más representativas según la cantidad
 * de ingredientes únicos que aportaron a la gastronomía mexicana
 */

// Función para procesar los datos y generar el recuento de ingredientes por cultura prehispánica
function processCulturalData(csvData) {
    // Dividir cada línea por el separador | y filtrar para ingredientes de época prehispánica
    const rows = csvData.split('\n').map(line => line.split('|'));
    
    // Obtener el índice de las columnas que necesitamos
    const headers = rows[0];
    const ingredienteIndex = headers.findIndex(h => h.includes('Ingrediente'));
    const epocaIngredienteIndex = headers.findIndex(h => h.includes('Epoca_Ingrediente'));
    const culturaIndex = headers.findIndex(h => h.includes('Cultura_prehispánica_Ingrediente'));
    
    // Filtrar filas para ingredientes de época prehispánica
    const filteredRows = rows.filter(row => {
        if (row.length <= culturaIndex || !row[epocaIngredienteIndex] || !row[culturaIndex]) return false;
        
        const epocaValue = row[epocaIngredienteIndex].trim();
        const culturaValue = row[culturaIndex].trim();
        
        // Solo incluir ingredientes prehispánicos con cultura definida
        return epocaValue.includes('Prehispánico') && culturaValue && culturaValue !== 'NULL';
    });
    
    // Crear un mapa de cultura -> conjunto de ingredientes únicos
    const culturaIngredientes = new Map();
    
    filteredRows.forEach(row => {
        const cultura = row[culturaIndex]?.trim();
        const ingrediente = row[ingredienteIndex]?.trim();
        
        if (cultura && ingrediente) {
            if (!culturaIngredientes.has(cultura)) {
                culturaIngredientes.set(cultura, new Set());
            }
            culturaIngredientes.get(cultura).add(ingrediente);
        }
    });
    
    // Convertir a formato para el gráfico: array de objetos {cultura, count}
    const result = Array.from(culturaIngredientes.entries()).map(([cultura, ingredientes]) => ({
        cultura,
        count: ingredientes.size
    }));
    
    // Ordenar por cantidad de ingredientes (de menor a mayor)
    return result.sort((a, b) => a.count - b.count);
}

// Crear un gráfico radial para culturas
function createCulturalRadialChart(containerId, data) {
    // Verificar si hay datos
    if (!data || data.length === 0) {
        console.warn(`No hay datos para el gráfico cultural`);
        return;
    }
    
    // Eliminar gráfico anterior si existe
    d3.select(`#${containerId}`).selectAll("*").remove();
    
    // Obtener dimensiones reales del contenedor
    const containerWidth = document.getElementById(containerId).clientWidth;
    const containerHeight = document.getElementById(containerId).clientHeight;
    
    // Calcular dimensiones óptimas para el SVG (100% del contenedor)
    const width = containerWidth || 520; // Valor de respaldo reducido en 20px
    const height = containerHeight || 520; // Valor de respaldo reducido en 20px
    const innerRadius = Math.min(width, height) * 0.08; // Hacemos más pequeño el círculo central
    const outerRadius = Math.min(width, height) / 2 - Math.min(width, height) * 0.02; // Reducimos aún más el margen para extender más las raíces
    
    // Crear el SVG con tamaño relativo para que se adapte al contenedor
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMax meet") // Alineamos abajo manteniendo centrado horizontal
        .style("display", "block") // Asegura que el SVG sea un bloque
        .style("margin", "0 auto") // Centrar horizontalmente
        .append("g")
        .attr("transform", `translate(${width/2}, ${height*0.85})`);
    
    // Escala para el radio - haciendo las barras más cortas
    const maxCount = d3.max(data, d => d.count);
    const radiusScale = d3.scaleLinear()
        .domain([0, maxCount * 0.5]) // Aumentamos el dominio para barras más cortas
        .range([innerRadius, outerRadius * 0.9]); // Reducimos el rango para que las barras sean más cortas
    
    // Escala para los ángulos - girando 210 grados (200 + 10) desde la posición original
    const angleScale = d3.scaleBand()
        .domain(data.map(d => d.cultura))
        .range([5 * Math.PI / 6 + (210 * Math.PI / 180), 5 * Math.PI / 6 + (210 * Math.PI / 180) + 2 * Math.PI]) // Posición inicial girada 210 grados
        .padding(0.65); // Ajustamos la separación para mejor distribución de las raíces
    
    // Colores personalizados para las raíces y nodos
    const rootColor = "rgba(131, 87, 43, 0.8)"; // Color base para raíces
    const rootColorLight = "rgba(131, 87, 43, 0.4)"; // Versión más clara para raíces secundarias
    const naranjaLadrillo = "#C03E1D"; // Color naranja ladrillo más saturado para las bolitas (color prehispánico)
    
    // Colores prehispánicos inspirados en arte mexicano antiguo para los tooltips
    const colorPalette = [
        "#9B2226", // Rojo carmín (similar al usado en códices)
        "#BB4D00", // Naranja rojizo (color de cerámica)
        "#AE7C34", // Dorado ocre (color maya)
        "#5F5F41", // Verde oliva (jade)
        "#28666E", // Azul-verde (color turquesa)
        "#073B4C"  // Azul oscuro (color usado en murales)
    ];
    
    // Función para obtener color según índice
    const getPrecolumbianColor = (index) => {
        return colorPalette[index % colorPalette.length];
    };
    
    // Crear elemento para el fondo con motivos prehispánicos
    // Primero creamos los patrones mayas
    const defs = svg.append("defs");
    
    // Patrón Glifo Maya
    const mayaPattern = defs.append("pattern")
        .attr("id", "mayaPattern")
        .attr("width", 60)
        .attr("height", 60)
        .attr("patternUnits", "userSpaceOnUse")
        .attr("patternTransform", "rotate(30)");
    
    // Fondo del patrón
    mayaPattern.append("rect")
        .attr("width", 60)
        .attr("height", 60)
        .attr("fill", "transparent");
    
    // Glifo Maya estilizado 1 (serpiente)
    mayaPattern.append("path")
        .attr("d", "M10,10 Q20,5 30,10 Q40,15 50,10 M10,15 Q20,20 30,15 Q40,10 50,15")
        .attr("stroke", "rgba(192, 62, 29, 0.1)")
        .attr("stroke-width", 5)
        .attr("fill", "none");
    
    // Glifo Maya estilizado 2 (cuadrado con diagonal)
    mayaPattern.append("path")
        .attr("d", "M10,30 H30 V50 H10 Z M10,30 L30,50")
        .attr("stroke", "rgba(192, 62, 29, 0.07)")
        .attr("stroke-width", 5)
        .attr("fill", "none");
    
    // Glifo Maya estilizado 3 (espiral)
    mayaPattern.append("path")
        .attr("d", "M45,30 Q55,35 50,40 Q45,45 40,40 Q35,35 40,30 Q45,25 45,30")
        .attr("stroke", "rgba(192, 62, 29, 0.1)")
        .attr("stroke-width", 5)
        .attr("fill", "none");
    
    // Crear círculo central con el patrón
    svg.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", outerRadius * 1.2) // Hacemos más grande el círculo de fondo 
        .attr("fill", "url(#mayaPattern)")
        .attr("opacity", 0.5);
    
    // Círculo interno decorativo (sin imagen)
    svg.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", innerRadius)
        .attr("fill", "rgba(255, 255, 255, 0.8)")
        .attr("stroke", "rgba(192, 62, 29, 0.3)")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray");
    
    // Círculos concéntricos decorativos (estilo maya)
    for (let i = 1; i <= 3; i++) {
        const radius = innerRadius + (outerRadius - innerRadius) * (i / 4);
        svg.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", radius)
            .attr("fill", "none")
            .attr("stroke", "rgba(192, 62, 29, 0.2)")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", i % 2 === 0 ? "3,3" : "1,1")
            .attr("class", "maya-circle")
            .style("opacity", .5) // Opacidad fija desde el inicio
            .attr("opacity", 1) // Asegurarnos de usar también el atributo opacity
    }
    
    // Crear elementos decorativos en forma de glifos mayas alrededor del círculo
    // Ajustamos la posición para evitar la imagen en la esquina superior derecha
    const numGlifos = 6; // Menos glifos para evitar solapamiento con la imagen
    const baseAngle = 5 * Math.PI / 6 + (210 * Math.PI / 180); // Ángulo base actualizado a 210 grados
    for (let i = 0; i < numGlifos; i++) {
        // Evitamos colocar glifos en la zona superior derecha donde está la imagen
        let angle;
        if (i < numGlifos/3) {
            // Para la primera sección
            angle = baseAngle + (i / (numGlifos/3)) * 0.5 * Math.PI;
        } else if (i < 2 * numGlifos/3) {
            // Para la segunda sección
            angle = baseAngle + 0.6 * Math.PI + ((i - numGlifos/3) / (numGlifos/3)) * 0.6 * Math.PI;
        } else {
            // Para la tercera sección
            angle = baseAngle + 1.4 * Math.PI + ((i - 2 * numGlifos/3) / (numGlifos/3)) * 0.5 * Math.PI;
        }
        
        const radius = (innerRadius + outerRadius) / 8;
        const x = radius * Math.sin(angle);
        const y = -radius * Math.cos(angle);
        
        // Alternar diferentes glifos estilizados
        let glifoPath;
        if (i % 3 === 0) {
            // Glifo sol/estrella
            glifoPath = `M ${x-5},${y} L ${x+5},${y} M ${x},${y-5} L ${x},${y+5} M ${x-3},${y-3} L ${x+3},${y+3} M ${x-3},${y+3} L ${x+3},${y-3}`;
        } else if (i % 3 === 1) {
            // Glifo escalera
            glifoPath = `M ${x-5},${y-5} H ${x+5} V ${y+5} H ${x-5} Z`;
        } else {
            // Glifo espiral
            glifoPath = `M ${x},${y} m -3,0 a 3,3 0 1 0 6,0 a 3,3 0 1 0 -6,0`;
        }
        
        svg.append("path")
            .attr("d", glifoPath)
            .attr("stroke", "rgba(192, 62, 29, 0.2)")
            .attr("stroke-width", 1.5)
            .attr("fill", "none")
            .attr("class", "maya-glifo")
            .style("opacity", 0.2) // Opacidad fija desde el inicio
            .attr("opacity", 0.2) // Asegurarnos de usar también el atributo opacity
    }
        
    // Agregar imagen grande completamente en la esquina superior derecha
    svg.append("image")
        .attr("xlink:href", "img/aperitivo/tlecuilli.png") // Imagen representativa de culturas
        .attr("x", width/2 - innerRadius * 9) // Ajustamos posición en la derecha
        .attr("y", -height * 0.85) // Ajustamos posición en la parte superior
        .attr("width", innerRadius * 10) // Mantenemos el tamaño
        .attr("height", innerRadius * 10) // Mantenemos el tamaño
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("opacity", 0.9) // Un poco más opaca para que se vea mejor
        .style("filter", "drop-shadow(3px 3px 6px rgba(0,0,0,0.25))"); // Sombra más pronunciada
    
    // Escala para el tamaño de las bolitas
    const minCount = d3.min(data, d => d.count);
    const dotScale = d3.scaleLinear()
        .domain([minCount, maxCount])
        .range([5, 10]); // Rango de tamaños aumentado para mayor visibilidad
    
    // Grupo para contener todas las líneas tipo raíces
    const rootsGroup = svg.append("g")
        .attr("class", "roots-group");
    
    // Crear las líneas radiales con estilo de raíces
    // Para cada cultura, creamos una línea principal quebrada y algunas ramificaciones
    data.forEach((d, i) => {
        const angle = angleScale(d.cultura) + angleScale.bandwidth() / 2;
        const startRadius = innerRadius;
        const endRadius = radiusScale(d.count);
        
        // Función para crear el camino de la raíz principal con quiebres aleatorios
        const createRootPath = (angle) => {
            // Número de segmentos para la raíz principal
            const numSegments = 5 + Math.floor(Math.random() * 3); // 5-7 segmentos
            const points = [];
            
            // Punto de inicio (en el círculo interior)
            points.push([
                startRadius * Math.sin(angle),
                -startRadius * Math.cos(angle)
            ]);
            
            // Puntos intermedios con desviaciones aleatorias
            for (let seg = 1; seg < numSegments; seg++) {
                const segRadius = startRadius + ((endRadius - startRadius) * seg / numSegments);
                // Añadir variación al ángulo para que la línea sea quebrada
                const angleVariation = (i % 2 === 0 ? 1 : -1) * (0.08 + Math.random() * 0.12) * Math.sin(seg * Math.PI / numSegments);
                const segAngle = angle + angleVariation;
                
                points.push([
                    segRadius * Math.sin(segAngle),
                    -segRadius * Math.cos(segAngle)
                ]);
            }
            
            // Punto final (en la posición calculada)
            points.push([
                endRadius * Math.sin(angle),
                -endRadius * Math.cos(angle)
            ]);
            
            // Crear un camino suavizado a partir de los puntos
            return d3.line()
                .curve(d3.curveBasis)(points); // Curva suave tipo spline
        };
        
        // Añadir raíz principal
        const mainRoot = rootsGroup.append("path")
            .attr("class", "radial-line main-root")
            .attr("d", createRootPath(angle))
            .attr("stroke", rootColor)
            .attr("stroke-width", 4) // Aumentado en 2px (de 2 a 4)
            .attr("fill", "none")
            .style("opacity", 0) // Inicialmente invisible
            .attr("data-index", i)
            .on("mouseover", function() {
                d3.select(this).attr("stroke-width", 6); // Aumentado para hover (4+2)
            })
            .on("mouseout", function() {
                d3.select(this).attr("stroke-width", 4); // Vuelve al ancho base
            });
        
        // Longitud total de la raíz principal para la animación
        const totalLength = mainRoot.node().getTotalLength();
        
        // Configurar animación tipo dibujo para la raíz principal
        mainRoot
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength);
        
        // Añadir 1-3 raíces secundarias (ramificaciones)
        const numRoots = 1 + Math.floor(Math.random() * 3); // 1-3 raíces secundarias
        
        for (let r = 0; r < numRoots; r++) {
            // Decidir desde qué punto de la raíz principal parte esta raíz secundaria
            const startSegment = 0.2 + Math.random() * 0.5; // Entre 20% y 70% del camino
            const branchStartRadius = startRadius + (endRadius - startRadius) * startSegment;
            
            // Decidir el ángulo de partida (desviación del ángulo principal)
            const branchAngleVariation = (r % 2 === 0 ? 1 : -1) * (0.15 + Math.random() * 0.2);
            const branchStartAngle = angle + branchAngleVariation;
            
            // Crear puntos para la raíz secundaria (más corta y con menos quiebres)
            const branchPoints = [];
            
            // Punto de partida
            branchPoints.push([
                branchStartRadius * Math.sin(branchStartAngle),
                -branchStartRadius * Math.cos(branchStartAngle)
            ]);
            
            // Longitud relativa de esta ramificación (40-80% de la raíz principal)
            const branchLength = 0.4 + Math.random() * 0.4;
            const branchEndRadius = branchStartRadius + (endRadius - branchStartRadius) * branchLength;
            
            // Puntos intermedios (1-2 quiebres)
            const numBranchSegments = 1 + Math.floor(Math.random() * 2);
            
            for (let bseg = 1; bseg <= numBranchSegments; bseg++) {
                const bsegRadius = branchStartRadius + ((branchEndRadius - branchStartRadius) * bseg / (numBranchSegments + 1));
                const bsegAngleVar = (r % 2 === 0 ? -1 : 1) * (0.1 + Math.random() * 0.15);
                const bsegAngle = branchStartAngle + bsegAngleVar;
                
                branchPoints.push([
                    bsegRadius * Math.sin(bsegAngle),
                    -bsegRadius * Math.cos(bsegAngle)
                ]);
            }
            
            // Punto final
            const branchEndAngleVar = (r % 2 === 0 ? -1 : 1) * (0.2 + Math.random() * 0.25);
            const branchEndAngle = branchStartAngle + branchEndAngleVar;
            
            branchPoints.push([
                branchEndRadius * Math.sin(branchEndAngle),
                -branchEndRadius * Math.cos(branchEndAngle)
            ]);
            
            // Crear la raíz secundaria
            const secondaryRoot = rootsGroup.append("path")
                .attr("class", "radial-line secondary-root")
                .attr("d", d3.line().curve(d3.curveBasis)(branchPoints))
                .attr("stroke", rootColorLight)
                .attr("stroke-width", 2 + Math.random() * 1) // Ancho variable y más fino que la raíz principal (aumentado en 1-2px)
                .attr("fill", "none")
                .attr("stroke-dasharray", r % 2 === 0 ? "none" : "4,3") // Algunas raíces punteadas (con separación aumentada)
                .style("opacity", 0) // Inicialmente invisible
                .attr("data-index", i)
                .on("mouseover", function() {
                    d3.select(this).attr("stroke-width", 4); // Aumentado para hover
                })
                .on("mouseout", function() {
                    d3.select(this).attr("stroke-width", 2 + Math.random() * 1); // Vuelve al ancho base
                });
            
            // Configurar animación tipo dibujo para la raíz secundaria
            const secondaryLength = secondaryRoot.node().getTotalLength();
            secondaryRoot
                .attr("stroke-dasharray", secondaryLength + " " + secondaryLength)
                .attr("stroke-dashoffset", secondaryLength);
        }
    });
    
    // Referencia a todas las líneas para animaciones
    const mainRoots = rootsGroup.selectAll(".main-root");
    const secondaryRoots = rootsGroup.selectAll(".secondary-root");
    
    // Crear bolitas en los extremos con color dorado fuerte sin animaciones
    const dots = svg.selectAll(".end-circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "end-circle")
        .attr("cx", d => {
            const angle = angleScale(d.cultura) + angleScale.bandwidth() / 2;
            return radiusScale(d.count) * Math.sin(angle);
        })
        .attr("cy", d => {
            const angle = angleScale(d.cultura) + angleScale.bandwidth() / 2;
            return -radiusScale(d.count) * Math.cos(angle);
        })
        .attr("r", d => dotScale(d.count)) // Radio proporcional
        .attr("fill", naranjaLadrillo) // Color naranja ladrillo para las bolitas
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.2)
        .style("opacity", 0) // Inicialmente ocultas, se mostrarán por completo en animateIfVisible
        .attr("data-index", (d, i) => i) // Para asociar con raíces
        // Sin animación de movimiento para las bolitas
        .on("mouseover", function() {
            const index = +d3.select(this).attr("data-index");
            
            // Aumentar tamaño del círculo
            d3.select(this)
                .attr("r", d => dotScale(d.count) * 1.8)
                .attr("filter", "drop-shadow(0 0 5px rgba(192, 62, 29, 1))");
                
            // Mostrar las raíces asociadas sin animación
            rootsGroup.selectAll(`.radial-line[data-index="${index}"]`)
                .style("opacity", 1)
                .attr("opacity", 1)
                .attr("stroke-width", function() {
                    return d3.select(this).classed("main-root") ? 6 : 4; // Aumentado para ser consistente
                });
                
            // Reducir opacidad de las otras bolitas sin pausar sus animaciones
            dots.filter(function() { return +d3.select(this).attr("data-index") !== index; })
                .style("opacity", 0.3)
                .attr("opacity", 0.3);
        })
        .on("mouseout", function() {
            const index = +d3.select(this).attr("data-index");
            
            // Reanudar la animación y restaurar tamaño
            d3.select(this)
                .style("animation-play-state", "running") // Reanudar la animación
                .attr("r", d => dotScale(d.count))
                .attr("filter", "none")
                .style("transform", ""); // Remover el transform fijo
                
            // Ocultar las raíces sin animación
            rootsGroup.selectAll(`.radial-line[data-index="${index}"]`)
                .style("opacity", 0)
                .attr("opacity", 0)
                .attr("stroke-width", function() {
                    return d3.select(this).classed("main-root") ? 4 : 2 + Math.random() * 1; // Actualizado para ser consistente
                });
                
            // Restaurar opacidad de todas las bolitas sin animación
            dots.style("opacity", 1)
                .attr("opacity", 1);
        });
        
    // Crear tooltips para mostrar la información de la cultura
    const tooltip = d3.select("body").append("div")
        .attr("class", "chart-tooltip-prehispanic")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "#F0EBCE") 
        .style("border", "2px solid " + naranjaLadrillo)
        .style("border-radius", "0") 
        .style("padding", "12px 18px")
        .style("font-family", "'Libre Baskerville', serif")
        .style("font-size", "13px")
        .style("color", "#5F5F41")
        .style("pointer-events", "none")
        .style("z-index", 9999) // Z-index muy alto para estar por encima de todo
        .style("box-shadow", "4px 4px 0 rgba(192, 62, 29, 0.5)")
        .style("max-width", "200px")
        .style("min-width", "140px")
        .style("text-align", "center")
        .style("transform", "rotate(-1deg)")
        .style("transition", "none"); // Sin transiciones para evitar problemas
        
    // Añadir interacción de tooltip a las bolitas
    dots.on("mouseover.tooltip", function(event, d) {
            const index = +d3.select(this).attr("data-index");
            const mainColor = getPrecolumbianColor(index);
            
            tooltip
                .style("opacity", 0.98)
                .style("border-color", mainColor)
                .style("z-index", 9999); // Aumentamos el z-index para asegurar que esté siempre por encima
                
            // Generar una descripción personalizada para cada cultura
            const getCulturaInfo = (cultura) => {
                const descripciones = {
                    "Maya": "Desarrollaron técnicas avanzadas para cultivar cacao y domesticaron la abeja melipona para obtener miel. Cultivaban chile habanero y achiote.",
                    "Azteca": "Creadores del pochtecayotl, un sistema de mercados donde intercambiaban especias, semillas y textiles. Fueron expertos en técnicas de conservación de alimentos.",
                    "Mexica": "Cultivaron chinampas, islas artificiales donde sembraban maíz, chile, frijol y calabaza. El emperador Moctezuma tomaba xocolatl espumoso adornado con oro.",
                    "Zapoteca": "Maestros de la fermentación del maguey, creando bebidas sagradas como el tepache. Conocidos por sus técnicas de secado de chile.",
                    "Otomí": "Hábiles recolectores de insectos comestibles como el escamol. Desarrollaron técnicas para extraer aguamiel del maguey.",
                    "Olmeca": "Primera gran civilización en domesticar el chile. Desarrollaron las primeras técnicas de nixtamalización del maíz.",
                    "Mixteca": "Expertos en técnicas de recolección y preparación de hongos silvestres. Crearon colorantes naturales a partir de la grana cochinilla.",
                    "Tolteca": "Refinaron técnicas culinarias y crearon platos ceremoniales con flores comestibles. Maestros del pulque sagrado.",
                    "Purépecha": "Desarrollaron técnicas de pesca en el lago de Pátzcuaro. Crearon la charanda, bebida fermentada tradicional.",
                    "Totonaca": "Domesticaron la vainilla, utilizándola en bebidas ceremoniales y como medicina. Técnicas avanzadas de pesca y conservación de mariscos."
                };
                
                return descripciones[cultura] || "Aportaron técnicas culinarias e ingredientes únicos a la gastronomía mexicana ancestral.";
            };
            
            // Símbolos mayas estilizados para decorar el tooltip
            const simbolosMayas = [
                "╔══╗", "┌──┐", "╭──╮", "▄▄▄▄", "■■■■", "◆◆◆◆", "▲▼▲▼", "●○●○"
            ];
            
            // Seleccionar dos símbolos aleatorios
            const simbolo1 = simbolosMayas[Math.floor(Math.random() * simbolosMayas.length)];
            const simbolo2 = simbolosMayas[Math.floor(Math.random() * simbolosMayas.length)];
            
            tooltip.html(`
                <div style="position: relative;">
                    <div style="position: absolute; top: -10px; left: -10px; right: -10px; height: 5px; 
                         background: repeating-linear-gradient(90deg, ${mainColor}, ${mainColor} 5px, transparent 5px, transparent 10px);"></div>
                         
                    <div style="text-align: center; font-size: 10px; color: ${mainColor}; letter-spacing: 4px;">
                        ${simbolo1}
                    </div>
                    
                    <div style="font-weight: bold; font-size: 16px; margin: 2px 0 6px 0; color: ${mainColor}; text-transform: uppercase; text-align: center; border-bottom: 1px dotted ${mainColor}; padding-bottom: 4px;">
                        ${d.cultura}
                    </div>
                    
                    <div style="color: #444; font-size: 13px; font-style: italic; text-align: center; margin: 4px 0;">
                        <span style="color: ${mainColor}; font-weight: bold;">${d.count}</span> ingrediente${d.count !== 1 ? 's' : ''} único${d.count !== 1 ? 's' : ''}
                    </div>
                    
                    <div style="margin: 8px 0; font-size: 12px; color: #555; border-left: 3px solid ${mainColor}; padding: 4px 0 4px 8px; line-height: 1.4; text-align: left; background-color: rgba(255,255,255,0.5);">
                        ${getCulturaInfo(d.cultura)}
                    </div>
                    
                    <div style="text-align: center; font-size: 10px; color: ${mainColor}; letter-spacing: 4px; margin-top: 4px;">
                        ${simbolo2}
                    </div>
                    
                    <div style="margin-top: 5px; font-size: 11px; color: #777; text-align: center;">
                        Cultura prehispánica de México
                    </div>
                    
                    <div style="position: absolute; bottom: -10px; left: -10px; right: -10px; height: 5px; 
                         background: repeating-linear-gradient(90deg, ${mainColor}, ${mainColor} 5px, transparent 5px, transparent 10px);"></div>
                </div>
            `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout.tooltip", function() {
            tooltip
                .style("opacity", 0);
        })
        .style("cursor", "pointer");
        
    // Función para comprobar si el elemento está visible en el viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom >= 0
        );
    }
    
    // Función para animar las raíces y bolitas cuando el elemento es visible
    function animateIfVisible() {
        if (isInViewport(document.getElementById(containerId))) {
            // Mostrar bolitas inmediatamente sin animación
            dots
                .style("opacity", 1)
                .attr("opacity", 1)
                .attr("r", d => dotScale(d.count));
                
            // Animar raíces principales con efecto de dibujo, sin cambiar la opacidad
            mainRoots
                .style("opacity", 0.8) // Opacidad fija
                .attr("opacity", 0.8) // Asegurar opacidad con atributo también
                .transition()
                .duration(1500)
                .delay((d, i) => i * 150) // Retraso escalonado
                .ease(d3.easeQuadOut)
                .attr("stroke-dashoffset", 0) // Dibujar desde el inicio hasta el final
                .on("end", function(d, i) {
                    // Al terminar la animación de la raíz principal, animar sus ramificaciones
                    const index = d3.select(this).attr("data-index");
                    
                    secondaryRoots.filter(function() {
                        return d3.select(this).attr("data-index") === index;
                    })
                    .style("opacity", 0.4) // Opacidad fija
                    .attr("opacity", 0.4) // Asegurar opacidad con atributo también
                    .transition()
                    .duration(1000)
                    .ease(d3.easeQuadOut)
                    .attr("stroke-dashoffset", 0); // Solo animamos el trazo, no la opacidad
                });
        }
    }
    
    // Iniciar la animación si el elemento ya es visible
    animateIfVisible();
    
    // Controlar la animación al hacer scroll
    window.addEventListener('scroll', animateIfVisible);
}

// Función principal para cargar datos y crear gráfico
function createCulturalChart() {
    console.log("Iniciando creación del gráfico cultural radial...");
    
    // Cargar el archivo CSV
    const csvPath = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) + '/json/platillos_expandido.csv';
    
    fetch(csvPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.text();
        })
        .then(csvData => {
            if (!csvData || csvData.length === 0) {
                console.error("El archivo CSV está vacío");
                return;
            }
            
            try {
                const data = processCulturalData(csvData);
                console.log("Datos procesados para culturas:", data.length, "culturas encontradas");
                
                const containerId = "cultural-radial-chart";
                const container = document.getElementById(containerId);
                
                if (!container) {
                    console.error(`Contenedor #${containerId} no encontrado en el DOM`);
                    return;
                }
                
                // Añadir título con instrucción
                const titleContainer = document.querySelector(`#${containerId}`).previousElementSibling;
                if (titleContainer && titleContainer.classList.contains('radial-chart-title')) {
                    // Añadir la instrucción al título existente
                    titleContainer.innerHTML = `Culturas más representativas de la época prehispánica <span style="color: #777; font-size: 0.8em; font-weight: normal; font-style: italic;">(Toca las bolitas para ver detalles)</span>`;
                }
                
                createCulturalRadialChart(containerId, data);
                console.log("Gráfico cultural creado correctamente");
            } catch (err) {
                console.error("Error procesando datos culturales:", err);
            }
        })
        .catch(error => {
            console.error('Error cargando los datos para el gráfico cultural:', error);
            
            // Mostrar mensaje de error
            document.getElementById('cultural-radial-chart').innerHTML = `
                <div style="text-align:center; padding:20px; color:#833; font-family:sans-serif">
                    <p>Error cargando los datos culturales: ${error.message}</p>
                </div>`;
        });
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar un momento para asegurar que todos los elementos estén disponibles
    setTimeout(createCulturalChart, 700);
});