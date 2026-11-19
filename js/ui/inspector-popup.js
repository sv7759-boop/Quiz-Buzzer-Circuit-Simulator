/**
 * Floating / Popover Component Inspector
 * Smart positioning: Opens to the RIGHT (or LEFT) of the clicked component
 * with smooth entry & exit animations, never covering the component itself.
 */

export class ComponentInspectorPopup {
    constructor(engine, containerElement) {
        this.engine = engine;
        this.container = containerElement; // circuit-workspace container
        this.activeComponentId = null;
        this.activeData = null;
        this.popupEl = null;
        this.isClosing = false;
        this.createPopupElement();
    }

    createPopupElement() {
        let el = document.getElementById('circuit-inspector-popup');
        if (!el) {
            el = document.createElement('div');
            el.id = 'circuit-inspector-popup';
            el.className = 'circuit-inspector-popup hidden';
            this.container.appendChild(el);
        }
        this.popupEl = el;
    }

    toggle(componentData, componentId, clickEvent) {
        // If clicking the same component that is currently open, animate out and close
        if (this.activeComponentId === componentId && !this.popupEl.classList.contains('hidden') && !this.isClosing) {
            this.close();
            return;
        }

        if (this.isClosing) {
            this.popupEl.classList.remove('popup-anim-out');
            this.isClosing = false;
        }

        this.activeComponentId = componentId;
        this.activeData = componentData;
        this.render();
        this.positionSide(clickEvent);

        this.popupEl.classList.remove('hidden', 'popup-anim-out');
        this.popupEl.classList.add('popup-anim-in');
    }

    close() {
        if (!this.popupEl || this.popupEl.classList.contains('hidden') || this.isClosing) return;

        this.isClosing = true;
        this.popupEl.classList.remove('popup-anim-in');
        this.popupEl.classList.add('popup-anim-out');

        setTimeout(() => {
            this.popupEl.classList.add('hidden');
            this.popupEl.classList.remove('popup-anim-out');
            this.activeComponentId = null;
            this.activeData = null;
            this.isClosing = false;
        }, 180); // matches animation duration
    }

    /**
     * Compute clean side position (Right or Left of the clicked component element)
     */
    positionSide(e) {
        if (!this.popupEl || !e) return;
        const containerRect = this.container.getBoundingClientRect();
        
        const popupWidth = 330;
        const popupHeight = 240;

        // Try to get the bounding box of the actual target component element
        let targetRect = null;
        if (e.currentTarget && typeof e.currentTarget.getBoundingClientRect === 'function') {
            targetRect = e.currentTarget.getBoundingClientRect();
        }

        let compLeft, compRight, compCenterY;

        if (targetRect) {
            compLeft = targetRect.left - containerRect.left;
            compRight = targetRect.right - containerRect.left;
            compCenterY = (targetRect.top + targetRect.height / 2) - containerRect.top;
        } else {
            const x = e.clientX - containerRect.left;
            const y = e.clientY - containerRect.top;
            compLeft = x - 35;
            compRight = x + 35;
            compCenterY = y;
        }

        // Determine whether to place to the Right or Left:
        // By default prefer Right side with 18px gap
        let posX, posY;
        const gap = 18;

        if (compRight + gap + popupWidth <= containerRect.width - 15) {
            // Fits to the Right
            posX = compRight + gap;
            this.popupEl.setAttribute('data-side', 'right');
        } else if (compLeft - gap - popupWidth >= 15) {
            // Fits to the Left
            posX = compLeft - gap - popupWidth;
            this.popupEl.setAttribute('data-side', 'left');
        } else {
            // Fallback: place on whichever side has more space
            if (compRight > containerRect.width / 2) {
                posX = Math.max(15, compLeft - gap - popupWidth);
                this.popupEl.setAttribute('data-side', 'left');
            } else {
                posX = Math.min(containerRect.width - popupWidth - 15, compRight + gap);
                this.popupEl.setAttribute('data-side', 'right');
            }
        }

        // Center vertically with the component
        posY = compCenterY - popupHeight / 2;

        // Boundary safety checks vertically
        if (posY < 15) posY = 15;
        if (posY + popupHeight > containerRect.height - 15) {
            posY = containerRect.height - popupHeight - 15;
        }

        this.popupEl.style.left = `${posX}px`;
        this.popupEl.style.top = `${posY}px`;
    }

    render() {
        if (!this.activeComponentId || !this.activeData) return;

        const data = this.activeData;
        const componentId = this.activeComponentId;
        const state = this.engine.getState();

        let inHtml = '';
        let outHtml = '';

        if (componentId.startsWith('switch-')) {
            const teamNum = componentId.replace('switch-', '');
            const swPressed = state.switches[teamNum];
            inHtml = `
                <div class="pin-row"><span>Power Rail Contact:</span> <span class="val-badge val-high">+5.0V VCC</span></div>
                <div class="pin-row"><span>Mechanical State:</span> <span class="val-badge ${swPressed ? 'val-high' : 'val-low'}">${swPressed ? 'CLOSED (PRESSED)' : 'OPEN (RELEASED)'}</span></div>
                <div class="pin-row"><span>Resistor Pull-Down:</span> <span class="val-badge val-low">10kΩ to GND (0V)</span></div>
            `;
            outHtml = `
                <div class="pin-row"><span>Switch Output Node:</span> <span class="val-badge ${swPressed ? 'val-high' : 'val-low'}">${swPressed ? 'HIGH (+5V)' : 'LOW (0V)'}</span></div>
            `;
        } else if (componentId.startsWith('gate-and-')) {
            const teamNum = componentId.replace('gate-and-', '');
            const gate = state.gates[componentId];
            inHtml = `
                <div class="pin-row"><span>Pin A (Switch S${teamNum}):</span> <span class="val-badge ${gate.inA ? 'val-high' : 'val-low'}">${gate.inA ? 'HIGH (+5V)' : 'LOW (0V)'}</span></div>
                <div class="pin-row"><span>Pin B EN (Master Enable):</span> <span class="val-badge ${gate.inB ? 'val-high' : 'val-low'}">${gate.inB ? 'HIGH (+5V)' : 'LOW (0V)'}</span></div>
                <div class="pin-row"><span>IC Power:</span> <span class="val-badge val-high">Pin 14: +5V | Pin 7: GND</span></div>
            `;
            outHtml = `
                <div class="pin-row"><span>Output Y (To Latch S):</span> <span class="val-badge ${gate.out ? 'val-high' : 'val-low'}">${gate.out ? 'HIGH (+5V)' : 'LOW (0V)'}</span></div>
            `;
        } else if (componentId.startsWith('latch-')) {
            const teamNum = componentId.replace('latch-', '');
            const team = state.teams[teamNum];
            const setInput = state.gates[`gate-and-${teamNum}`].out;
            inHtml = `
                <div class="pin-row"><span>Set (S) Terminal:</span> <span class="val-badge ${setInput ? 'val-high' : 'val-low'}">${setInput ? 'HIGH (1)' : 'LOW (0)'}</span></div>
                <div class="pin-row"><span>Reset (R) Terminal:</span> <span class="val-badge ${state.resetActive ? 'val-high' : 'val-low'}">${state.resetActive ? 'HIGH (1)' : 'LOW (0)'}</span></div>
                <div class="pin-row"><span>Latch Polarity:</span> <span class="val-badge val-ready">Active-HIGH (NOR Model)</span></div>
            `;
            outHtml = `
                <div class="pin-row"><span>Stored Output Q (To LED):</span> <span class="val-badge ${team.latchQ ? 'val-high' : 'val-low'}">${team.latchQ ? 'HIGH (+5V)' : 'LOW (0V)'}</span></div>
                <div class="pin-row"><span>Complementary Output Q̄:</span> <span class="val-badge ${team.latchQBar ? 'val-high' : 'val-low'}">${team.latchQBar ? 'HIGH (+5V)' : 'LOW (0V)'}</span></div>
            `;
        } else if (componentId.startsWith('res-led-')) {
            const teamNum = componentId.replace('res-led-', '');
            const team = state.teams[teamNum];
            inHtml = `
                <div class="pin-row"><span>From Latch Q${teamNum}:</span> <span class="val-badge ${team.latchQ ? 'val-high' : 'val-low'}">${team.latchQ ? '+5.0V' : '0.0V'}</span></div>
                <div class="pin-row"><span>Resistance:</span> <span class="val-badge val-low">330Ω, ±5%</span></div>
            `;
            outHtml = `
                <div class="pin-row"><span>Forward Current:</span> <span class="val-badge ${team.led ? 'val-high' : 'val-low'}">${team.ledCurrent_mA.toFixed(1)} mA</span></div>
            `;
        } else if (componentId.startsWith('led-')) {
            const teamNum = componentId.replace('led-', '');
            const isLit = state.teams[teamNum].led;
            inHtml = `
                <div class="pin-row"><span>Anode Input (Via 330Ω):</span> <span class="val-badge ${isLit ? 'val-high' : 'val-low'}">${isLit ? '~2.0V Forward Drop' : '0V'}</span></div>
                <div class="pin-row"><span>Cathode Return:</span> <span class="val-badge val-low">0V GND (Closed Path)</span></div>
            `;
            outHtml = `
                <div class="pin-row"><span>Optical State:</span> <span class="val-badge ${isLit ? 'val-high' : 'val-low'}">${isLit ? 'EMITTING LIGHT' : 'OFF'}</span></div>
            `;
        } else if (componentId === 'gate-or-12' || componentId === 'gate-or-34' || componentId === 'gate-or-busy') {
            const g = state.gates[componentId];
            inHtml = `
                <div class="pin-row"><span>Pin A / Pin B:</span> <span class="val-badge">${g.inA ? 'HIGH (1)' : 'LOW (0)'} / ${g.inB ? 'HIGH (1)' : 'LOW (0)'}</span></div>
            `;
            outHtml = `
                <div class="pin-row"><span>Output Y:</span> <span class="val-badge ${g.out ? 'val-high' : 'val-low'}">${g.out ? 'HIGH (1)' : 'LOW (0)'}</span></div>
            `;
        } else if (componentId === 'gate-not-enable') {
            const g = state.gates['gate-not-enable'];
            inHtml = `
                <div class="pin-row"><span>Inverter Input (BUSY):</span> <span class="val-badge ${g.inA ? 'val-high' : 'val-low'}">${g.inA ? 'HIGH (1)' : 'LOW (0)'}</span></div>
            `;
            outHtml = `
                <div class="pin-row"><span>Inverted Output (ENABLE):</span> <span class="val-badge ${g.out ? 'val-high' : 'val-low'}">${g.out ? 'HIGH (1)' : 'LOW (0)'}</span></div>
            `;
        } else if (componentId === 'buzzer-driver') {
            inHtml = `
                <div class="pin-row"><span>Base Drive (From BUSY):</span> <span class="val-badge ${state.buzzer ? 'val-high' : 'val-low'}">${state.buzzer ? 'HIGH (+5V Saturation)' : 'LOW (Cutoff)'}</span></div>
                <div class="pin-row"><span>Emitter Return:</span> <span class="val-badge val-low">GND (0V)</span></div>
            `;
            outHtml = `
                <div class="pin-row"><span>Collector State:</span> <span class="val-badge ${state.buzzer ? 'val-high' : 'val-low'}">${state.buzzer ? 'LOW (Conducting to GND)' : 'HIGH-Z (Open)'}</span></div>
            `;
        } else if (componentId === 'buzzer-1') {
            inHtml = `
                <div class="pin-row"><span>Positive Terminal:</span> <span class="val-badge val-high">+5V VCC Rail</span></div>
                <div class="pin-row"><span>Negative Terminal:</span> <span class="val-badge ${state.buzzer ? 'val-high' : 'val-low'}">${state.buzzer ? 'GND (Via Transistor)' : 'Floating (OFF)'}</span></div>
            `;
            outHtml = `
                <div class="pin-row"><span>Acoustic Output:</span> <span class="val-badge ${state.buzzer ? 'val-high' : 'val-low'}">${state.buzzer ? '880Hz ALERT ACTIVE' : 'SILENT'}</span></div>
            `;
        } else {
            inHtml = `<div class="pin-row text-muted">Standard DC Bus Connection</div>`;
            outHtml = `<div class="pin-row text-muted">Nominal circuit parameters</div>`;
        }

        this.popupEl.innerHTML = `
            <div class="popup-header">
                <div class="popup-title">${data.name}</div>
                <button class="popup-close-btn" id="popup-close-btn">&times;</button>
            </div>
            <div class="popup-type">${data.type}</div>
            <div class="popup-desc">${data.description}</div>
            <div class="popup-pins-box">
                <div class="popup-section-label">INPUTS</div>
                ${inHtml}
                <div class="popup-section-label" style="margin-top: 6px;">OUTPUT</div>
                ${outHtml}
            </div>
        `;

        const closeBtn = this.popupEl.querySelector('#popup-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }
    }

    update() {
        if (this.activeComponentId && !this.popupEl.classList.contains('hidden') && !this.isClosing) {
            this.render();
        }
    }
}
