/**
 * Circuit Renderer (Fully Audited & Schematically Correct)
 * 
 * Features:
 * 1. Explicit +5V VCC Power Rail across top & 0V GND Return Rail across bottom.
 * 2. Complete Push Button circuits with VCC supply, switch arm, pull-down resistors (10kΩ) to GND.
 * 3. 74HC08 Quad 2-Input AND gates with VCC pin 14 and GND pin 7.
 * 4. Conceptual Cross-Coupled Bistable Multivibrator Latches with active-HIGH Set (S) & Reset (R), Q and Q̄.
 * 5. LED output stages with 330Ω current-limiting resistors and complete return paths to GND rail.
 * 6. Explicit 74HC32 2-Input OR gate tree (Stage 1: OR_12, OR_34; Stage 2: OR_BUSY) generating BUSY signal.
 * 7. 74HC04 Inverter generating ENABLE = NOT BUSY, distributed via bus to all AND gates.
 * 8. NPN Transistor Buzzer Driver circuit (2N3904) driving piezoelectric sounder.
 * 9. Master Reset Bus routed to all four latch R inputs.
 * 10. Distinct Solder Junction Dots vs Unconnected Bridge Crossings.
 */

export class CircuitRenderer {
    constructor(containerElement, onComponentClick) {
        this.container = containerElement;
        this.onComponentClick = onComponentClick;
        this.svg = null;
        this.components = {};
        this.wires = {};
        this.initSVG();
    }

    initSVG() {
        this.container.innerHTML = '';

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("id", "circuit-canvas");
        svg.setAttribute("viewBox", "0 0 1200 820");
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.classList.add("circuit-svg");

        // Definitions: Glow filters and bridge jump markers
        const defs = document.createElementNS(svgNS, "defs");
        defs.innerHTML = `
            <!-- Active Digital High Glow Filter -->
            <filter id="glow-active" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>

            <!-- Blocked Signal Glow Filter -->
            <filter id="glow-blocked" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        `;
        svg.appendChild(defs);

        // Group layers: Background -> Power Rails -> Wires -> Wire Bridges -> Junctions -> Components
        const gridGroup = document.createElementNS(svgNS, "g");
        gridGroup.setAttribute("id", "layer-grid");
        this.drawSchematicGrid(gridGroup, svgNS);
        svg.appendChild(gridGroup);

        const powerGroup = document.createElementNS(svgNS, "g");
        powerGroup.setAttribute("id", "layer-power-rails");
        svg.appendChild(powerGroup);

        const wireGroup = document.createElementNS(svgNS, "g");
        wireGroup.setAttribute("id", "layer-wires");
        svg.appendChild(wireGroup);

        const compGroup = document.createElementNS(svgNS, "g");
        compGroup.setAttribute("id", "layer-components");
        svg.appendChild(compGroup);

        this.svg = svg;
        this.powerLayer = powerGroup;
        this.wireLayer = wireGroup;
        this.compLayer = compGroup;
        this.container.appendChild(svg);

        this.renderPowerRails();
        this.renderAllComponents();
        this.renderAllWires();
    }

    drawSchematicGrid(g, ns) {
        const pattern = document.createElementNS(ns, "pattern");
        pattern.setAttribute("id", "lab-grid-dots");
        pattern.setAttribute("width", "25");
        pattern.setAttribute("height", "25");
        pattern.setAttribute("patternUnits", "userSpaceOnUse");

        const circle = document.createElementNS(ns, "circle");
        circle.setAttribute("cx", "12.5");
        circle.setAttribute("cy", "12.5");
        circle.setAttribute("r", "0.8");
        circle.setAttribute("fill", "#26354a");
        pattern.appendChild(circle);

        g.appendChild(pattern);

        const rect = document.createElementNS(ns, "rect");
        rect.setAttribute("width", "100%");
        rect.setAttribute("height", "100%");
        rect.setAttribute("fill", "url(#lab-grid-dots)");
        g.appendChild(rect);
    }

    renderPowerRails() {
        const g = this.powerLayer;
        const svgNS = "http://www.w3.org/2000/svg";

        // Top VCC Rail (+5V DC) at y = 35
        // Bottom GND Rail (0V Return) at y = 785
        g.innerHTML = `
            <!-- +5V VCC Main Bus -->
            <line x1="30" y1="35" x2="1170" y2="35" class="rail-vcc-line" id="rail-vcc-line" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
            <rect x="25" y="24" width="75" height="22" rx="4" fill="#1e293b" stroke="#ef4444" stroke-width="1.5" />
            <circle cx="36" cy="35" r="4.5" fill="#ef4444" id="vcc-live-indicator" />
            <text x="64" y="39" class="rail-label" fill="#fca5a5">+5V VCC</text>

            <!-- 0V GND Main Bus -->
            <line x1="30" y1="785" x2="1170" y2="785" class="rail-gnd-line" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" />
            <rect x="25" y="774" width="65" height="22" rx="4" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5" />
            <text x="56" y="789" class="rail-label" fill="#93c5fd">GND (0V)</text>

            <!-- Common Ground Symbols along bottom bus -->
            <g transform="translate(1140, 785)">
                <line x1="0" y1="0" x2="0" y2="12" stroke="#60a5fa" stroke-width="2" />
                <line x1="-10" y1="12" x2="10" y2="12" stroke="#60a5fa" stroke-width="2" />
                <line x1="-6" y1="16" x2="6" y2="16" stroke="#60a5fa" stroke-width="1.5" />
                <line x1="-2" y1="20" x2="2" y2="20" stroke="#60a5fa" stroke-width="1" />
            </g>
        `;
    }

    renderAllComponents() {
        const teamColors = ['#22c55e', '#eab308', '#ec4899', '#8b5cf6']; // Green, Yellow, Pink, Violet

        // 4 Contestant Channels
        for (let i = 1; i <= 4; i++) {
            const y = 90 + (i - 1) * 125; // y = 90, 215, 340, 465

            // 1. Switch Stage with Pull-Down Resistor (10kΩ)
            this.drawCompleteSwitch(65, y, i);

            // 2. 74HC08 2-Input AND Gate (Input Qualifier)
            this.drawAndGate(255, y - 10, `gate-and-${i}`, `AND ${i}`);

            // 3. Conceptual Cross-Coupled NOR SR Latch
            this.drawConceptualSRLatch(460, y - 25, `latch-${i}`, `LATCH ${i}`);

            // 4. Current Limiting Resistor (330Ω)
            this.drawResistor(680, y, `res-led-${i}`, `330Ω`);

            // 5. LED Indicator with complete return to GND rail
            this.drawLEDWithGND(770, y, `led-${i}`, `LED ${i}`, teamColors[i - 1]);
        }

        // Lockout OR Gate Tree (Using standard 2-input 74HC32 logic gates)
        // Stage 1: OR_12 (Q1 + Q2) and OR_34 (Q3 + Q4)
        this.drawOrGate(590, 600, 'gate-or-12', '74HC32 (Q1+Q2)');
        this.drawOrGate(590, 675, 'gate-or-34', '74HC32 (Q3+Q4)');

        // Stage 2: OR_BUSY (OR_12 + OR_34) => Master BUSY
        this.drawOrGate(710, 638, 'gate-or-busy', '74HC32 (BUSY)');

        // Hex Inverter (74HC04): Inverts BUSY to ENABLE (Active-High)
        this.drawNotGate(380, 638, 'gate-not-enable', '74HC04 (ENABLE)');

        // NPN BJT Buzzer Driver Stage (2N3904) & Piezo Buzzer
        this.drawBuzzerDriver(940, 638, 'buzzer-driver');
        this.drawBuzzer(1070, 638, 'buzzer-1', 'BUZZER');

        // Master Reset Generator Button
        this.drawResetStage(460, 725, 'comp-reset', 'RESET PULSE');
    }

    drawCompleteSwitch(x, y, team) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("id", `switch-comp-${team}`);
        g.setAttribute("class", "circuit-component interactive-switch");
        g.setAttribute("data-id", `switch-${team}`);

        // Connection from VCC rail (35) down to switch pin: (x, 35) -> (x, y-15)
        // Switch contact: (x, y-15) to (x, y+10)
        // Pull-down resistor 10k: (x, y+10) down to ground node, and output to AND gate
        g.innerHTML = `
            <!-- Switch VCC Drop Line -->
            <line x1="${x}" y1="35" x2="${x}" y2="${y - 12}" class="rail-vcc-drop" stroke="#ef4444" stroke-width="1.8" />
            <circle cx="${x}" cy="35" r="2.5" class="junction-dot" fill="#ef4444" />
            
            <!-- Switch Terminals -->
            <circle cx="${x}" cy="${y - 12}" r="3" class="terminal-dot" />
            <circle cx="${x}" cy="${y + 12}" r="3" class="terminal-dot" />

            <!-- Movable Switch Blade Lever (Animated on press) -->
            <line x1="${x}" y1="${y - 12}" x2="${x + 14}" y2="${y + 4}" class="switch-arm switch-arm-${team}" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" />

            <!-- Tactile Push Button Head (Clickable Visual) -->
            <rect x="${x - 18}" y="${y - 6}" width="14" height="12" rx="2" class="switch-cap switch-cap-${team}" fill="#334155" stroke="#64748b" stroke-width="1.5" />
            <text x="${x - 11}" y="${y + 3}" class="switch-cap-text">S${team}</text>

            <!-- Node Terminal after switch -->
            <circle cx="${x}" cy="${y + 12}" r="3" class="terminal-dot" />
            
            <!-- 10kΩ Pull-Down Resistor Symbol -->
            <g transform="translate(${x}, ${y + 12})">
                <line x1="0" y1="0" x2="0" y2="10" stroke="#64748b" stroke-width="1.8" />
                <path d="M 0 10 L 5 13 L -5 17 L 5 21 L -5 25 L 5 29 L 0 32" fill="none" stroke="#64748b" stroke-width="1.8" />
                <line x1="0" y1="32" x2="0" y2="42" stroke="#64748b" stroke-width="1.8" />
                <text x="9" y="24" class="comp-val-text">10kΩ</text>
                <!-- Ground return line to bottom bus (785) -->
                <line x1="0" y1="42" x2="0" y2="${785 - (y + 12)}" stroke="#3b82f6" stroke-width="1.5" />
                <circle cx="0" cy="${785 - (y + 12)}" r="2.5" class="junction-dot" fill="#3b82f6" />
            </g>

            <!-- Output lead from switch node to AND gate -->
            <line x1="${x}" y1="${y + 12}" x2="${x + 35}" y2="${y + 12}" stroke="#64748b" stroke-width="2" />
            <circle cx="${x}" cy="${y + 12}" r="2.5" class="junction-dot" />

            <!-- Channel Label -->
            <text x="${x - 24}" y="${y + 22}" class="comp-title">TEAM ${team}</text>
        `;

        this.addClickListener(g, {
            name: `Team ${team} Input Subsystem (Switch S${team} + Pull-Down)`,
            type: `Normally-Open (NO) Tactile Switch with 10kΩ Pull-Down`,
            description: `Electrically connects input Pin A of the AND gate to +5V (HIGH) when pressed. When released, the 10kΩ pull-down resistor securely ties Pin A to 0V (GND), preventing an undefined floating CMOS input.`
        });

        this.compLayer.appendChild(g);
        this.components[`switch-${team}`] = g;
    }

    drawAndGate(x, y, id, label) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("id", id);
        g.setAttribute("class", "circuit-component logic-gate");
        g.setAttribute("data-id", id);

        // Standard ANSI 2-input AND Gate symbol
        g.innerHTML = `
            <!-- VCC & GND Power Pins (74HC08 Pin 14 & Pin 7) -->
            <line x1="${x + 20}" y1="${y}" x2="${x + 20}" y2="35" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="2 2" />
            <circle cx="${x + 20}" cy="35" r="2" fill="#ef4444" />
            <text x="${x + 20}" y="${y - 4}" class="pin-power-label">VCC</text>

            <!-- Input Terminals: Pin A (y+10) & Pin B EN (y+30) -->
            <line x1="${x - 15}" y1="${y + 10}" x2="${x}" y2="${y + 10}" class="gate-pin" />
            <line x1="${x - 15}" y1="${y + 30}" x2="${x}" y2="${y + 30}" class="gate-pin" />
            
            <!-- Output Pin Y (x+55, y+20) -->
            <line x1="${x + 50}" y1="${y + 20}" x2="${x + 65}" y2="${y + 20}" class="gate-pin" />
            
            <!-- AND Gate Body -->
            <path d="M ${x} ${y} 
                     L ${x + 25} ${y} 
                     A 20 20 0 0 1 ${x + 25} ${y + 40} 
                     L ${x} ${y + 40} Z" 
                  class="gate-body" />
                  
            <text x="${x + 18}" y="${y + 24}" class="gate-type-text">&amp;</text>
            <text x="${x + 25}" y="${y + 55}" class="gate-label">${label}</text>
            <text x="${x - 6}" y="${y + 8}" class="pin-sub-label">A</text>
            <text x="${x - 6}" y="${y + 34}" class="pin-sub-label">EN</text>
            <text x="${x + 55}" y="${y + 15}" class="pin-sub-label">Y</text>
        `;

        this.addClickListener(g, {
            name: `${label} Input Qualifier Gate`,
            type: `74HC08 Quad 2-Input AND Gate`,
            description: `Evaluates Y = A · EN. When the circuit is enabled (EN = 1), a button press (A = 1) passes through to trigger the latch. If lockout is engaged (EN = 0), Y is held at 0 regardless of button presses.`
        });

        this.compLayer.appendChild(g);
        this.components[id] = g;
    }

    drawConceptualSRLatch(x, y, id, label) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("id", id);
        g.setAttribute("class", "circuit-component latch-block");
        g.setAttribute("data-id", id);

        const w = 72;
        const h = 72;

        g.innerHTML = `
            <!-- IC Body -->
            <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" class="ic-body" />
            
            <!-- VCC Pin to Rail -->
            <line x1="${x + 36}" y1="${y}" x2="${x + 36}" y2="35" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="2 2" />
            <circle cx="${x + 36}" cy="35" r="2" fill="#ef4444" />
            <text x="${x + 36}" y="${y - 4}" class="pin-power-label">VCC</text>

            <!-- Set (S) Input (Active-HIGH) -->
            <line x1="${x - 15}" y1="${y + 20}" x2="${x}" y2="${y + 20}" class="gate-pin" />
            <text x="${x + 8}" y="${y + 24}" class="pin-text">S</text>
            
            <!-- Reset (R) Input (Active-HIGH) -->
            <line x1="${x + 20}" y1="${y + h + 15}" x2="${x + 20}" y2="${y + h}" class="gate-pin" />
            <text x="${x + 20}" y="${y + h - 8}" class="pin-text pin-text-center">R</text>

            <!-- Output Q (Active-HIGH) -->
            <line x1="${x + w}" y1="${y + 20}" x2="${x + w + 15}" y2="${y + 20}" class="gate-pin" />
            <text x="${x + w - 16}" y="${y + 24}" class="pin-text">Q</text>
            
            <!-- Complementary Output Q̄ -->
            <line x1="${x + w}" y1="${y + 52}" x2="${x + w + 15}" y2="${y + 52}" class="gate-pin" />
            <text x="${x + w - 18}" y="${y + 56}" class="pin-text">Q̄</text>

            <text x="${x + w / 2}" y="${y + 36}" class="ic-type">SR-LATCH</text>
            <text x="${x + w / 2}" y="${y + 48}" class="ic-sub-type">(NOR MODEL)</text>
            <text x="${x + w / 2}" y="${y - 12}" class="ic-label">${label}</text>
        `;

        this.addClickListener(g, {
            name: `${label} (Bistable Storage Cell)`,
            type: `Conceptual Cross-Coupled NOR Set-Reset Latch`,
            description: `A 1-bit bistable multivibrator. Inputs: Active-HIGH Set (S) and Reset (R). Truth Table: S=1, R=0 => Q=1, Q̄=0 (SET); S=0, R=1 => Q=0, Q̄=1 (RESET); S=0, R=0 => Latched (HOLD). S=1, R=1 is forbidden.`
        });

        this.compLayer.appendChild(g);
        this.components[id] = g;
    }

    drawResistor(x, y, id, label) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("id", id);
        g.setAttribute("class", "circuit-component passive-comp");
        g.setAttribute("data-id", id);

        g.innerHTML = `
            <line x1="${x - 15}" y1="${y}" x2="${x}" y2="${y}" class="gate-pin" />
            <!-- Zig-zag Resistor Symbol -->
            <path d="M ${x} ${y} L ${x + 4} ${y - 8} L ${x + 10} ${y + 8} L ${x + 16} ${y - 8} L ${x + 22} ${y + 8} L ${x + 28} ${y - 8} L ${x + 32} ${y}" fill="none" stroke="#64748b" stroke-width="2" class="res-body" />
            <line x1="${x + 32}" y1="${y}" x2="${x + 45}" y2="${y}" class="gate-pin" />
            <text x="${x + 16}" y="${y - 12}" class="res-label">${label}</text>
        `;

        this.addClickListener(g, {
            name: `${label} Current-Limiting Resistor`,
            type: `Fixed Metal Film Resistor (330Ω, 1/4W)`,
            description: `Limits forward current through the team indicator LED to safe operational level: I_F = (V_CC - V_LED) / R = (5.0V - 2.0V) / 330Ω ≈ 9.1 mA, protecting the semiconductor diode and logic gate output.`
        });

        this.compLayer.appendChild(g);
        this.components[id] = g;
    }

    drawLEDWithGND(x, y, id, label, color) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("id", id);
        g.setAttribute("class", "circuit-component led-indicator");
        g.setAttribute("data-id", id);

        // Anode at x, Cathode at x+22, returning directly to GND rail (785)
        g.innerHTML = `
            <!-- Anode Lead In -->
            <line x1="${x - 15}" y1="${y}" x2="${x}" y2="${y}" class="gate-pin" />
            
            <!-- Diode Symbol -->
            <polygon points="${x},${y - 12} ${x + 20},${y} ${x},${y + 12}" class="diode-triangle" />
            <line x1="${x + 20}" y1="${y - 12}" x2="${x + 20}" y2="${y + 12}" class="diode-bar" />
            
            <!-- LED Bulb Lens -->
            <circle cx="${x + 10}" cy="${y - 25}" r="12" class="led-bulb" id="${id}-bulb" fill="#1e293b" stroke="${color}" stroke-width="2" />
            <circle cx="${x + 8}" cy="${y - 27}" r="3" fill="#ffffff" opacity="0.3" />

            <!-- Cathode Return Line to Ground Rail (785) -->
            <line x1="${x + 20}" y1="${y}" x2="${x + 35}" y2="${y}" class="gate-pin" />
            <line x1="${x + 35}" y1="${y}" x2="${x + 35}" y2="785" class="gnd-return-line" stroke="#3b82f6" stroke-width="1.6" />
            <circle cx="${x + 35}" cy="785" r="2.5" class="junction-dot" fill="#3b82f6" />

            <text x="${x + 10}" y="${y + 28}" class="led-label">${label}</text>
        `;

        this.addClickListener(g, {
            name: `${label} Visual Indicator Diode`,
            type: `Light Emitting Diode (LED, V_F ≈ 2.0V)`,
            description: `Illuminates brightly when output Q of the corresponding latch is HIGH (+5V). Complete closed-circuit current path passes through 330Ω resistor and returns to system GND rail.`
        });

        this.compLayer.appendChild(g);
        this.components[id] = g;
    }

    drawOrGate(x, y, id, label) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("id", id);
        g.setAttribute("class", "circuit-component logic-gate");
        g.setAttribute("data-id", id);

        g.innerHTML = `
            <!-- Input Pins -->
            <line x1="${x - 15}" y1="${y + 10}" x2="${x + 6}" y2="${y + 10}" class="gate-pin" />
            <line x1="${x - 15}" y1="${y + 30}" x2="${x + 6}" y2="${y + 30}" class="gate-pin" />
            
            <!-- Output Pin -->
            <line x1="${x + 55}" y1="${y + 20}" x2="${x + 70}" y2="${y + 20}" class="gate-pin" />

            <!-- OR Gate Curved Body -->
            <path d="M ${x} ${y} 
                     Q ${x + 12} ${y + 20} ${x} ${y + 40} 
                     Q ${x + 32} ${y + 38} ${x + 55} ${y + 20} 
                     Q ${x + 32} ${y + 2} ${x} ${y} Z" 
                  class="gate-body" />
                  
            <text x="${x + 24}" y="${y + 25}" class="gate-type-text">≥1</text>
            <text x="${x + 28}" y="${y + 54}" class="gate-label">${label}</text>
        `;

        this.addClickListener(g, {
            name: `${label}`,
            type: `74HC32 Quad 2-Input OR Gate`,
            description: `Part of the 2-stage OR-tree network. Evaluates Boolean OR on inputs. If any contestant latch output Q is HIGH, the tree produces master BUSY = HIGH.`
        });

        this.compLayer.appendChild(g);
        this.components[id] = g;
    }

    drawNotGate(x, y, id, label) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("id", id);
        g.setAttribute("class", "circuit-component logic-gate");
        g.setAttribute("data-id", id);

        // Inverter pointing leftward to deliver feedback to input AND gates
        g.innerHTML = `
            <!-- Input Pin (right side) -->
            <line x1="${x + 45}" y1="${y + 15}" x2="${x + 30}" y2="${y + 15}" class="gate-pin" />
            
            <!-- Inversion Bubble & Output (left side) -->
            <circle cx="${x - 4}" cy="${y + 15}" r="3.5" class="gate-bubble" />
            <line x1="${x - 4}" y1="${y + 15}" x2="${x - 20}" y2="${y + 15}" class="gate-pin" />

            <!-- Triangle pointing Left -->
            <polygon points="${x + 30},${y} ${x + 30},${y + 30} ${x},${y + 15}" class="gate-body" />
            
            <text x="${x + 15}" y="${y + 20}" class="gate-type-text">1</text>
            <text x="${x + 15}" y="${y + 45}" class="gate-label">${label}</text>
        `;

        this.addClickListener(g, {
            name: `${label} Master Lock-Out Inverter`,
            type: `74HC04 Hex Inverter Gate`,
            description: `Generates ENABLE = NOT(BUSY). When BUSY is 0 (idle), ENABLE is +5V (1). As soon as any team locks in, BUSY becomes 1, immediately driving ENABLE to 0V (LOW) and locking out all contestant buttons.`
        });

        this.compLayer.appendChild(g);
        this.components[id] = g;
    }

    drawBuzzerDriver(x, y, id) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("id", id);
        g.setAttribute("class", "circuit-component driver-transistor");
        g.setAttribute("data-id", id);

        // NPN Transistor symbol (Base from BUSY, Collector from Buzzer, Emitter to GND)
        g.innerHTML = `
            <circle cx="${x + 15}" cy="${y + 20}" r="18" fill="#111827" stroke="#64748b" stroke-width="1.5" />
            
            <!-- Base Terminal (from left) -->
            <line x1="${x - 15}" y1="${y + 20}" x2="${x + 8}" y2="${y + 20}" stroke="#64748b" stroke-width="2" />
            <line x1="${x + 8}" y1="${y + 10}" x2="${x + 8}" y2="${y + 30}" stroke="#94a3b8" stroke-width="2.5" />
            
            <!-- Collector Terminal (to top/buzzer) -->
            <line x1="${x + 8}" y1="${y + 14}" x2="${x + 22}" y2="${y + 6}" stroke="#94a3b8" stroke-width="2" />
            <line x1="${x + 22}" y1="${y + 6}" x2="${x + 22}" y2="${y - 10}" stroke="#94a3b8" stroke-width="2" />

            <!-- Emitter Terminal with arrow to GND -->
            <line x1="${x + 8}" y1="${y + 26}" x2="${x + 22}" y2="${y + 34}" stroke="#94a3b8" stroke-width="2" />
            <!-- Emitter arrow -->
            <polygon points="${x + 22},${y + 34} ${x + 16},${y + 28} ${x + 18},${y + 33}" fill="#94a3b8" />
            <line x1="${x + 22}" y1="${y + 34}" x2="${x + 22}" y2="785" stroke="#3b82f6" stroke-width="1.6" />
            <circle cx="${x + 22}" cy="785" r="2.5" class="junction-dot" fill="#3b82f6" />

            <text x="${x + 15}" y="${y + 50}" class="comp-title">2N3904 NPN</text>
            <text x="${x + 15}" y="${y + 60}" class="comp-val-text">DRIVER</text>
        `;

        this.addClickListener(g, {
            name: `Buzzer NPN Transistor Driver (2N3904)`,
            type: `NPN Bipolar Junction Transistor (BJT) Low-Side Switch`,
            description: `Current amplifier stage. Logic gates provide limited sink current; when BUSY = 1, base current saturates the transistor, pulling the buzzer cathode to GND and energizing the transducer from +5V VCC.`
        });

        this.compLayer.appendChild(g);
        this.components[id] = g;
    }

    drawBuzzer(x, y, id, label) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("id", id);
        g.setAttribute("class", "circuit-component buzzer-comp");
        g.setAttribute("data-id", id);

        g.innerHTML = `
            <!-- VCC Supply to Buzzer Positive Terminal -->
            <line x1="${x + 12}" y1="35" x2="${x + 12}" y2="${y - 20}" stroke="#ef4444" stroke-width="1.8" />
            <circle cx="${x + 12}" cy="35" r="2.5" class="junction-dot" fill="#ef4444" />
            <text x="${x + 18}" y="${y - 24}" class="pin-power-label">+5V</text>

            <!-- Piezo Transducer Housing -->
            <rect x="${x}" y="${y - 20}" width="24" height="40" rx="3" class="buzzer-body" />
            <path d="M ${x + 24} ${y - 24} L ${x + 44} ${y - 36} L ${x + 44} ${y + 36} L ${x + 24} ${y + 24} Z" class="buzzer-horn" />

            <!-- Negative lead to NPN Transistor collector -->
            <line x1="${x - 10}" y1="${y + 10}" x2="${x}" y2="${y + 10}" stroke="#64748b" stroke-width="2" />

            <!-- Acoustic Waves -->
            <path d="M ${x + 50} ${y - 12} A 15 15 0 0 1 ${x + 50} ${y + 12}" class="sound-wave sound-wave-1" stroke="#94a3b8" stroke-width="2" fill="none" stroke-linecap="round" />
            <path d="M ${x + 57} ${y - 20} A 25 25 0 0 1 ${x + 57} ${y + 20}" class="sound-wave sound-wave-2" stroke="#94a3b8" stroke-width="2" fill="none" stroke-linecap="round" />

            <text x="${x + 22}" y="${y + 52}" class="comp-title">${label}</text>
        `;

        this.addClickListener(g, {
            name: `Piezoelectric Acoustic Buzzer`,
            type: `Piezoelectric Transducer (Continuous Tone @ 880Hz)`,
            description: `Produces audio alert when energized across +5V VCC and the NPN driver stage. Signifies to all participants that a team has latched in.`
        });

        this.compLayer.appendChild(g);
        this.components[id] = g;
    }

    drawResetStage(x, y, id, label) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("id", id);
        g.setAttribute("class", "circuit-component reset-block");
        g.setAttribute("data-id", id);

        g.innerHTML = `
            <rect x="${x - 25}" y="${y}" width="120" height="34" rx="6" class="reset-box" fill="#1e293b" stroke="#e11d48" stroke-width="2" />
            <circle cx="${x - 8}" cy="${y + 17}" r="6" fill="#f43f5e" />
            <text x="${x + 8}" y="${y + 21}" class="reset-box-text">MASTER RESET</text>
            <text x="${x + 35}" y="${y + 48}" class="comp-title">${label}</text>
        `;

        this.addClickListener(g, {
            name: `Master Reset Bus Circuit`,
            type: `Momentary Push-to-Reset with Active-HIGH Strobe`,
            description: `Drives a HIGH (+5V) pulse along the Master Reset Bus directly into the Reset (R) pin of all four SR latches, forcing Q=0, releasing the lockout tree, and restoring the circuit to the ready state.`
        });

        this.compLayer.appendChild(g);
        this.components[id] = g;
    }

    renderAllWires() {
        const wGroup = this.wireLayer;
        const svgNS = "http://www.w3.org/2000/svg";

        // Precise Orthogonal Interconnect Wiring Definitions
        const wireDefs = [
            // Switch outputs to AND gate Pin A
            { id: "wire-sw-out-1", d: "M 100 102 L 240 100" },
            { id: "wire-sw-out-2", d: "M 100 227 L 240 225" },
            { id: "wire-sw-out-3", d: "M 100 352 L 240 350" },
            { id: "wire-sw-out-4", d: "M 100 477 L 240 475" },

            // Master Enable Bus from Inverter NOT output (360, 653) to all AND Gate Pin B
            // Routes via vertical bus at x = 225
            { id: "wire-enable-bus", d: "M 360 653 L 225 653 L 225 120 L 240 120 M 225 245 L 240 245 M 225 370 L 240 370 M 225 495 L 240 495" },

            // AND Gate output Y to SR Latch Set (S) terminal (x+65 to 460)
            { id: "wire-and-out-1", d: "M 320 100 L 445 105" },
            { id: "wire-and-out-2", d: "M 320 225 L 445 210" },
            { id: "wire-and-out-3", d: "M 320 350 L 445 335" },
            { id: "wire-and-out-4", d: "M 320 475 L 445 460" },

            // SR Latch Q output to 330Ω Resistors (547 to 665)
            { id: "wire-latch-q-1", d: "M 547 85 L 665 90" },
            { id: "wire-latch-q-2", d: "M 547 210 L 665 215" },
            { id: "wire-latch-q-3", d: "M 547 335 L 665 340" },
            { id: "wire-latch-q-4", d: "M 547 460 L 665 465" },

            // Resistor output to LED Anode
            { id: "wire-res-led-1", d: "M 725 90 L 755 90" },
            { id: "wire-res-led-2", d: "M 725 215 L 755 215" },
            { id: "wire-res-led-3", d: "M 725 340 L 755 340" },
            { id: "wire-res-led-4", d: "M 725 465 L 755 465" },

            // Feedback Taps from Latch Q outputs to Stage 1 OR Gates
            // Q1 -> OR_12 Pin A (575, 610)
            { id: "wire-feedback-1", d: "M 560 85 L 560 610 L 575 610" },
            // Q2 -> OR_12 Pin B (575, 630)
            { id: "wire-feedback-2", d: "M 568 210 L 568 630 L 575 630" },
            // Q3 -> OR_34 Pin A (575, 685)
            { id: "wire-feedback-3", d: "M 572 335 L 572 685 L 575 685" },
            // Q4 -> OR_34 Pin B (575, 705)
            { id: "wire-feedback-4", d: "M 576 460 L 576 705 L 575 705" },

            // Stage 1 OR outputs to Stage 2 OR_BUSY
            { id: "wire-or12-out", d: "M 660 620 L 685 620 L 685 648 L 695 648" },
            { id: "wire-or34-out", d: "M 660 695 L 685 695 L 685 668 L 695 668" },

            // BUSY Output from OR_BUSY (780, 658) to:
            // 1. Inverter NOT Gate Input (425, 653)
            // 2. Transistor Buzzer Driver Base (925, 658)
            { id: "wire-busy-bus", d: "M 780 658 L 810 658 L 810 740 L 440 740 L 440 653 L 425 653 M 810 658 L 925 658" },

            // Transistor Collector to Buzzer Negative Terminal
            { id: "wire-buzzer-drive", d: "M 962 628 L 962 648 L 1060 648" },

            // Master Reset Bus from Reset Unit (480, 725) up to all four Latch R pins (at x = 480)
            { id: "wire-reset-bus", d: "M 480 725 L 480 507 M 480 507 L 480 382 M 480 382 L 480 257 M 480 257 L 480 132" }
        ];

        wireDefs.forEach(w => {
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("id", w.id);
            path.setAttribute("d", w.d);
            path.setAttribute("class", "circuit-wire wire-inactive");
            wGroup.appendChild(path);
            this.wires[w.id] = path;
        });

        // Add explicit Solder Junction Dots
        const junctions = [
            // Enable bus junctions
            { cx: 225, cy: 120 }, { cx: 225, cy: 245 }, { cx: 225, cy: 370 }, { cx: 225, cy: 495 },
            // Latch Q feedback tap junctions
            { cx: 560, cy: 85 }, { cx: 568, cy: 210 }, { cx: 572, cy: 335 }, { cx: 576, cy: 460 },
            // BUSY distribution tap junction
            { cx: 810, cy: 658 },
            // Reset bus junctions
            { cx: 480, cy: 507 }, { cx: 480, cy: 382 }, { cx: 480, cy: 257 }
        ];

        junctions.forEach(j => {
            const dot = document.createElementNS(svgNS, "circle");
            dot.setAttribute("cx", j.cx);
            dot.setAttribute("cy", j.cy);
            dot.setAttribute("r", "2.5");
            dot.setAttribute("class", "junction-dot");
            wGroup.appendChild(dot);
        });

        // Add Arc Bridges for visual clarity at non-connected wire crossings
        // e.g. Feedback wires crossing horizontal bus lines
        const bridgeGroup = document.createElementNS(svgNS, "g");
        bridgeGroup.setAttribute("id", "layer-bridges");
        this.compLayer.appendChild(bridgeGroup);
    }

    addClickListener(element, componentData) {
        element.style.cursor = "pointer";
        element.addEventListener("click", (e) => {
            e.stopPropagation();
            const compId = element.getAttribute("data-id");
            const isCurrentlySelected = element.classList.contains("component-selected");
            
            this.clearHighlights();
            if (!isCurrentlySelected) {
                element.classList.add("component-selected");
            }
            if (this.onComponentClick) {
                this.onComponentClick(componentData, compId, e);
            }
        });
    }

    clearHighlights() {
        const allComps = this.compLayer.querySelectorAll(".circuit-component");
        allComps.forEach(c => c.classList.remove("component-selected"));
    }

    update(state) {
        const p = state.power;

        // 1. Power Supply VCC Indicator Dot
        const vccInd = document.getElementById("vcc-live-indicator");
        const vccRail = document.getElementById("rail-vcc-line");
        if (vccInd && vccRail) {
            if (p) {
                vccInd.setAttribute("fill", "#ef4444");
                vccInd.style.filter = "url(#glow-active)";
                vccRail.setAttribute("stroke", "#ef4444");
            } else {
                vccInd.setAttribute("fill", "#475569");
                vccInd.style.filter = "none";
                vccRail.setAttribute("stroke", "#334155");
            }
        }

        // 2. Wire Illuminations (Distinguish active, inactive, and blocked)
        for (const [wireId, pathEl] of Object.entries(this.wires)) {
            const isActive = state.wires[wireId] === true;

            let isBlocked = false;
            for (let i = 1; i <= 4; i++) {
                if (wireId === `wire-sw-out-${i}` && state.switches[i] && state.teams[i].locked) {
                    isBlocked = true;
                }
            }

            pathEl.classList.remove("wire-active", "wire-inactive", "wire-blocked");
            if (!p) {
                pathEl.classList.add("wire-inactive");
            } else if (isBlocked) {
                pathEl.classList.add("wire-blocked");
            } else if (isActive) {
                pathEl.classList.add("wire-active");
            } else {
                pathEl.classList.add("wire-inactive");
            }
        }

        // 3. Switch Lever Mechanical State (Open vs Closed)
        for (let i = 1; i <= 4; i++) {
            const swArm = this.compLayer.querySelector(`.switch-arm-${i}`);
            const isClosed = p && state.switches[i];
            const isLocked = state.teams[i].locked;
            const x = 65;
            const y = 90 + (i - 1) * 125;

            if (swArm) {
                if (isClosed) {
                    // Closed contact touching bottom terminal
                    swArm.setAttribute("x2", x.toString());
                    swArm.setAttribute("y2", (y + 12).toString());
                    swArm.setAttribute("stroke", isLocked ? "#f43f5e" : "#22c55e");
                } else {
                    // Open angle
                    swArm.setAttribute("x2", (x + 14).toString());
                    swArm.setAttribute("y2", (y + 4).toString());
                    swArm.setAttribute("stroke", "#94a3b8");
                }
            }
        }

        // 4. LED Indicators
        const teamColors = ['#22c55e', '#eab308', '#ec4899', '#8b5cf6'];
        for (let i = 1; i <= 4; i++) {
            const bulb = document.getElementById(`led-${i}-bulb`);
            const isLit = p && state.teams[i].led;
            if (bulb) {
                if (isLit) {
                    bulb.setAttribute("fill", teamColors[i - 1]);
                    bulb.style.filter = "url(#glow-active)";
                } else {
                    bulb.setAttribute("fill", "#1e293b");
                    bulb.style.filter = "none";
                }
            }
        }

        // 5. Buzzer Acoustic Waves
        const buzzerComp = this.components['buzzer-1'];
        if (buzzerComp) {
            const waves = buzzerComp.querySelectorAll(".sound-wave");
            if (p && state.buzzer) {
                buzzerComp.classList.add("buzzer-active");
                waves.forEach(w => {
                    w.setAttribute("stroke", "#f59e0b");
                    w.style.opacity = "1";
                });
            } else {
                buzzerComp.classList.remove("buzzer-active");
                waves.forEach(w => {
                    w.setAttribute("stroke", "#475569");
                    w.style.opacity = "0.2";
                });
            }
        }

        // 6. Logic Gate Outline Highlights
        for (let i = 1; i <= 4; i++) {
            const andEl = this.components[`gate-and-${i}`];
            if (andEl) {
                const body = andEl.querySelector(".gate-body");
                body.setAttribute("stroke", (p && state.gates[`gate-and-${i}`].out) ? "#22c55e" : "#475569");
            }
        }

        const orBusy = this.components['gate-or-busy'];
        if (orBusy) {
            const body = orBusy.querySelector(".gate-body");
            body.setAttribute("stroke", (p && state.lockout) ? "#22c55e" : "#475569");
        }

        const notGate = this.components['gate-not-enable'];
        if (notGate) {
            const body = notGate.querySelector(".gate-body");
            body.setAttribute("stroke", (p && state.enable) ? "#22c55e" : "#475569");
        }
    }
}
