/**
 * UI Controls and Hardware Interactivity Module
 * Handles Team buttons, Reset, Power Toggle, Audio Toggle, Keyboard shortcuts,
 * and Interactive Click-and-Drag Pan + Mouse Wheel Zoom.
 */

export class UIControls {
    constructor(engine, audioEngine) {
        this.engine = engine;
        this.audio = audioEngine;
        this.zoomLevel = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.startX = 0;
        this.startY = 0;

        this.initControls();
        this.initPanZoom();
        this.initKeyboard();
    }

    initControls() {
        // Team Push Buttons (4 channels)
        for (let i = 1; i <= 4; i++) {
            const btn = document.getElementById(`team-btn-${i}`);
            if (btn) {
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
                audioBtn.innerHTML = !cur ? `🔊 Audio: ON (1s Auto)` : `🔇 Audio: MUTED`;
                audioBtn.classList.toggle('muted', cur);
            });
        }
    }

    initPanZoom() {
        const btnZoomIn = document.getElementById('btn-zoom-in');
        const btnZoomOut = document.getElementById('btn-zoom-out');
        const btnZoomReset = document.getElementById('btn-zoom-reset');
        const canvasContainer = document.getElementById('circuit-canvas-container');

        if (!canvasContainer) return;

        // Toolbar Buttons
        if (btnZoomIn) {
            btnZoomIn.addEventListener('click', () => {
                this.zoomLevel = Math.min(this.zoomLevel + 0.15, 2.5);
                this.applyTransform();
            });
        }
        if (btnZoomOut) {
            btnZoomOut.addEventListener('click', () => {
                this.zoomLevel = Math.max(this.zoomLevel - 0.15, 0.5);
                this.applyTransform();
            });
        }
        if (btnZoomReset) {
            btnZoomReset.addEventListener('click', () => {
                this.zoomLevel = 1.0;
                this.panX = 0;
                this.panY = 0;
                this.applyTransform();
            });
        }

        // Mouse Wheel Zoom (smooth zoom in/out at pointer)
        canvasContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.zoomLevel = Math.min(Math.max(this.zoomLevel + delta, 0.5), 2.5);
            this.applyTransform();
        }, { passive: false });

        // Click-and-Drag Pan Functionality
        canvasContainer.addEventListener('mousedown', (e) => {
            // Don't pan if clicking an interactive switch or close button
            if (e.target.closest('.interactive-switch') || e.target.closest('#circuit-inspector-popup') || e.button !== 0) {
                return;
            }

            this.isPanning = true;
            this.startX = e.clientX - this.panX;
            this.startY = e.clientY - this.panY;
            canvasContainer.classList.add('panning');
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isPanning) return;
            this.panX = e.clientX - this.startX;
            this.panY = e.clientY - this.startY;
            this.applyTransform();
        });

        const stopPan = () => {
            if (this.isPanning) {
                this.isPanning = false;
                canvasContainer.classList.remove('panning');
            }
        };

        window.addEventListener('mouseup', stopPan);
        window.addEventListener('mouseleave', stopPan);
    }

    applyTransform() {
        const canvasContainer = document.getElementById('circuit-canvas-container');
        if (!canvasContainer) return;
        const svg = canvasContainer.querySelector('svg');
        if (svg) {
            svg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
            svg.style.transformOrigin = 'center center';
        }

        const zoomText = document.getElementById('zoom-level-text');
        if (zoomText) {
            zoomText.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        }
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
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
                btn.disabled = false;
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
