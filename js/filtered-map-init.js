/**
 * Filtered Connection Map initialization
 */
let filteredMapInstance;

document.addEventListener('DOMContentLoaded', function() {
    const mapContainer = document.getElementById('filtered-connection-map');
    if (mapContainer) {
        filteredMapInstance = new FilteredConnectionMap('filtered-connection-map');
        filteredMapInstance.initialize();
    }
});

// Global function to show the tutorial again
function resetMapTutorial() {
    window.forceShowTutorial = true;
    const mapContainer = document.getElementById('filtered-connection-map');
    if (mapContainer) {
        const event = new Event('mouseenter');
        mapContainer.dispatchEvent(event);
    }
}
