/**
 * Main Application Bootstrap & Integration
 * Glues Simulation Engine, SVG Circuit Renderer, UI Controls, Telemetry, and Dropdown Modal.
 */

import { SimulationEngine } from './simulation/engine.js';
import { CircuitRenderer } from './circuit/renderer.js';
import { UIControls } from './ui/controls.js';
import { TelemetryPanel } from './ui/information-panel.js';
import { ComponentInspectorPopup } from './ui/inspector-popup.js';
import { EventLogDropdownModal } from './ui/event-log.js';
import { AudioEngine } from './ui/audio.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Simulation Engine
    const engine = new SimulationEngine();

    // 2. Initialize Audio Synthesizer (with 2-second automatic timeout)
    const audioEngine = new AudioEngine();

    // 3. Initialize Chronological Event Log & Statistics Modal (Top-Left Dropdown)
    const eventLogModal = new EventLogDropdownModal(engine);

    // 4. Initialize Live Circuit Telemetry Panel (Right sidebar)
    const telemetryPanel = new TelemetryPanel(engine);

    // 5. Initialize Popover Component Inspector (Appears over clicked component)
    const workspaceContainer = document.querySelector('.circuit-workspace');
    const inspectorPopup = new ComponentInspectorPopup(engine, workspaceContainer);

    // 6. Initialize SVG Circuit Renderer
    const circuitContainer = document.getElementById('circuit-canvas-container');
    const circuitRenderer = new CircuitRenderer(circuitContainer, (compData, compId, clickEvent) => {
        inspectorPopup.toggle(compData, compId, clickEvent);
    });

    // Close popup if clicking empty workspace area
    circuitContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'svg' || e.target.id === 'circuit-canvas' || e.target.id === 'layer-grid') {
            circuitRenderer.clearHighlights();
            inspectorPopup.close();
        }
    });

    // 7. Initialize UI Controls (Left team stations, reset, power, audio, zoom)
    const uiControls = new UIControls(engine, audioEngine);

    // 8. Wire Top-Left Menu Dropdown Toggle
    const menuBtn = document.getElementById('top-menu-btn');
    const dropdownMenu = document.getElementById('top-nav-dropdown');

    if (menuBtn && dropdownMenu) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdownMenu.classList.remove('show');
        });

        dropdownMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // 9. Wire Engine Subscriptions to UI Updates
    engine.subscribe((state, event) => {
        circuitRenderer.update(state);
        uiControls.update(state);
        telemetryPanel.update(state);
        inspectorPopup.update();
    });

    engine.onEvent((eventObj) => {
        eventLogModal.addEvent(eventObj);
    });

    // Initial event log
    eventLogModal.addEvent({
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: 'Quiz Buzzer System initialized. Ready for round 1. Press any team button (Keys 1-4).',
        type: 'success'
    });

    // Initial render pass
    circuitRenderer.update(engine.getState());
    uiControls.update(engine.getState());
    telemetryPanel.update(engine.getState());
});
