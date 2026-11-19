# Product Requirements Document (PRD)
## Project: Interactive Quiz Buzzer Circuit Simulator

**Version:** 1.0  
**Product Type:** Web-based Interactive Electronics Simulator  
**Platform:** Desktop-first Web Application  
**Primary Domain:** Digital Logic Design

---

# 1. Product Overview

### 1.1 Product Vision

Build an interactive web application that simulates the working of a four-team Quiz Buzzer System using digital logic gates.

Users should be able to interact with virtual hardware components, press team buttons, and visually observe how the circuit responds.

The application should demonstrate the complete working of the circuit, including:

- Push-button inputs.
- Digital signal propagation.
- Logic gate operations.
- Latching mechanism.
- First-press detection.
- Lock-out mechanism.
- LED indicators.
- Buzzer activation.
- Reset functionality.

The central objective is to help users understand the actual working of a digital logic circuit through visual interaction.

### 1.2 Problem Statement

Traditional circuit diagrams are static and difficult for beginners to understand.

Students can see the connections between components but cannot easily visualize how signals propagate, how a latch stores information, or how the lock-out mechanism prevents other inputs from activating.

This application solves that problem by transforming a static circuit into an interactive simulation.

---

# 2. Target Users

### Primary Users
- Electronics and Communication Engineering students.
- Digital Logic Design students.
- Students studying basic digital electronics.

### Secondary Users
- Faculty members demonstrating digital circuits.
- Beginners learning logic gates and sequential circuits.

---

# 3. Core User Experience

The application should simulate a quiz competition involving four teams.

Each team has:
- One push button.
- One LED indicator.

The system also contains:
- A buzzer.
- A reset button.
- Digital logic circuitry.
- A power supply.

### Expected behaviour

**Initial State:**
- All four buttons are enabled.
- All LEDs are OFF.
- Buzzer is OFF.
- No team is selected.

**When a team presses first:**

1. Its push button activates.
2. The corresponding input signal propagates through the circuit.
3. The latching mechanism stores the selection.
4. The corresponding LED turns ON.
5. The buzzer activates.
6. The lock-out mechanism disables the remaining three inputs.

**After selection:**
- Other team buttons cannot activate the circuit.
- The selected team remains displayed.
- The circuit stays in the selected state until reset.

**When RESET is pressed:**
- The latch is cleared.
- All LEDs turn OFF.
- The buzzer stops.
- All team buttons become available again.

---

# 4. Functional Requirements

## FR-01: Interactive Circuit Diagram

The application must display a complete digital circuit diagram.

The diagram should contain:

| Component | Function |
|---|---|
| Power supply | Provides circuit power |
| Push buttons | Generate team inputs |
| AND gates | Perform logical AND operations |
| OR gates | Perform logical OR operations |
| NOT gates | Perform logical inversion |
| Flip-flops/latches | Store the selected team |
| LEDs | Display the selected team |
| Buzzer | Provide an audio indication |
| Reset circuit | Restore the initial state |

Requirements:
- Components must be visually distinguishable.
- Connections between components must be visible.
- Active signal paths must be highlighted.
- Inactive paths must remain distinguishable.
- Components should have labels.
- Clicking a component should display its name and function.

**Important:** The final component arrangement and connections must be based on the actual hardware schematic. Exact IC selection and gate connections are yet to be finalized.

## FR-02: Interactive Team Buttons

The application must provide four functional team buttons.

Requirements:
- Each button must be clickable.
- Pressing a button must generate an input signal.
- The button should visually change when pressed.
- Only the first valid input should be accepted.
- Subsequent inputs should be rejected until reset.

## FR-03: Signal Flow Animation

This is one of the most important features.

The application must visually demonstrate signal propagation.

Requirements:
- Active wires should glow.
- Signal movement should be animated.
- Logic gates should visually indicate their active state.
- Inactive signals should be distinguishable.
- Blocked signals should have a separate visual representation.

The animation must follow the actual logical state of the circuit.

## FR-04: LED Indicators

Four separate LED indicators must be displayed.

Requirements:
- Each LED corresponds to one team.
- The selected team's LED turns ON.
- Other LEDs remain OFF.
- All LEDs turn OFF after reset.

## FR-05: Buzzer

Requirements:
- Buzzer activates when a valid team is selected.
- Buzzer remains active until reset.
- Buzzer should have a visual ON/OFF indication.
- Users should be able to mute simulation audio without affecting circuit logic.

## FR-06: Lock-Out Mechanism

This is a critical feature.

Requirements:
- Once a team is selected, all other team inputs must become inactive.
- The application must visually demonstrate why the other inputs are blocked.
- The selected team's state must remain latched.
- Reset must restore all inputs.

## FR-07: Reset Functionality

Requirements:
- A dedicated reset button must be available.
- Reset clears the stored selection.
- All LEDs turn OFF.
- Buzzer stops.
- All team inputs become available.
- Circuit returns to its initial state.

## FR-08: Live Circuit Information

A separate information panel should display:

| Parameter | Example |
|---|---|
| Selected team | Team 2 |
| Input state | S2 = HIGH |
| LED state | ON |
| Buzzer state | ACTIVE |
| Lock-out | ENABLED |
| Circuit state | SELECTED |

The values must update dynamically.

## FR-09: Component Information

Users should be able to click individual components to understand their purpose.

Example:

**AND Gate**

- Component: AND Gate
- Function: Produces HIGH output when all inputs are HIGH.
- Current input states: A = HIGH, B = LOW.
- Output state: LOW.

The information panel should update according to the selected component.

---

# 5. User Interface Requirements

## 5.1 Overall Layout

The interface should have four primary sections.

**Section A: Header**
- Project title.
- Short description.
- Power indicator.
- Audio toggle.
- Reset button.

**Section B: Circuit Simulation Area**

This should occupy the largest portion of the screen.

It should contain:
- Complete circuit diagram.
- Logic gates.
- Connecting wires.
- Interactive switches.
- LEDs.
- Buzzer.

Users should be able to zoom and pan around the circuit.

**Section C: Team Control Panel**

Four separate team controls.

Each team should have:
- Team name.
- Push button.
- LED indicator.
- Current status.

**Section D: Information Panel**

Display:
- Current circuit state.
- Selected team.
- Input/output values.
- Component information.
- Event log.

## 5.2 Visual Design

The application should resemble a professional electronics laboratory simulator.

Suggested design:

- Dark navy background.
- Green for active signals.
- Grey for inactive connections.
- Red or amber for blocked signals.
- Bright indicator LEDs.
- Clearly distinguishable logic gate symbols.

Avoid excessive animations and unnecessary decorative elements.

The circuit diagram should remain the visual focus.

---

# 6. Technical Architecture

The application should have three independent layers.

### Layer 1: Simulation Engine

Responsible for:
- Processing button inputs.
- Maintaining circuit state.
- Evaluating logic gates.
- Managing latching.
- Managing lock-out.
- Processing reset.

### Layer 2: Visualization Engine

Responsible for:
- Rendering the circuit.
- Highlighting active wires.
- Animating signal propagation.
- Updating LEDs.
- Displaying component states.

### Layer 3: User Interface

Responsible for:
- Team controls.
- Reset button.
- Information panels.
- Component descriptions.
- Event logs.

The visualization must never independently decide the circuit's logical state. It should always reflect the simulation engine.

---

# 7. Suggested Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling and layout |
| JavaScript | Simulation logic |
| SVG | Circuit diagram rendering |
| GSAP | Signal animations (optional) |
| Local Storage | Optional persistence of user settings |

### Architecture Decision

For the first version:
- No backend.
- No database.
- No authentication.
- No external API dependency.

The entire simulation should run inside the browser.

SVG is recommended for the circuit diagram because individual components, connections and wires can be manipulated independently.

---

# 8. Non-Functional Requirements

### Performance
- Interactions should feel instantaneous.
- Animations should remain smooth.
- The circuit should respond without page reloads.

### Reliability
- Multiple button presses must not produce inconsistent states.
- Reset must always restore the initial state.
- Only one team can be selected per round.

### Usability
- Buttons should be clearly identifiable.
- Active and inactive signals should be distinguishable.
- The circuit should be understandable to beginners.

### Compatibility
- Primary support: Desktop browsers.
- Responsive layout for tablets.
- Mobile support can be considered later.

---

# 9. Development Roadmap

Development should happen incrementally.

### Phase 1: Circuit Design
- Finalize the actual hardware schematic.
- Identify required ICs.
- Define all inputs and outputs.
- Understand the latching and lock-out logic.

### Phase 2: Static Interface
- Create the application layout.
- Draw the circuit using SVG.
- Add all component symbols.
- Connect components visually.

### Phase 3: Simulation Engine
- Implement button inputs.
- Implement first-press detection.
- Implement latching.
- Implement lock-out.
- Implement reset.

### Phase 4: Visualization
- Animate signal propagation.
- Highlight active paths.
- Update gate states.
- Implement LED and buzzer indicators.
- Visualize blocked inputs.

### Phase 5: Educational Features
- Add component descriptions.
- Add live input/output values.
- Add event logs.
- Add circuit explanations.

### Phase 6: Testing
- Test all four team buttons individually.
- Test simultaneous button presses.
- Test lock-out behaviour.
- Test reset.
- Verify that visual states match logical states.

---

# 10. Acceptance Criteria

The first version will be considered successful when:

1. Four team buttons are interactive.
2. Only the first valid team input is accepted.
3. The selected team's LED turns ON.
4. The buzzer activates.
5. Other team buttons become locked.
6. Active signal paths are visually highlighted.
7. The user can identify how the signal travels through the circuit.
8. The information panel displays correct input/output states.
9. Reset restores the original state.
10. Visual behaviour accurately represents the implemented circuit logic.

---

# 11. Out of Scope (Version 1)

The following features are not required initially:

- User accounts.
- Cloud storage.
- Multiplayer competitions.
- Database integration.
- Real hardware connectivity.
- PCB design.
- Automatic circuit generation.
- Multiple circuit projects.

These can be considered in future versions.

---

# 12. Future Possibilities

Once the first simulator works, the application could be extended with:

- Step-by-step simulation mode.
- Slow-motion signal propagation.
- Logic gate truth tables.
- Voltage and current visualization.
- Component-level explanations.
- Interactive learning mode.
- Fault simulation (broken wire, faulty gate).
- Different digital logic projects.

---

# 13. Product Success Definition

The application should allow someone with basic digital electronics knowledge to interact with the Quiz Buzzer System and understand:

1. How a button generates an input.
2. How the logic circuit processes that input.
3. How the latch stores the first selection.
4. How the lock-out mechanism blocks subsequent inputs.
5. How the LED and buzzer respond.
6. How resetting restores the circuit.

**The ultimate goal is not simply to show that the circuit works, but to make the user understand WHY it works.**
