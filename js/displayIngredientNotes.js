/**
 * Script para mostrar notas culturales de ingredientes
 * Este script asegura que las notas culturales se muestren correctamente
 */

document.addEventListener('DOMContentLoaded', () => {
    // Datos de notas culturales
    const ingredientNotes = {
        'maiz': {
            note: "Según el Popol Vuh, los dioses crearon al hombre del maíz. Sin maíz no hay país.",
            color: '#BC7D2D' // Color tierra dorado para maíz
        },
        'frijol': {
            note: "Pilar de la alimentación prehispánica, cultivado siempre junto al maíz y la calabaza.",
            color: '#4D3B27' // Color tierra marrón oscuro para frijol
        },
        'chile': {
            note: "Más que sabor, era elemento ritual; tenía usos medicinales, ceremoniales y como conservador de alimentos.",
            color: '#8B3E2F' // Color tierra rojizo para chile
        },
        'calabaza': {
            note: "Se usaban la pulpa, las semillas y hasta las cáscaras como utensilios.",
            color: '#C2A059' // Color tierra ocre para calabaza
        },
        'cacao': {
            note: "Tan valioso que se usaba como moneda. Moctezuma bebía 50 tazas diarias de espumoso chocolate.",
            color: '#51341A' // Color tierra chocolate para cacao
        }
    };

    // Función para mostrar la nota cultural
    function displayNote(containerId, note, color) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div style="background-color: transparent; border-left: 3px solid ${color}; padding: 12px; font-style: italic; margin-top: 15px;">
                <p class="mb-0" style="font-size: 0.9rem; color: #666;">"${note}"</p>
            </div>
        `;
    }
    
    // Mostrar todas las notas
    Object.keys(ingredientNotes).forEach(ingredient => {
        displayNote(
            `${ingredient}-nota`,
            ingredientNotes[ingredient].note,
            ingredientNotes[ingredient].color
        );
    });
});