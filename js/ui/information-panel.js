/**
 * Live Telemetry Panel
 * Retains circuit telemetry indicators and channel pin states.
 */

export class TelemetryPanel {
    constructor(engine) {
        this.engine = engine;
        this.selectedTeamVal = document.getElementById('val-selected-team');
        this.circuitStatusVal = document.getElementById('val-circuit-status');
        this.lockoutVal = document.getElementById('val-lockout-status');
        this.latchVal = document.getElementById('val-latch-status');
        this.buzzerVal = document.getElementById('val-buzzer-status');
    }

    update(state) {
        if (!state.power) {
            if (this.selectedTeamVal) this.selectedTeamVal.textContent = 'NONE (OFF)';
            if (this.circuitStatusVal) {
                this.circuitStatusVal.textContent = 'POWER OFF';
                this.circuitStatusVal.className = 'val-badge val-low';
            }
            if (this.lockoutVal) this.lockoutVal.textContent = 'DE-ENERGIZED';
            if (this.latchVal) this.latchVal.textContent = 'INACTIVE (0V)';
            if (this.buzzerVal) this.buzzerVal.textContent = 'OFF';
            return;
        }

        if (state.selectedTeam !== null) {
            if (this.selectedTeamVal) {
                this.selectedTeamVal.textContent = `TEAM ${state.selectedTeam}`;
                this.selectedTeamVal.className = 'val-badge val-high';
            }
            if (this.circuitStatusVal) {
                this.circuitStatusVal.textContent = 'LATCHED (WINNER)';
                this.circuitStatusVal.className = 'val-badge val-winner';
            }
        } else {
            if (this.selectedTeamVal) {
                this.selectedTeamVal.textContent = 'NONE';
                this.selectedTeamVal.className = 'val-badge val-low';
            }
            if (this.circuitStatusVal) {
                this.circuitStatusVal.textContent = 'READY (ENABLED)';
                this.circuitStatusVal.className = 'val-badge val-ready';
            }
        }

        if (this.lockoutVal) {
            this.lockoutVal.textContent = state.lockout ? 'BUSY (LOCKED)' : 'IDLE (READY)';
            this.lockoutVal.className = `val-badge ${state.lockout ? 'val-high' : 'val-low'}`;
        }

        if (this.latchVal) {
            this.latchVal.textContent = state.selectedTeam ? `LATCH ${state.selectedTeam} STORED` : 'ALL CLEARED';
            this.latchVal.className = `val-badge ${state.selectedTeam ? 'val-high' : 'val-low'}`;
        }

        if (this.buzzerVal) {
            this.buzzerVal.textContent = state.buzzer ? 'ACTIVE' : 'OFF';
            this.buzzerVal.className = `val-badge ${state.buzzer ? 'val-high' : 'val-low'}`;
        }

        for (let i = 1; i <= 4; i++) {
            const swEl = document.getElementById(`pin-s${i}`);
            const ledEl = document.getElementById(`pin-led${i}`);
            if (swEl) {
                const isSw = state.switches[i];
                swEl.textContent = isSw ? 'HIGH (+5V)' : 'LOW (0V)';
                swEl.className = `val-badge ${isSw ? 'val-high' : 'val-low'}`;
            }
            if (ledEl) {
                const isLed = state.teams[i].led;
                ledEl.textContent = isLed ? `${state.teams[i].ledCurrent_mA.toFixed(1)}mA` : 'OFF (0mA)';
                ledEl.className = `val-badge ${isLed ? 'val-high' : 'val-low'}`;
            }
        }
    }
}
