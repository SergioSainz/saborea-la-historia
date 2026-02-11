/**
 * Section Loader - Orchestrates loading HTML sections and scripts
 *
 * Responsibilities:
 * 1. DOMContentLoaded shim for dynamically loaded scripts
 * 2. Load all sections in parallel with Promise.all + fetch()
 * 3. Re-initialize Flourish embeds (scripts inside innerHTML don't execute)
 * 4. Load scripts in order respecting dependencies
 */

(function() {
    'use strict';

    // ========================================
    // 1. DOMContentLoaded Shim
    // ========================================
    // When scripts are loaded dynamically after DOMContentLoaded has already fired,
    // listeners registered with addEventListener('DOMContentLoaded', fn) never execute.
    // This shim intercepts those calls and runs fn immediately if the event has passed.

    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (this === document && type === 'DOMContentLoaded') {
            if (document.readyState === 'loading') {
                // DOM not ready yet, register normally
                originalAddEventListener.call(this, type, listener, options);
            } else {
                // DOM already ready, execute immediately
                setTimeout(listener, 0);
            }
        } else {
            originalAddEventListener.call(this, type, listener, options);
        }
    };

    // ========================================
    // 2. Section definitions
    // ========================================
    const sections = [
        { id: 'section-hero',          file: 'sections/hero.html' },
        { id: 'section-intro-menu',    file: 'sections/intro-menu.html' },
        // aperitivo ahora está inline en index.html
        { id: 'section-primer-plato',  file: 'sections/primer-plato.html' },
        { id: 'section-segundo-plato', file: 'sections/segundo-plato.html' },
        { id: 'section-postre',        file: 'sections/postre.html' },
        { id: 'section-footer',        file: 'sections/footer.html' }
    ];

    // ========================================
    // 3. Script loading groups (ordered)
    // ========================================
    const scriptGroups = [
        // Group 1: Cursor
        ['js/custom-cursor.js'],
        // Group 2: Animations (needs .content-block in DOM)
        ['js/animations.js'],
        // Group 3: Aperitivo scripts
        [
            'js/aperitivo.js',
            'js/prehispanicTooltips.js',
            'js/animacion-num.js',
            'js/primerPlatoMap.js',
            'js/categoryRing.js',
            'js/circularGraph.js',
            'js/ingredientCharts.js',
            'js/displayIngredientNotes.js',
            'js/radialBarChart.js',
            'js/culturalRadialChart.js',
            'js/ingredientAnimation.js',
            'js/fullNetworkGraph.js'
        ],
        // Group 4: Primer Plato (map)
        [
            'js/filteredConnectionMap.js',
            'js/filtered-map-init.js'
        ],
        // Group 5: Segundo Plato (TypeIt poem)
        ['js/segundo-plato.js'],
        // Group 6: Mobile nav (needs all sections for offset calculation)
        ['js/mobile-nav.js']
    ];

    // ========================================
    // Helper: Load a single script
    // ========================================
    function loadScript(src) {
        return new Promise(function(resolve, reject) {
            var script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = function() {
                console.warn('Failed to load script: ' + src);
                resolve(); // Don't break chain on failure
            };
            document.body.appendChild(script);
        });
    }

    // ========================================
    // Helper: Load a group of scripts in parallel
    // ========================================
    function loadScriptGroup(group) {
        return Promise.all(group.map(loadScript));
    }

    // ========================================
    // Helper: Load script groups sequentially
    // ========================================
    function loadScriptGroupsSequentially(groups) {
        return groups.reduce(function(chain, group) {
            return chain.then(function() {
                return loadScriptGroup(group);
            });
        }, Promise.resolve());
    }

    // ========================================
    // 4. Re-initialize Flourish embeds
    // ========================================
    function reinitFlourish() {
        var flourishEmbeds = document.querySelectorAll('.flourish-embed');
        if (flourishEmbeds.length === 0) return;

        flourishEmbeds.forEach(function(embed) {
            // Clear any existing content that innerHTML might have left
            var dataSrc = embed.getAttribute('data-src');
            var dataHeight = embed.getAttribute('data-height');
            if (!dataSrc) return;

            // Clear and recreate
            embed.innerHTML = '';

            // Create and inject the Flourish script
            var script = document.createElement('script');
            script.src = 'https://public.flourish.studio/resources/embed.js';
            embed.appendChild(script);
        });
    }

    // ========================================
    // 5. Main: Load sections, then scripts
    // ========================================
    function init() {
        // Fetch all sections in parallel
        var cacheBust = '?v=' + Date.now();
        var fetchPromises = sections.map(function(section) {
            return fetch(section.file + cacheBust)
                .then(function(response) {
                    if (!response.ok) throw new Error('Failed to fetch ' + section.file);
                    return response.text();
                })
                .then(function(html) {
                    return { id: section.id, html: html };
                })
                .catch(function(err) {
                    console.error(err);
                    return { id: section.id, html: '<p>Error loading section.</p>' };
                });
        });

        Promise.all(fetchPromises)
            .then(function(results) {
                // Insert all sections into DOM (in order)
                results.forEach(function(result) {
                    var container = document.getElementById(result.id);
                    if (container) {
                        container.innerHTML = result.html;
                    }
                });

                // Re-initialize Flourish embeds
                reinitFlourish();

                // Load scripts in dependency order
                return loadScriptGroupsSequentially(scriptGroups);
            })
            .then(function() {
                console.log('All sections and scripts loaded successfully.');
            })
            .catch(function(err) {
                console.error('Section loader error:', err);
            });
    }

    // Start loading when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
