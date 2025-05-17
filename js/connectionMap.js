// connectionMap.js

class ConnectionMap {
    constructor(map) {
        this.map = map;
        this.connections = [];
        this.animatedLines = [];
        this.animationFrameId = null;
        this.startTime = Date.now();
    }

    // Initialize the map with connections
    initialize() {
        // Wait for map to load
        if (this.map.loaded()) {
            this.setupLayers();
        } else {
            this.map.on('load', () => {
                this.setupLayers();
            });
        }
    }

    // Setup necessary layers for connections
    setupLayers() {
        // Add source for connections
        this.map.addSource('connections', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': []
            }
        });

        // Add animated dots source
        this.map.addSource('animated-dots', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': []
            }
        });

        // Layer for connection lines
        this.map.addLayer({
            'id': 'connection-lines',
            'type': 'line',
            'source': 'connections',
            'paint': {
                'line-color': '#9B2226',
                'line-width': 2,
                'line-opacity': 0.7
            }
        });

        // Layer for animated dots
        this.map.addLayer({
            'id': 'animated-dots',
            'type': 'circle',
            'source': 'animated-dots',
            'paint': {
                'circle-radius': 6,
                'circle-color': '#BB4D00',
                'circle-opacity': 0.9,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });

        // Start with some example connections
        this.addExampleConnections();
    }

    // Add example connections between Mexican cities
    addExampleConnections() {
        const connections = [
            {
                from: { name: 'Ciudad de México', coordinates: [-99.1332, 19.4326] },
                to: { name: 'Guadalajara', coordinates: [-103.3468, 20.6597] }
            },
            {
                from: { name: 'Ciudad de México', coordinates: [-99.1332, 19.4326] },
                to: { name: 'Monterrey', coordinates: [-100.3161, 25.6866] }
            },
            {
                from: { name: 'Guadalajara', coordinates: [-103.3468, 20.6597] },
                to: { name: 'Tijuana', coordinates: [-117.0382, 32.5149] }
            },
            {
                from: { name: 'Monterrey', coordinates: [-100.3161, 25.6866] },
                to: { name: 'Cancún', coordinates: [-86.8515, 21.1619] }
            },
            {
                from: { name: 'Ciudad de México', coordinates: [-99.1332, 19.4326] },
                to: { name: 'Oaxaca', coordinates: [-96.7266, 17.0732] }
            }
        ];

        connections.forEach(conn => {
            this.addConnection(conn.from, conn.to);
        });

        // Center map on Mexico
        this.map.flyTo({
            center: [-102.5528, 23.6345],
            zoom: 4.5,
            duration: 2000
        });
    }

    // Add a connection between two points
    addConnection(from, to) {
        const connection = {
            id: `connection-${this.connections.length}`,
            from: from,
            to: to,
            line: {
                'type': 'Feature',
                'geometry': {
                    'type': 'LineString',
                    'coordinates': [from.coordinates, to.coordinates]
                },
                'properties': {
                    'from': from.name,
                    'to': to.name
                }
            }
        };

        this.connections.push(connection);
        this.updateConnectionsLayer();
        this.startAnimation();
    }

    // Update the connections layer with all lines
    updateConnectionsLayer() {
        const features = this.connections.map(conn => conn.line);
        this.map.getSource('connections').setData({
            'type': 'FeatureCollection',
            'features': features
        });
    }

    // Start the animation
    startAnimation() {
        if (!this.animationFrameId) {
            this.animate();
        }
    }

    // Stop the animation
    stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    // Animation loop
    animate() {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - this.startTime) / 1000; // in seconds

        const animatedFeatures = [];

        this.connections.forEach((connection, index) => {
            // Calculate position along the line
            const duration = 3; // seconds for one complete journey
            const offset = (index * 0.5); // stagger the animations
            const progress = ((elapsedTime + offset) % duration) / duration;

            // Interpolate position
            const from = connection.from.coordinates;
            const to = connection.to.coordinates;
            const lng = from[0] + (to[0] - from[0]) * progress;
            const lat = from[1] + (to[1] - from[1]) * progress;

            // Create animated dot feature
            animatedFeatures.push({
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [lng, lat]
                },
                'properties': {
                    'progress': progress,
                    'connectionId': connection.id
                }
            });
        });

        // Update animated dots
        this.map.getSource('animated-dots').setData({
            'type': 'FeatureCollection',
            'features': animatedFeatures
        });

        // Continue animation
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    // Add pulse effect at endpoints
    addPulseMarkers() {
        // Get unique locations
        const locations = new Map();
        
        this.connections.forEach(conn => {
            locations.set(conn.from.name, conn.from.coordinates);
            locations.set(conn.to.name, conn.to.coordinates);
        });

        // Add pulse markers for each location
        locations.forEach((coordinates, name) => {
            // Create a DOM element for the marker
            const el = document.createElement('div');
            el.className = 'pulse-marker';
            el.style.width = '20px';
            el.style.height = '20px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = '#9B2226';
            el.style.position = 'relative';

            // Add pulse animation
            const pulse = document.createElement('div');
            pulse.style.position = 'absolute';
            pulse.style.top = '50%';
            pulse.style.left = '50%';
            pulse.style.width = '100%';
            pulse.style.height = '100%';
            pulse.style.borderRadius = '50%';
            pulse.style.backgroundColor = '#9B2226';
            pulse.style.transform = 'translate(-50%, -50%)';
            pulse.style.animation = 'pulse 2s infinite';
            el.appendChild(pulse);

            // Add marker to map
            new maplibregl.Marker({
                element: el,
                anchor: 'center'
            })
                .setLngLat(coordinates)
                .addTo(this.map);
        });

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(2.5);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Add custom connections
    addCustomConnection(fromCoords, toCoords, fromName = 'Point A', toName = 'Point B') {
        this.addConnection(
            { name: fromName, coordinates: fromCoords },
            { name: toName, coordinates: toCoords }
        );
    }

    // Clear all connections
    clearConnections() {
        this.connections = [];
        this.updateConnectionsLayer();
        this.map.getSource('animated-dots').setData({
            'type': 'FeatureCollection',
            'features': []
        });
    }

    // Dispose of the animation and cleanup
    dispose() {
        this.stopAnimation();
        this.clearConnections();
    }
}

// Export for use
window.ConnectionMap = ConnectionMap;