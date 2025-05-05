# Máscaras SVG para Ingredientes

Este directorio contiene las máscaras SVG utilizadas para generar formas de ingredientes en la visualización del grafo circular.

## Estructura de Directorios

- `maiz.svg` - Máscara de maíz (directamente en la raíz)
- `chile/` - Directorio para máscara de chile
- `frijol/` - Directorio para máscara de frijol
- `calabaza/` - Directorio para máscara de calabaza
- `cacao/` - Directorio para máscara de cacao

## Formato Requerido

Para que las máscaras funcionen correctamente, los archivos SVG deben:

1. Contener un elemento `<path>` con la forma del ingrediente
2. Estar correctamente formateados como SVG válido
3. Tener un tamaño razonable para ser cargados eficientemente

## Implementación

La visualización intentará cargar la máscara SVG correspondiente al ingrediente seleccionado. 
Si la máscara no está disponible o hay algún error al cargarla, se utilizará un fallback matemático
para generar la forma.

## Agregar Nuevas Máscaras

Para agregar una nueva máscara:

1. Crear el archivo SVG con la forma deseada
2. Colocarlo en el directorio correspondiente
3. Verificar que el archivo sea válido y contenga un elemento `<path>`

No es necesario modificar el código JavaScript, ya que la visualización detectará automáticamente
los archivos SVG disponibles.