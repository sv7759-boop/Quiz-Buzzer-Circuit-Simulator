# TECHNICAL REQUIREMENTS DOCUMENT (TRD)
## Interactive Quiz Buzzer Circuit Simulator

**Version:** 1.0  
**Document Type:** Technical Requirements Document  
**Application Type:** Client-side Web Application  
**Primary Platform:** Desktop Web Browser  
**Status:** Initial Technical Specification

---

# 1. Technical Overview

## 1.1 Purpose

This document defines the technical architecture and implementation requirements for developing an interactive web-based Quiz Buzzer System simulator.

The application will simulate a four-team digital logic circuit and visually demonstrate its operation through an interactive circuit diagram.

The simulator must maintain synchronization between:

1. Digital logic simulation.
2. Circuit visualization.
3. User interactions.
4. Educational information panels.

## 1.2 Core Technical Principle

The application must use a state-driven simulation architecture.

The simulation engine will determine the actual circuit state.

The visualization engine will observe that state and render the corresponding changes.

**Important:** Animations must never determine circuit logic. They must only represent the results of logical operations.

---

# 2. Technology Stack

## 2.1 Frontend

| Technology | Responsibility |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling and layout |
| JavaScript ES6+ | Application logic |
| SVG | Circuit diagram rendering |
| GSAP | Optional signal animations |

No frontend framework is necessary for Version 1.

The application should initially use vanilla JavaScript to keep the architecture understandable and lightweight.

## 2.2 Development Environment

Recommended tools:

- Visual Studio Code
- Chrome or Edge
- Git and GitHub
- Browser Developer Tools

## 2.3 Backend

Version 1 does not require a backend.

All simulation calculations and interactions will run locally inside the browser.

---

# 3. System Architecture

The application will follow a modular architecture consisting of five modules.

### Module 1: Simulation Engine

Responsible for the digital logic behaviour.

Responsibilities:
- Accept team inputs.
- Process input signals.
- Determine the first valid input.
- Maintain the selected state.
- Implement lock-out behaviour.
- Handle reset operations.

### Module 2: Circuit Renderer

Responsible for displaying the circuit diagram.

Responsibilities:
- Render logic gates.
- Render switches.
- Render LEDs.
- Render connecting wires.
- Render flip-flops or latches.
- Maintain component states visually.

### Module 3: Signal Visualization Engine

Responsible for representing signal propagation.

Responsibilities:
- Highlight active connections.
- Animate signal transitions.
- Display blocked paths.
- Show active and inactive gate states.

### Module 4: User Interface Controller

Responsible for:
- Team buttons.
- Reset control.
- Audio toggle.
- Zoom and pan.
- Component selection.

### Module 5: Information Panel

Responsible for displaying:
- Current circuit state.
- Input values.
- Output values.
- Component descriptions.
- Event history.

## 3.1 Data Flow

The intended data flow is:

User Interaction  
↓  
Simulation Engine  
↓  
Circuit State Update  
↓  
Visualization Engine  
↓  
SVG Rendering and Animations  
↓  
Information Panel Update

The simulation engine must remain independent of the rendering implementation.

---

# 4. Project Structure

Recommended directory structure:

quiz-buzzer-simulator/
│
├── index.html
│
├── css/
│   ├── style.css
│   ├── circuit.css
│   └── components.css
│
├── js/
│   ├── main.js
│   ├── simulation/
│   │   ├── engine.js
│   │   ├── state.js
│   │   ├── logic-gates.js
│   │   └── controller.js
│   │
│   ├── circuit/
│   │   ├── renderer.js
│   │   ├── components.js
│   │   └── connections.js
│   │
│   ├── visualization/
│   │   ├── signal-flow.js
│   │   └── animations.js
│   │
│   └── ui/
│       ├── controls.js
│       ├── information-panel.js
│       └── event-log.js
│
└── assets/
    ├── icons/
    └── sounds/

The structure should remain modular. Each file should have a clearly defined responsibility.

---

# 5. Simulation Engine Requirements

## 5.1 Circuit State

The simulation engine must maintain a centralized state object.

Suggested initial structure:

```javascript
const circuitState = {
    power: true,

    selectedTeam: null,

    teams: {
        1: {
            pressed: false,
            locked: false,
            led: false
        },

        2: {
            pressed: false,
            locked: false,
            led: false
        },

        3: {
            pressed: false,
            locked: false,
            led: false
        },

        4: {
            pressed: false,
            locked: false,
            led: false
        }
    },

    buzzer: false,

    latch: false,

    lockout: false
};
```

This represents the proposed high-level application state, not the final physical circuit's internal electrical state.

## 5.2 Input Processing

The engine must provide a function to process team button presses.

Conceptual interface:

```javascript
function pressTeam(teamNumber) {
    // Validate input
    // Check whether another team is selected
    // Process valid input
    // Update circuit state
}
```

Requirements:

- Accept team numbers 1–4 only.
- Reject inputs if the circuit is unpowered.
- Reject inputs if another team has already been selected.
- Accept only the first valid input.
- Update all relevant circuit outputs.

## 5.3 First-Press Detection

The first valid team input must determine the selected team.

The selection must be stored until reset.

Subsequent inputs must not overwrite the selection.

The system must handle multiple inputs occurring very close together deterministically.

The tie-breaking rule for simultaneous inputs must be documented and implemented consistently.

## 5.4 Latching Mechanism

The selected team must remain selected even after its button is released.

The application must distinguish between:

- Temporary button input.
- Stored team selection.

The latch must be cleared only by the reset operation or power-cycle behaviour if explicitly implemented.

The final latch implementation must follow the physical circuit schematic.

## 5.5 Lock-Out Logic

After a team is selected:

- All other team inputs must be rejected.
- Their buttons must appear disabled.
- Their input signals must be represented as blocked.
- The selected team's output must remain active.

The visualization must distinguish between a physically blocked input and an input rejected by the simulation's logical state.

## 5.6 Reset Operation

Conceptual interface:

```javascript
function resetCircuit() {
    // Clear selected team
    // Clear latch
    // Turn off all LEDs
    // Stop buzzer
    // Unlock all teams
    // Restore initial state
}
```

Reset must restore the complete initial simulation state.

---

# 6. Logic Gate Module

The application should implement reusable logic gate functions.

Required operations:

### AND Gate

```javascript
function AND(a, b) {
    return a && b;
}
```

### OR Gate

```javascript
function OR(a, b) {
    return a || b;
}
```

### NOT Gate

```javascript
function NOT(a) {
    return !a;
}
```

These functions should operate on Boolean values.

The logic gate module should remain independent of the visual components.

Additional gates can be implemented later if the finalized circuit requires them.

---

# 7. Circuit Rendering Requirements

## 7.1 Rendering Technology

SVG must be used to create the circuit diagram.

Each component and connection should be an independently identifiable SVG element.

Example component identifiers:

- team-1-button
- team-2-button
- team-3-button
- team-4-button
- gate-and-1
- gate-or-1
- gate-not-1
- latch-1
- led-1
- buzzer-1
- reset-button

## 7.2 Wire Representation

Every wire should have:

- A unique identifier.
- Starting component.
- Ending component.
- Current logical signal value.
- Visual state.

Example:

```javascript
const wire = {
    id: "wire-01",
    source: "team-1-button",
    destination: "gate-and-1",
    signal: false
};
```

The wire state should be updated by the simulation engine.

## 7.3 Visual States

Each wire must support three basic visual states:

| State | Visual representation |
|---|---|
| Inactive | Grey |
| Active | Green |
| Blocked | Red or amber |

Colour must not be the only way of distinguishing states. Labels or patterns should also be available for accessibility.

## 7.4 Component Interaction

Clicking a component should:

1. Identify the selected component.
2. Highlight it.
3. Open its information panel.
4. Display its current input/output state.
5. Display its function.

---

# 8. Signal Visualization Engine

This module will translate logical state changes into visual animations.

## 8.1 Signal Animation

When an input is activated:

1. Identify the affected circuit connections.
2. Determine their logical states.
3. Highlight the active connections.
4. Animate signal movement.
5. Update downstream component visuals.

Animations must not modify the simulation state.

## 8.2 Animation Synchronization

The application must maintain a distinction between:

- Actual logical state.
- Visual animation progress.

For example, a team may already be logically selected while its signal animation is still travelling across the diagram.

The circuit state must remain correct regardless of animation duration.

## 8.3 Blocked Signal Animation

When another team attempts to press its button after selection:

- The input should be rejected.
- The blocked path should be highlighted.
- The selected team's state should remain unchanged.

---

# 9. User Interface Technical Requirements

## 9.1 Header

Required elements:

- Application title.
- Power indicator.
- Audio toggle.
- Reset button.

## 9.2 Circuit Workspace

Requirements:

- SVG-based circuit diagram.
- Zoom functionality.
- Pan functionality.
- Component selection.
- Active signal highlighting.

## 9.3 Team Controls

Four independent controls must be available.

Each control should display:

- Team number.
- Push button.
- LED status.
- Availability status.

## 9.4 Information Panel

The panel should display dynamic values.

Example:

```text
CIRCUIT STATUS

Selected Team: Team 2

INPUTS
S1: LOW
S2: HIGH
S3: LOW
S4: LOW

OUTPUTS
LED 1: OFF
LED 2: ON
LED 3: OFF
LED 4: OFF

BUZZER: ACTIVE

LOCKOUT: ENABLED
LATCH: ACTIVE
```

These are illustrative values for a selected-team state.

The final signal values must reflect the actual implemented circuit.

## 9.5 Event Log

The application should maintain a chronological event history.

Example:

```text
20:10:01 - System powered ON
20:10:05 - Team 2 button pressed
20:10:05 - Team 2 selected
20:10:05 - Latch activated
20:10:05 - LED 2 activated
20:10:05 - Buzzer activated
20:10:05 - Lockout enabled
```

The log should be cleared or reset appropriately when a new round begins.

---

# 10. Testing Requirements

The application must pass the following tests.

| Test | Expected result |
|---|---|
| Initial loading | All teams available |
| Team 1 pressed | Team 1 selected |
| Team 2 pressed | Team 2 selected |
| Team 3 pressed | Team 3 selected |
| Team 4 pressed | Team 4 selected |
| Second team pressed after selection | Input rejected |
| Selected button released | Selection remains stored |
| Reset pressed | All teams unlocked |
| Reset after selection | All LEDs OFF |
| Power OFF | Inputs rejected |
| Power ON | Behaviour follows defined power-cycle rules |

Additional tests:

- Rapid consecutive button presses.
- Simultaneous input attempts.
- Repeated reset operations.
- Audio disabled.
- Browser resizing.
- Animation interruption.
- Component selection during animation.

---

# 11. Technical Constraints

1. The application must run without a backend.
2. The simulation must not depend on external APIs.
3. The circuit must be rendered using SVG.
4. Simulation logic must be independent of animations.
5. All four team inputs must behave consistently.
6. Reset must restore a valid initial state.
7. The interface must not reload during simulation.
8. The circuit diagram must remain synchronized with the simulation engine.

---

# 12. Implementation Order

Development must follow this sequence.

### Stage 1: Core Logic

- Create project structure.
- Implement circuit state.
- Implement logic gates.
- Implement first-press detection.
- Implement latch.
- Implement lock-out.
- Implement reset.
- Test logic independently.

### Stage 2: Circuit Diagram

- Draw the actual circuit schematic.
- Create SVG components.
- Create SVG connections.
- Assign unique component identifiers.
- Implement component selection.

### Stage 3: State Visualization

- Connect the simulation engine to SVG.
- Update gate states.
- Update wire states.
- Update LED states.
- Update buzzer state.

### Stage 4: Animation

- Implement signal movement.
- Implement active wire highlighting.
- Implement blocked signal indication.
- Synchronize animation with logical states.

### Stage 5: User Interface

- Implement team control panel.
- Implement information panel.
- Implement event log.
- Implement zoom and pan.
- Implement audio toggle.

### Stage 6: Validation

- Test all circuit states.
- Test edge cases.
- Compare simulation behaviour with the physical circuit.
- Fix synchronization errors.

---

# 13. Critical Technical Decision: Logic Simulation vs Electrical Simulation

The first version will primarily implement digital logic simulation.

It will represent:

- HIGH and LOW signals.
- Boolean operations.
- Latching behaviour.
- Lock-out behaviour.
- Output activation.

It will not claim to calculate physically accurate voltage drops, current values, transistor-level behaviour or electrical characteristics.

If accurate electrical simulation is required later, a separate electrical simulation engine will be necessary.

The visual representation of current flow must be clearly distinguished from digital signal propagation.

---

# 14. Final Technical Objective

The final application must behave as a synchronized interactive model of the Quiz Buzzer System.

A user pressing a team button should be able to observe:

1. The input being generated.
2. The signal propagating through the circuit.
3. The logic gates changing state.
4. The latch storing the selection.
5. The LED activating.
6. The buzzer activating.
7. The remaining inputs becoming locked.

Every visual change must correspond to a valid simulation state.

**Technical success means that the application accurately represents the implemented digital logic circuit, rather than merely animating a predefined sequence.**
