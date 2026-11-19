/**
 * Central Circuit State Management
 * Holds rigorous electrical and digital logic state parameters.
 */

export function createInitialState() {
    return {
        power: true,
        vccVoltage: 5.0, // +5V DC
        audioEnabled: true,
        selectedTeam: null, // null | 1 | 2 | 3 | 4
        lockout: false,     // Global BUSY flag
        enable: true,       // Global ENABLE flag = NOT BUSY
        buzzer: false,
        resetActive: false, // Master Reset bus state (Momentary HIGH on push)
        
        // Push buttons with 10k pull-downs
        // Normally open: Switch terminal = 0V (LOW)
        // Closed: Switch terminal = +5V (HIGH)
        switches: {
            1: false,
            2: false,
            3: false,
            4: false
        },

        // Team Subsystem States
        teams: {
            1: {
                pressed: false,
                switchVoltage: 0.0,
                inputGateOut: false, // AND gate output (Pin Y)
                latchS: false,       // Set input to latch
                latchR: false,       // Reset input to latch
                latchQ: false,       // Latch output Q
                latchQBar: true,     // Latch complementary output Q̄
                led: false,          // LED illumination
                ledCurrent_mA: 0.0,  // Electrical forward current
                locked: false        // Whether this team is locked out
            },
            2: {
                pressed: false,
                switchVoltage: 0.0,
                inputGateOut: false,
                latchS: false,
                latchR: false,
                latchQ: false,
                latchQBar: true,
                led: false,
                ledCurrent_mA: 0.0,
                locked: false
            },
            3: {
                pressed: false,
                switchVoltage: 0.0,
                inputGateOut: false,
                latchS: false,
                latchR: false,
                latchQ: false,
                latchQBar: true,
                led: false,
                ledCurrent_mA: 0.0,
                locked: false
            },
            4: {
                pressed: false,
                switchVoltage: 0.0,
                inputGateOut: false,
                latchS: false,
                latchR: false,
                latchQ: false,
                latchQBar: true,
                led: false,
                ledCurrent_mA: 0.0,
                locked: false
            }
        },

        // Concrete IC Gate States (Quad 2-Input 74HC08, 74HC32, Hex Inverter 74HC04)
        gates: {
            // 74HC08 Quad 2-Input AND Gates (Input Qualifiers)
            "gate-and-1": { inA: false, inB: true, out: false, vcc: true, gnd: true },
            "gate-and-2": { inA: false, inB: true, out: false, vcc: true, gnd: true },
            "gate-and-3": { inA: false, inB: true, out: false, vcc: true, gnd: true },
            "gate-and-4": { inA: false, inB: true, out: false, vcc: true, gnd: true },
            
            // 74HC32 Quad 2-Input OR Tree for Lockout BUSY:
            // Stage 1: OR_A (Q1 + Q2), OR_B (Q3 + Q4)
            // Stage 2: OR_C (OR_A + OR_B) => BUSY
            "gate-or-12": { inA: false, inB: false, out: false },
            "gate-or-34": { inA: false, inB: false, out: false },
            "gate-or-busy": { inA: false, inB: false, out: false },
            
            // 74HC04 Hex Inverter (ENABLE = NOT BUSY)
            "gate-not-enable": { inA: false, out: true },

            // Buzzer Driver: Driven by BUSY output via NPN BJT Driver Stage
            "buzzer-driver": { baseIn: false, collectorOut: false, vcc: true, gnd: true }
        },

        // Electrical Wires and Busses with active logic signal and connectivity
        wires: {}
    };
}
