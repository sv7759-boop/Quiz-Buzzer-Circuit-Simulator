/**
 * UI Controls and Hardware Interactivity Module
 * Handles Team buttons, Reset, Power Toggle, Audio Toggle, and Keyboard shortcuts
 */

export class UIControls {
    constructor(engine, audioEngine) {
        this.engine = engine;
        this.audio = audioEngine;
        this.initControls();
        this.initKeyboard();
    }

    initControls() {
        // Team Push Buttons (4 channels)
        for (let i = 1; i <= 4; i++) {
            const btn = document.getElementById(`team-btn-${i}`);
            if (btn) {
                // Support both pointer down/up and mouse events for momentary switch feel
                btn.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    if (this.engine.getState().audioEnabled) this.audio.playClick();
                    this.engine.pressButton(i);
                });

                const releaseHandler = () => {
                    if (this.engine.getState().switches[i]) {
                        this.engine.releaseButton(i);
                    }
                };

                btn.addEventListener('pointerup', releaseHandler);
                btn.addEventListener('pointerleave', releaseHandler);
                btn.addEventListener('pointercancel', releaseHandler);
            }
        }

        // Master Reset Button
        const resetBtn = document.getElementById('btn-master-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (this.engine.getState().audioEnabled) this.audio.playResetTone();
                this.engine.resetCircuit();
            });
        }

        // Power Switch
        const pwrSwitch = document.getElementById('power-toggle');
        if (pwrSwitch) {
            pwrSwitch.addEventListener('change', (e) => {
                const isOn = e.target.checked;
                this.engine.setPower(isOn);
            });
        }

        // Audio Mute/Unmute Toggle
        const audioBtn = document.getElementById('btn-audio-toggle');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                const cur = this.engine.getState().audioEnabled;
                this.engine.setAudioEnabled(!cur);
                audioBtn.innerHTML = !cur ? `🔊 Audio: ON` : `🔇 Audio: MUTED`;
                audioBtn.classList.toggle('muted', cur);
            });
        }

        // Zoom & Pan buttons
        const btnZoomIn = document.getElementById('btn-zoom-in');
        const btnZoomOut = document.getElementById('btn-zoom-out');
        const btnZoomReset = document.getElementById('btn-zoom-reset');
        const canvasContainer = document.getElementById('circuit-canvas-container');

        let zoomLevel = 1.0;
        if (btnZoomIn && canvasContainer) {
            btnZoomIn.addEventListener('click', () => {
                zoomLevel = Math.min(zoomLevel + 0.15, 2.2);
                this.applyZoom(canvasContainer, zoomLevel);
            });
        }
        if (btnZoomOut && canvasContainer) {
            btnZoomOut.addEventListener('click', () => {
                zoomLevel = Math.max(zoomLevel - 0.15, 0.6);
                this.applyZoom(canvasContainer, zoomLevel);
            });
        }
        if (btnZoomReset && canvasContainer) {
            btnZoomReset.addEventListener('click', () => {
                zoomLevel = 1.0;
                this.applyZoom(canvasContainer, zoomLevel);
            });
        }
    }

    applyZoom(container, level) {
        const svg = container.querySelector('svg');
        if (svg) {
            svg.style.transform = `scale(${level})`;
            svg.style.transformOrigin = 'center center';
        }
        const zoomText = document.getElementById('zoom-level-text');
        if (zoomText) {
            zoomText.textContent = `${Math.round(level * 100)}%`;
        }
    }

    initKeyboard() {
        // Hotkeys: Keys 1, 2, 3, 4 for Teams, R for Reset, Space for Reset
        window.addEventListener('keydown', (e) => {
            // Ignore if typing in text input (if any)
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const key = e.key;
            if (['1', '2', '3', '4'].includes(key)) {
                const teamNum = parseInt(key, 10);
                if (!this.engine.getState().switches[teamNum]) {
                    if (this.engine.getState().audioEnabled) this.audio.playClick();
                    this.engine.pressButton(teamNum);
                }
            } else if (key.toLowerCase() === 'r' || key === ' ') {
                e.preventDefault();
                if (this.engine.getState().audioEnabled) this.audio.playResetTone();
                this.engine.resetCircuit();
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key;
            if (['1', '2', '3', '4'].includes(key)) {
                const teamNum = parseInt(key, 10);
                if (this.engine.getState().switches[teamNum]) {
                    this.engine.releaseButton(teamNum);
                }
            }
        });
    }

    /**
     * Synchronize Team buttons with circuit lockout state
     */
    update(state) {
        for (let i = 1; i <= 4; i++) {
            const card = document.getElementById(`team-card-${i}`);
            const btn = document.getElementById(`team-btn-${i}`);
            const statusBadge = document.getElementById(`team-status-${i}`);
            const ledPip = document.getElementById(`team-led-${i}`);

            if (!card || !btn) continue;

            const isSelected = state.selectedTeam === i;
            const isLocked = state.teams[i].locked;
            const isPressed = state.switches[i];
            const isLedOn = state.teams[i].led;

            // Reset classes
            card.classList.remove('team-active', 'team-locked', 'team-pressed');
            btn.classList.remove('btn-pressed', 'btn-locked', 'btn-selected');

            if (!state.power) {
                btn.disabled = true;
                statusBadge.textContent = 'POWER OFF';
                statusBadge.className = 'status-badge badge-off';
                ledPip.classList.remove('led-pip-on');
            } else if (isSelected) {
                card.classList.add('team-active');
                btn.classList.add('btn-selected');
                btn.disabled = false;
                statusBadge.textContent = '1ST PLACE (SELECTED)';
                statusBadge.className = 'status-badge badge-winner';
                ledPip.classList.add('led-pip-on');
            } else if (isLocked) {
                card.classList.add('team-locked');
                btn.classList.add('btn-locked');
                btn.disabled = false; // keep clickable so user can observe lockout blocking in simulation!
                statusBadge.textContent = 'LOCKED OUT';
                statusBadge.className = 'status-badge badge-locked';
                ledPip.classList.remove('led-pip-on');
            } else {
                btn.disabled = false;
                statusBadge.textContent = 'READY (ENABLED)';
                statusBadge.className = 'status-badge badge-ready';
                ledPip.classList.remove('led-pip-on');
            }

            if (isPressed) {
                card.classList.add('team-pressed');
                btn.classList.add('btn-pressed');
            }
        }

        // Buzzer Audio handling
        if (state.power && state.audioEnabled && state.buzzer) {
            this.audio.startBuzzerTone();
        } else {
            this.audio.stopBuzzerTone();
        }
    }
}
