/**
 * Particle Bar Chart — p5.js instance mode
 * ══════════════════════════════════════════
 *
 * ALL bars animate simultaneously.
 * Responsive particle size:
 *   Desktop (≥768 px viewport): R = 20  (40 px diameter)
 *   Mobile  (<768 px viewport): R = 6   (12 px diameter)
 *
 * STACKING / PACKING
 *   Spatial hash grid → multi-pass relaxation → displacement settle.
 *
 * RENDER ORDER
 *   1. Ground shadow  2. Base grains  3. Floor line
 *   4. Data particles 5. Labels       6. Hover
 */

/* ============================================================
   DATA
   ============================================================ */
var datosPrehistoricos = [
    { cultura: "Maya",      count: 42 },
    { cultura: "Mexica",    count: 38 },
    { cultura: "Azteca",    count: 35 },
    { cultura: "Zapoteca",  count: 30 },
    { cultura: "Mixteca",   count: 26 },
    { cultura: "Olmeca",    count: 23 },
    { cultura: "Otomí",     count: 18 },
    { cultura: "Totonaca",  count: 15 },
    { cultura: "Purépecha", count: 12 },
    { cultura: "Tolteca",   count: 10 }
];

var descripcionesCulturas = {
    "Maya":      "Cultivaban cacao, chile habanero y achiote. Domesticaron la abeja melipona para obtener miel.",
    "Mexica":    "Chinampas donde sembraban maíz, chile, frijol y calabaza. Moctezuma tomaba xocolatl espumoso.",
    "Azteca":    "Creadores del pochtecayotl, expertos en conservación de alimentos con especias y semillas.",
    "Zapoteca":  "Maestros de la fermentación del maguey. Conocidos por técnicas de secado de chile.",
    "Mixteca":   "Expertos en hongos silvestres. Crearon colorantes con grana cochinilla.",
    "Olmeca":    "Primera civilización en domesticar el chile. Pioneros de la nixtamalización.",
    "Otomí":     "Recolectores de escamoles. Técnicas para extraer aguamiel del maguey.",
    "Totonaca":  "Domesticaron la vainilla para bebidas ceremoniales y medicina.",
    "Purépecha": "Técnicas de pesca en el lago de Pátzcuaro. Crearon la charanda.",
    "Tolteca":   "Platos ceremoniales con flores comestibles. Maestros del pulque sagrado."
};

var ingredientesPorCultura = {
    "Maya":      "Cacao, chile habanero, achiote, miel",
    "Mexica":    "Maíz, chile, frijol, calabaza, cacao",
    "Azteca":    "Amaranto, chía, especias, semillas",
    "Zapoteca":  "Maguey, chile, tepache, maíz",
    "Mixteca":   "Hongos, grana cochinilla, maíz, frijol",
    "Olmeca":    "Chile, maíz nixtamalizado, cacao",
    "Otomí":     "Escamoles, aguamiel, maguey, quelites",
    "Totonaca":  "Vainilla, mariscos, maíz, chile",
    "Purépecha": "Pescado, charanda, maíz, uchepos",
    "Tolteca":   "Flores comestibles, pulque, maíz"
};

var culturePalettes = {
    "Maya":      { base: [178, 80, 42],  light: [205, 115, 70] },
    "Mexica":    { base: [190, 95, 50],  light: [215, 130, 80] },
    "Azteca":    { base: [195, 140, 60], light: [220, 175, 90] },
    "Zapoteca":  { base: [170, 120, 65], light: [200, 155, 95] },
    "Mixteca":   { base: [160, 105, 55], light: [190, 140, 85] },
    "Olmeca":    { base: [140, 90, 50],  light: [175, 125, 80] },
    "Tolteca":   { base: [185, 160, 120],light: [210, 190, 155] },
    "Otomí":     { base: [175, 130, 80], light: [205, 165, 115] },
    "Totonaca":  { base: [200, 155, 85], light: [225, 185, 120] },
    "Purépecha": { base: [165, 115, 70], light: [195, 150, 105] }
};

/* ============================================================
   SPATIAL HASH GRID
   ============================================================ */
function SpatialHash(cellSize) {
    this.cell = cellSize;
    this.inv = 1 / cellSize;
    this.map = {};
}
SpatialHash.prototype.clear = function() { this.map = {}; };
SpatialHash.prototype.key = function(cx, cy) { return cx + ',' + cy; };
SpatialHash.prototype.insert = function(p) {
    var cx = Math.floor(p.x * this.inv);
    var cy = Math.floor(p.y * this.inv);
    var k = this.key(cx, cy);
    if (!this.map[k]) this.map[k] = [];
    this.map[k].push(p);
};
SpatialHash.prototype.query = function(px, py) {
    var cx = Math.floor(px * this.inv);
    var cy = Math.floor(py * this.inv);
    var result = [];
    for (var dx = -1; dx <= 1; dx++) {
        for (var dy = -1; dy <= 1; dy++) {
            var k = this.key(cx + dx, cy + dy);
            var cell = this.map[k];
            if (cell) {
                for (var i = 0; i < cell.length; i++) result.push(cell[i]);
            }
        }
    }
    return result;
};

/* ============================================================
   MAIN
   ============================================================ */
function createCulturalRadialChart() {
    var containerId = "cultural-radial-chart";
    var container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    if (window._particleChartP5) {
        window._particleChartP5.remove();
        window._particleChartP5 = null;
    }

    var prefersReducedMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var sketch = function(p) {

        /* ─── Responsive breakpoint ─── */
        var IS_MOBILE = window.innerWidth < 768;

        /* ─── Layout ─── */
        var W, H;
        var GAP = IS_MOBILE ? 2 : 0;
        var PAD = IS_MOBILE
            ? { top: 10, bottom: 45, left: 8, right: 8 }
            : { top: 10, bottom: 55, left: 6, right: 6 };
        var N = datosPrehistoricos.length;
        var maxCount = 42;

        /* ─── Particle sizes — adaptive ───
           Target R, but cap so at least 2 particles fit per row.
           This keeps columns short and avoids wasted vertical space. */
        var TARGET_R = IS_MOBILE ? 5 : 12.6;
        var R, D;   // set in setup() after we know W

        /* ─── Physics ─── */
        var GRAVITY       = IS_MOBILE ? 0.35 : 0.50;
        var RESTITUTION   = 0.02;
        var WALL_FRICTION = 0.7;
        var AIR_DAMPING   = 0.99;
        var RELAX_ITERS   = 6;
        var SPAWN_RATE    = IS_MOBILE ? 3 : 2;

        /* ─── Settle (displacement-based) ─── */
        var SETTLE_DISP   = 0.12;
        var SETTLE_FRAMES = 25;
        var MAX_SETTLE    = 240;

        /* ─── Base decorative particles ─── */
        var BASE_R_MIN, BASE_R_MAX;
        var BASE_ALPHA_MIN  = IS_MOBILE ? 30  : 60;
        var BASE_ALPHA_MAX  = IS_MOBILE ? 70  : 130;
        var BASE_MULTIPLIER = IS_MOBILE ? 5   : 12;
        var BASE_ZONE_ABOVE = IS_MOBILE ? 6   : 12;
        var BASE_ZONE_BELOW = IS_MOBILE ? 10  : 16;

        /* ─── State ─── */
        var bars = [];
        var baseParticles = [];
        var spatialHash;
        var allDone = false;
        var frameCount = 0;
        var hoveredBar = -1;
        var lastMX = 0, lastMY = 0;

        /* ════════════════════════════════════════
           SETUP
           ════════════════════════════════════════ */
        p.setup = function() {
            W = container.clientWidth || 480;

            /* Compute bar width, then cap R so ≥2 particles fit per row */
            var chartW = W - PAD.left - PAD.right;
            var barW = (chartW - GAP * (N - 1)) / N;
            var maxR = Math.floor((barW / 4) * 10) / 10;  // barW >= 2*D = 4*R
            R = Math.min(TARGET_R, maxR);
            D = R * 2;

            /* Scale base particle sizes relative to R */
            BASE_R_MIN = R * 0.3;
            BASE_R_MAX = R * 0.6;

            spatialHash = new SpatialHash(D);

            var cols = Math.max(2, Math.floor(barW / D));
            var rows = Math.ceil(maxCount / cols);
            var neededChartH = rows * D + D * 1.5;

            H = Math.max(neededChartH + PAD.top + PAD.bottom, IS_MOBILE ? 300 : 400);

            p.createCanvas(W, H).parent(containerId);
            p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
            p.noStroke();

            buildBars();
            generateBaseParticles();

            if (prefersReducedMotion) {
                settleAllInstantly();
                allDone = true;
                drawScene();
                p.noLoop();
            }
        };

        /* ════════════════════════════════════════
           BUILD BAR BINS
           ════════════════════════════════════════ */
        function buildBars() {
            var chartW = W - PAD.left - PAD.right;
            var barW = (chartW - GAP * (N - 1)) / N;
            var chartH = H - PAD.top - PAD.bottom;

            bars = [];
            for (var i = 0; i < N; i++) {
                var d = datosPrehistoricos[i];
                var pal = culturePalettes[d.cultura] || culturePalettes["Maya"];
                var x = PAD.left + i * (barW + GAP);
                var floorY = PAD.top + chartH;

                bars.push({
                    cultura: d.cultura,
                    count: d.count,
                    index: i,
                    x: x,
                    x2: x + barW,
                    w: barW,
                    floorY: floorY,
                    pal: pal,
                    particles: [],
                    spawned: 0,
                    target: d.count,
                    phase: 'idle',
                    settleCounter: 0,
                    settleTotal: 0
                });
            }
        }

        /* ════════════════════════════════════════
           COLOR HELPER
           ════════════════════════════════════════ */
        function makeColor(pal) {
            var t = Math.random();
            return [
                Math.floor(pal.base[0] + (pal.light[0] - pal.base[0]) * t + (Math.random() - 0.5) * 12),
                Math.floor(pal.base[1] + (pal.light[1] - pal.base[1]) * t + (Math.random() - 0.5) * 12),
                Math.floor(pal.base[2] + (pal.light[2] - pal.base[2]) * t + (Math.random() - 0.5) * 12)
            ];
        }

        /* ════════════════════════════════════════
           SPAWN
           ════════════════════════════════════════ */
        function spawnParticle(bar) {
            var px = bar.x + R + Math.random() * Math.max(0, bar.w - D);
            var highestY = bar.floorY;
            for (var i = 0; i < bar.particles.length; i++) {
                if (bar.particles[i].y < highestY) highestY = bar.particles[i].y;
            }
            var py = Math.min(highestY - D * 4, PAD.top + 20);
            py = Math.max(PAD.top - 10, py);

            bar.particles.push({
                x: px, y: py,
                vx: 0, vy: 0,
                px: px, py: py,
                r: R,
                col: makeColor(bar.pal),
                id: bar.spawned
            });
            bar.spawned++;
        }

        /* ════════════════════════════════════════
           CLAMP TO BIN
           ════════════════════════════════════════ */
        function clampToBin(part, bar) {
            if (part.x - part.r < bar.x) {
                part.x = bar.x + part.r;
                part.vx = Math.abs(part.vx) * RESTITUTION;
            }
            if (part.x + part.r > bar.x2) {
                part.x = bar.x2 - part.r;
                part.vx = -Math.abs(part.vx) * RESTITUTION;
            }
            if (part.y + part.r > bar.floorY) {
                part.y = bar.floorY - part.r;
                part.vy = -Math.abs(part.vy) * RESTITUTION;
                part.vx *= WALL_FRICTION;
            }
        }

        /* ════════════════════════════════════════
           PHYSICS FOR ONE BAR
           ════════════════════════════════════════ */
        function stepBar(bar) {
            if (bar.phase === 'done') return;
            if (bar.phase === 'idle') bar.phase = 'spawning';

            if (bar.phase === 'spawning') {
                for (var s = 0; s < SPAWN_RATE; s++) {
                    if (bar.spawned < bar.target) spawnParticle(bar);
                }
                if (bar.spawned >= bar.target) {
                    bar.phase = 'settling';
                    bar.settleCounter = 0;
                    bar.settleTotal = 0;
                }
            }

            var parts = bar.particles;
            var n = parts.length;

            for (var i = 0; i < n; i++) {
                parts[i].px = parts[i].x;
                parts[i].py = parts[i].y;
            }

            for (var i = 0; i < n; i++) {
                var pt = parts[i];
                pt.vy += GRAVITY;
                pt.vx *= AIR_DAMPING;
                pt.vy *= AIR_DAMPING;
                pt.x += pt.vx;
                pt.y += pt.vy;
            }

            for (var i = 0; i < n; i++) clampToBin(parts[i], bar);

            for (var iter = 0; iter < RELAX_ITERS; iter++) {
                spatialHash.clear();
                for (var i = 0; i < n; i++) spatialHash.insert(parts[i]);

                for (var i = 0; i < n; i++) {
                    var a = parts[i];
                    var neighbors = spatialHash.query(a.x, a.y);
                    for (var j = 0; j < neighbors.length; j++) {
                        var b = neighbors[j];
                        if (b === a || a.id >= b.id) continue;
                        var dx = b.x - a.x;
                        var dy = b.y - a.y;
                        var distSq = dx * dx + dy * dy;
                        var minDist = a.r + b.r;
                        if (distSq < minDist * minDist && distSq > 0.0001) {
                            var dist = Math.sqrt(distSq);
                            var overlap = minDist - dist;
                            var nx = dx / dist;
                            var ny = dy / dist;
                            var push = overlap * 0.5;
                            a.x -= nx * push;
                            a.y -= ny * push;
                            b.x += nx * push;
                            b.y += ny * push;
                            var relVn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
                            if (relVn > 0) {
                                a.vx -= nx * relVn * 0.5;
                                a.vy -= ny * relVn * 0.5;
                                b.vx += nx * relVn * 0.5;
                                b.vy += ny * relVn * 0.5;
                            }
                        }
                    }
                }
                for (var i = 0; i < n; i++) clampToBin(parts[i], bar);
            }

            if (bar.phase === 'settling') {
                for (var i = 0; i < n; i++) {
                    parts[i].vx *= 0.85;
                    parts[i].vy *= 0.85;
                }
            }

            var avgDisp = 0;
            for (var i = 0; i < n; i++) {
                avgDisp += Math.abs(parts[i].x - parts[i].px) + Math.abs(parts[i].y - parts[i].py);
            }
            avgDisp = n > 0 ? avgDisp / n : 0;

            if (bar.phase === 'settling') {
                bar.settleTotal++;
                if (avgDisp < SETTLE_DISP) {
                    bar.settleCounter++;
                } else {
                    bar.settleCounter = 0;
                }
                if (bar.settleCounter >= SETTLE_FRAMES || bar.settleTotal >= MAX_SETTLE) {
                    for (var i = 0; i < n; i++) {
                        parts[i].vx = 0;
                        parts[i].vy = 0;
                    }
                    bar.phase = 'done';
                }
            }
        }

        /* ════════════════════════════════════════
           PHYSICS STEP — ALL BARS SIMULTANEOUSLY
           ════════════════════════════════════════ */
        function physicsStep() {
            if (allDone) return;
            var anyActive = false;
            for (var bi = 0; bi < bars.length; bi++) {
                if (bars[bi].phase !== 'done') {
                    anyActive = true;
                    stepBar(bars[bi]);
                }
            }
            if (!anyActive) allDone = true;
        }

        /* ════════════════════════════════════════
           SETTLE ALL INSTANTLY (reduced motion)
           ════════════════════════════════════════ */
        function settleAllInstantly() {
            for (var bi = 0; bi < bars.length; bi++) {
                var bar = bars[bi];
                bar.phase = 'done';
                var cols = Math.max(1, Math.floor(bar.w / D));
                for (var i = 0; i < bar.target; i++) {
                    var col = i % cols;
                    var row = Math.floor(i / cols);
                    bar.particles.push({
                        x: bar.x + R + col * D + (Math.random() - 0.5) * 0.3,
                        y: bar.floorY - R - row * D,
                        vx: 0, vy: 0, px: 0, py: 0,
                        r: R,
                        col: makeColor(bar.pal),
                        id: i
                    });
                }
                bar.spawned = bar.target;
            }
        }

        /* ════════════════════════════════════════
           BASE DECORATIVE PARTICLES
           — opaque, concentrated, dense
           ════════════════════════════════════════ */
        function generateBaseParticles() {
            baseParticles = [];
            for (var bi = 0; bi < bars.length; bi++) {
                var bar = bars[bi];
                var pal = bar.pal;
                var densityScale = bar.count / maxCount;
                var num = Math.floor(bar.count * BASE_MULTIPLIER * densityScale);
                /* Spread only within 1× bar width (no bleed) */
                var spreadX = bar.w;
                var centerX = bar.x + bar.w / 2;
                for (var j = 0; j < num; j++) {
                    /* Uniform distribution within bar, no Gaussian fade */
                    var bpx = bar.x + Math.random() * bar.w;
                    bpx = Math.max(bar.x + 2, Math.min(bar.x2 - 2, bpx));
                    var gy = (Math.random() + Math.random()) / 2;
                    var bpy = bar.floorY - BASE_ZONE_ABOVE + (BASE_ZONE_ABOVE + BASE_ZONE_BELOW) * gy;
                    baseParticles.push({
                        x: bpx, y: bpy,
                        r: BASE_R_MIN + Math.random() * (BASE_R_MAX - BASE_R_MIN),
                        col: makeColor(pal),
                        alpha: BASE_ALPHA_MIN + Math.random() * (BASE_ALPHA_MAX - BASE_ALPHA_MIN)
                    });
                }
            }
            for (var k = baseParticles.length - 1; k > 0; k--) {
                var idx = Math.floor(Math.random() * (k + 1));
                var tmp = baseParticles[k];
                baseParticles[k] = baseParticles[idx];
                baseParticles[idx] = tmp;
            }
        }

        /* ════════════════════════════════════════
           DRAW
           ════════════════════════════════════════ */
        function drawScene() {
            p.clear();
            var floorY = bars[0] ? bars[0].floorY : H - PAD.bottom;

            /* 1. Ground shadow */
            p.noStroke();
            p.fill(80, 50, 20, 12);
            p.ellipse(W / 2, floorY + 2, W - PAD.left - PAD.right + 20, 10);

            /* 2. Base grains */
            for (var i = 0; i < baseParticles.length; i++) {
                var bp = baseParticles[i];
                p.fill(bp.col[0], bp.col[1], bp.col[2], bp.alpha);
                p.ellipse(bp.x, bp.y, bp.r * 2, bp.r * 2);
            }

            /* 3. Floor line */
            p.stroke(113, 57, 1, 20);
            p.strokeWeight(1);
            p.line(PAD.left, floorY + 0.5, W - PAD.right, floorY + 0.5);
            p.noStroke();

            /* 4. Data particles + 5. Labels */
            for (var bi = 0; bi < bars.length; bi++) {
                var bar = bars[bi];
                if (bar.phase === 'idle') continue;

                var parts = bar.particles;
                for (var pi = 0; pi < parts.length; pi++) {
                    var pt = parts[pi];
                    p.fill(pt.col[0], pt.col[1], pt.col[2]);
                    p.ellipse(pt.x, pt.y, pt.r * 2, pt.r * 2);
                }

                /* Count label — azul */
                if (bar.phase === 'done' || bar.spawned >= bar.target) {
                    var topY = bar.floorY;
                    for (var k = 0; k < parts.length; k++) {
                        if (parts[k].y < topY) topY = parts[k].y;
                    }
                    p.fill(36, 51, 96);
                    p.textFont('Libre Baskerville');
                    p.textSize(IS_MOBILE ? 10 : 14);
                    p.textAlign(p.CENTER, p.BOTTOM);
                    p.text(bar.count, bar.x + bar.w / 2, topY - R - 2);
                }

                /* Culture label — azul, bajado para no encimarse */
                p.fill(36, 51, 96);
                p.textFont('Libre Baskerville');
                p.textSize(IS_MOBILE ? 7 : 9);
                p.textAlign(p.LEFT, p.TOP);
                var labelX = bar.x + bar.w / 2;
                var labelY = floorY + BASE_ZONE_BELOW + (IS_MOBILE ? 14 : 22);
                p.push();
                p.translate(labelX, labelY);
                p.rotate(p.radians(-45));
                p.text(bar.cultura, 0, 0);
                p.pop();
            }

            /* 6. Hover highlight */
            if (hoveredBar >= 0 && hoveredBar < bars.length) {
                var hb = bars[hoveredBar];
                var ht = hb.floorY;
                for (var k = 0; k < hb.particles.length; k++) {
                    if (hb.particles[k].y < ht) ht = hb.particles[k].y;
                }
                p.noFill();
                p.stroke(74, 53, 32, 40);
                p.strokeWeight(1);
                p.rect(hb.x - 1, ht - R - 4, hb.w + 2, hb.floorY - ht + R + 5, 2);
                p.noStroke();
            }
        }

        /* ════════════════════════════════════════
           DRAW LOOP
           ════════════════════════════════════════ */
        p.draw = function() {
            frameCount++;
            if (!allDone) physicsStep();
            drawScene();
            if (allDone && frameCount > 10) p.frameRate(2);
        };

        /* ════════════════════════════════════════
           TOOLTIP — positioned near cursor / touch
           ════════════════════════════════════════ */
        p.mouseMoved = function() { handleHover(p.mouseX, p.mouseY); };
        p.touchStarted = function() {
            if (p.touches.length > 0) handleHover(p.touches[0].x, p.touches[0].y);
            return true;
        };
        p.touchMoved = function() {
            if (p.touches.length > 0) handleHover(p.touches[0].x, p.touches[0].y);
            return true;
        };

        function handleHover(mx, my) {
            var tooltip = document.getElementById('particle-chart-tooltip');
            if (!tooltip) return;
            lastMX = mx;
            lastMY = my;
            var prev = hoveredBar;
            hoveredBar = -1;
            for (var i = 0; i < bars.length; i++) {
                var bar = bars[i];
                if (bar.phase === 'idle') continue;
                if (mx >= bar.x && mx <= bar.x2 && my >= PAD.top && my <= bar.floorY + 10) {
                    hoveredBar = i;
                    break;
                }
            }
            if (hoveredBar >= 0) {
                var bar = bars[hoveredBar];
                tooltip.style.display = 'block';
                tooltip.innerHTML =
                    '<div class="particle-tooltip-title">' +
                        bar.cultura + ' · ' + bar.count + ' ingredientes</div>' +
                    '<div class="particle-tooltip-sub">' +
                        (ingredientesPorCultura[bar.cultura] || '') + '</div>' +
                    '<div class="particle-tooltip-body">' +
                        (descripcionesCulturas[bar.cultura] || '') + '</div>';

                /* Position near cursor, not stuck at the top */
                var ttW = tooltip.offsetWidth || 180;
                var ttH = tooltip.offsetHeight || 80;
                var ttLeft = mx + 15;
                if (ttLeft + ttW > W - 5) ttLeft = mx - ttW - 15;
                ttLeft = Math.max(5, ttLeft);
                var ttTop = my - ttH - 10;
                if (ttTop < 5) ttTop = my + 20;
                tooltip.style.left = ttLeft + 'px';
                tooltip.style.top = ttTop + 'px';
                p.frameRate(30);
            } else {
                tooltip.style.display = 'none';
                if (allDone) p.frameRate(2);
            }
            if (prev !== hoveredBar) p.redraw();
        }
    };

    /* Launch when visible */
    var started = false;
    var observer = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting && !started) {
            started = true;
            window._particleChartP5 = new p5(sketch);
            observer.disconnect();
        }
    }, { threshold: 0.15 });
    observer.observe(container);
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
    createCulturalRadialChart();
    var t;
    window.addEventListener('resize', function() {
        clearTimeout(t);
        t = setTimeout(createCulturalRadialChart, 300);
    });
});
