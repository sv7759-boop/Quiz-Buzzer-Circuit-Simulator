/**
 * Standard Digital Logic Gate Primitives
 * All operations work strictly on Boolean/binary (true/false or 1/0)
 */

export const LogicGates = {
    AND: (a, b) => Boolean(a && b),
    AND3: (a, b, c) => Boolean(a && b && c),
    AND4: (a, b, c, d) => Boolean(a && b && c && d),
    OR: (a, b) => Boolean(a || b),
    OR3: (a, b, c) => Boolean(a || b || c),
    OR4: (a, b, c, d) => Boolean(a || b || c || d),
    NOT: (a) => !a,
    NAND: (a, b) => !(a && b),
    NOR: (a, b) => !(a || b),
    XOR: (a, b) => Boolean(a ? !b : b),

    /**
     * Active-Low Set-Reset Latch (Quad S̄-R̄ Latch / 74HC279 structure)
     * Real 74HC279:
     * S̄ = 0, R̄ = 1 => Q = 1 (Set)
     * S̄ = 1, R̄ = 0 => Q = 0 (Reset)
     * S̄ = 1, R̄ = 1 => Hold previous Q (No change)
     * S̄ = 0, R̄ = 0 => Q = 1 (Unstable/Not recommended in datasheets)
     * Note: 74HC279 outputs only Q (no Q̄ pin).
     */
    SR_Latch_74HC279: (sBar, rBar, prevQ) => {
        const s_active = !sBar; // Active when 0
        const r_active = !rBar; // Active when 0

        if (s_active && !r_active) {
            return { Q: true, state: 'SET' };
        } else if (!s_active && r_active) {
            return { Q: false, state: 'RESET' };
        } else if (!s_active && !r_active) {
            return { Q: prevQ, state: 'HOLD' };
        } else {
            // Both active low (S̄=0, R̄=0)
            return { Q: true, state: 'INVALID_BOTH_LOW' };
        }
    },

    /**
     * Classic Cross-Coupled NOR Bistable Multivibrator Latch
     * S = 1, R = 0 => Q = 1, Q̄ = 0 (Set)
     * S = 0, R = 1 => Q = 0, Q̄ = 1 (Reset)
     * S = 0, R = 0 => Hold previous state
     * S = 1, R = 1 => Q = 0, Q̄ = 0 (Forbidden)
     */
    SR_Latch_CrossCoupled_NOR: (s, r, prevQ) => {
        if (s && !r) return { Q: true, Q_bar: false, state: 'SET' };
        if (!s && r) return { Q: false, Q_bar: true, state: 'RESET' };
        if (!s && !r) return { Q: prevQ, Q_bar: !prevQ, state: 'HOLD' };
        return { Q: false, Q_bar: false, state: 'FORBIDDEN' };
    }
};
