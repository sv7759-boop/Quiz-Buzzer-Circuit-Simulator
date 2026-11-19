/**
 * Simulation Engine (Audited & Rigorous)
 * Evaluates digital logic signals, cross-coupled latches, lockout feedback, and driver circuits.
 */

import { LogicGates } from './logic-gates.js';
import { createInitialState } from './state.js';

export class SimulationEngine {
    constructor() {
        this.state = createInitialState();
        this.listeners = [];
        this.eventListeners = [];
        this.recalculateWires();
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    onEvent(callback) {
        this.eventListeners.push(callback);
    }

    emitEvent(message, type = 'info', details = {}) {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        const eventObj = { timestamp: time, message, type, details };
        this.eventListeners.forEach(cb => cb(eventObj));
    }

    notify(event = null) {
        this.listeners.forEach(cb => cb(this.state, event));
    }

    getState() {
        return this.state;
    }

    setPower(powerOn) {
        if (this.state.power === powerOn) return;
        this.state.power = powerOn;
        this.state.vccVoltage = powerOn ? 5.0 : 0.0;
        
        if (!powerOn) {
            this.emitEvent('VCC Power Supply cut (+5V -> 0V). All ICs de-energized, signals dropped to 0V.', 'warning');
            this.resetAllOutputs();
        } else {
            this.emitEvent('VCC Power Supply energized (+5.0V DC active). All IC power pins VCC/GND online.', 'success');
            this.evaluateCircuit();
        }
        this.notify({ type: 'POWER_CHANGE', power: powerOn });
    }

    setAudioEnabled(enabled) {
        this.state.audioEnabled = enabled;
        this.notify({ type: 'AUDIO_TOGGLE', enabled });
    }

    /**
     * Momentary Push Button Press (Switch closes to +5V VCC)
     * @param {number} teamNumber 1 | 2 | 3 | 4
     */
    pressButton(teamNumber) {
        if (!this.state.power) {
            this.emitEvent(`Team ${teamNumber} button pressed, but Power Rail VCC = 0V!`, 'warning');
            return false;
        }

        const team = this.state.teams[teamNumber];
        this.state.switches[teamNumber] = true;
        team.pressed = true;
        team.switchVoltage = 5.0;

        this.emitEvent(`Switch S${teamNumber} CLOSED -> +5V applied across 10kΩ pull-down (Input Pin A = HIGH)`, 'input');

        // Check if circuit is currently locked out (ENABLE is LOW)
        if (this.state.lockout) {
            this.emitEvent(`Team ${teamNumber} input BLOCKED: Global ENABLE = LOW (0V). AND gate output remains LOW (0V).`, 'blocked', { team: teamNumber });
            this.evaluateCircuit();
            this.notify({ type: 'INPUT_BLOCKED', team: teamNumber });
            return false;
        }

        // Check if first valid selection
        if (this.state.selectedTeam === null) {
            this.state.selectedTeam = teamNumber;
            // Pulse Set (S) terminal of Latch
            team.latchS = true;
            team.latchQ = true;
            team.latchQBar = false;

            this.emitEvent(`FIRST PRESS DETECTED: Team ${teamNumber}! Set Pulse applied to Latch ${teamNumber} -> Q${teamNumber} LATCHED HIGH (+5V).`, 'success', { team: teamNumber });
            
            this.evaluateCircuit();
            this.notify({ type: 'TEAM_SELECTED', team: teamNumber });
            return true;
        }

        this.evaluateCircuit();
        this.notify({ type: 'BUTTON_PRESS', team: teamNumber });
        return false;
    }

    /**
     * Momentary Push Button Release (Switch opens; pull-down pulls input to 0V)
     * @param {number} teamNumber 
     */
    releaseButton(teamNumber) {
        this.state.switches[teamNumber] = false;
        this.state.teams[teamNumber].pressed = false;
        this.state.teams[teamNumber].switchVoltage = 0.0;
        this.state.teams[teamNumber].latchS = false; // S pulse removed

        this.emitEvent(`Switch S${teamNumber} OPENED -> 10kΩ resistor pulls Pin A to GND (0V). Output Q remains STORED.`, 'info');
        
        // Due to latching, output Q remains HIGH even when S drops back to LOW
        this.evaluateCircuit();
        this.notify({ type: 'BUTTON_RELEASE', team: teamNumber });
    }

    /**
     * Master Reset Trigger: Injects a positive HIGH (+5V) pulse into all Latch R inputs
     */
    resetCircuit() {
        if (!this.state.power) return;

        this.state.resetActive = true;
        this.emitEvent('Master RESET bus ACTIVATED (+5V pulse on all R terminals) -> Clearing all latches', 'reset');

        // Clear all latches
        for (let i = 1; i <= 4; i++) {
            this.state.teams[i].latchS = false;
            this.state.teams[i].latchR = true;
            this.state.teams[i].latchQ = false;
            this.state.teams[i].latchQBar = true;
            this.state.teams[i].inputGateOut = false;
            this.state.teams[i].led = false;
            this.state.teams[i].ledCurrent_mA = 0.0;
            this.state.teams[i].locked = false;
        }

        this.state.selectedTeam = null;
        this.state.lockout = false;
        this.state.enable = true;
        this.state.buzzer = false;

        this.evaluateCircuit();
        this.state.resetActive = false;
        for (let i = 1; i <= 4; i++) {
            this.state.teams[i].latchR = false;
        }

        this.emitEvent('Circuit reset complete. All channels UNLOCKED. Global ENABLE = HIGH (+5V).', 'info');
        this.notify({ type: 'RESET' });
    }

    /**
     * Core Digital Logic Evaluation
     */
    evaluateCircuit() {
        if (!this.state.power) {
            this.resetAllOutputs();
            return;
        }

        const s = this.state;

        // 1. Evaluate 74HC32 2-Input OR Tree for Lockout BUSY:
        // Stage 1:
        // OR_12: Q1 OR Q2
        const or12 = LogicGates.OR(s.teams[1].latchQ, s.teams[2].latchQ);
        // OR_34: Q3 OR Q4
        const or34 = LogicGates.OR(s.teams[3].latchQ, s.teams[4].latchQ);
        // Stage 2:
        // OR_BUSY: OR_12 OR OR_34
        const busy = LogicGates.OR(or12, or34);

        s.gates["gate-or-12"] = { inA: s.teams[1].latchQ, inB: s.teams[2].latchQ, out: or12 };
        s.gates["gate-or-34"] = { inA: s.teams[3].latchQ, inB: s.teams[4].latchQ, out: or34 };
        s.gates["gate-or-busy"] = { inA: or12, inB: or34, out: busy };

        s.lockout = busy;

        // 2. Evaluate 74HC04 Hex Inverter (ENABLE = NOT BUSY)
        const enable = LogicGates.NOT(busy);
        s.enable = enable;
        s.gates["gate-not-enable"] = { inA: busy, out: enable };

        // 3. Evaluate 74HC08 Input AND Gates (In_i = S_i AND ENABLE)
        for (let i = 1; i <= 4; i++) {
            const swHigh = s.switches[i];
            const andOut = LogicGates.AND(swHigh, enable);
            
            s.gates[`gate-and-${i}`] = {
                inA: swHigh,
                inB: enable,
                out: andOut,
                vcc: true,
                gnd: true
            };

            s.teams[i].inputGateOut = andOut;
            s.teams[i].locked = s.lockout && (s.selectedTeam !== i);

            // LED and current calculation (V_f = 2.0V, R = 330Ω, I = (5V - 2V)/330 = 9.1 mA)
            const isLedOn = s.teams[i].latchQ;
            s.teams[i].led = isLedOn;
            s.teams[i].ledCurrent_mA = isLedOn ? 9.1 : 0.0;
        }

        // 4. Buzzer Transistor Driver Stage (Driven by BUSY signal)
        s.buzzer = busy;
        s.gates["buzzer-driver"] = {
            baseIn: busy,
            collectorOut: busy,
            vcc: true,
            gnd: true
        };

        this.recalculateWires();
    }

    resetAllOutputs() {
        for (let i = 1; i <= 4; i++) {
            this.state.teams[i].led = false;
            this.state.teams[i].ledCurrent_mA = 0.0;
            this.state.teams[i].locked = false;
            this.state.teams[i].inputGateOut = false;
        }
        this.state.lockout = false;
        this.state.enable = false;
        this.state.buzzer = false;
        this.recalculateWires();
    }

    /**
     * Electrical Wire and Bus State Mapper
     */
    recalculateWires() {
        const s = this.state;
        const p = s.power;
        const enable = p ? s.enable : false;
        const busy = p ? s.lockout : false;

        const w = {};

        // Power Distribution Rails
        w['rail-vcc'] = p;
        w['rail-gnd'] = true; // Ground reference always present

        // Switch paths
        for (let i = 1; i <= 4; i++) {
            const swPressed = p && s.switches[i];
            w[`wire-sw-in-${i}`] = p; // Switch input connected to +5V rail
            w[`wire-sw-out-${i}`] = swPressed; // Switch terminal to AND Pin A
            w[`wire-pulldown-${i}`] = true; // Connection through 10k resistor to GND
            w[`wire-and-out-${i}`] = p && s.teams[i].inputGateOut; // AND out to Latch S
            w[`wire-latch-q-${i}`] = p && s.teams[i].latchQ; // Latch Q to Resistor
            w[`wire-res-led-${i}`] = p && s.teams[i].led; // Resistor to LED Anode
            w[`wire-led-gnd-${i}`] = true; // LED Cathode to Ground return
            w[`wire-feedback-${i}`] = p && s.teams[i].latchQ; // Latch Q to OR tree
        }

        // Enable Distribution Bus
        w['wire-enable-bus'] = enable;

        // OR Tree internal lines
        w['wire-or12-out'] = p && s.gates["gate-or-12"].out;
        w['wire-or34-out'] = p && s.gates["gate-or-34"].out;
        w['wire-busy-bus'] = busy;

        // Buzzer Driver wiring
        w['wire-buzzer-base'] = busy;
        w['wire-buzzer-drive'] = p && s.buzzer;
        w['wire-buzzer-vcc'] = p;
        w['wire-buzzer-gnd'] = true;

        // Master Reset Bus
        w['wire-reset-bus'] = p && s.resetActive;

        s.wires = w;
    }
}
