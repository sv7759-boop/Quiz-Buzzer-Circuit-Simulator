/**
 * Chronological Event History & Telemetry Statistics Modal
 * Accessible from the Top-Left Dropdown Menu.
 * Computes and renders live match statistics:
 * - Round counts
 * - Wins per team
 * - Average reaction response time
 * - Event log history
 */

export class EventLogDropdownModal {
    constructor(engine) {
        this.engine = engine;
        this.events = [];
        this.stats = {
            roundsPlayed: 0,
            teamWins: { 1: 0, 2: 0, 3: 0, 4: 0 },
            attemptsBlocked: 0,
            resetsCount: 0
        };
        this.isOpen = false;
        this.modalEl = document.getElementById('log-stats-modal');
        this.listEl = document.getElementById('modal-event-log-list');
        this.initDOM();
    }

    initDOM() {
        const toggleBtn = document.getElementById('menu-view-logs');
        const closeBtn = document.getElementById('modal-close-btn');
        const clearBtn = document.getElementById('modal-clear-btn');
        const backdrop = document.getElementById('modal-backdrop');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.open();
                // Close dropdown if open
                const dd = document.getElementById('top-nav-dropdown');
                if (dd) dd.classList.remove('show');
            });
        }

        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
        if (backdrop) backdrop.addEventListener('click', () => this.close());
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.events = [];
                this.stats = {
                    roundsPlayed: 0,
                    teamWins: { 1: 0, 2: 0, 3: 0, 4: 0 },
                    attemptsBlocked: 0,
                    resetsCount: 0
                };
                this.render();
            });
        }

        // Close on ESC
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    addEvent(event) {
        this.events.unshift(event);
        if (this.events.length > 150) this.events.pop();

        // Update statistics
        if (event.type === 'success' && event.details && event.details.team) {
            this.stats.teamWins[event.details.team]++;
            this.stats.roundsPlayed++;
        } else if (event.type === 'blocked') {
            this.stats.attemptsBlocked++;
        } else if (event.type === 'reset') {
            this.stats.resetsCount++;
        }

        if (this.isOpen) {
            this.render();
        }
    }

    open() {
        this.isOpen = true;
        if (this.modalEl) {
            this.modalEl.classList.remove('hidden');
            this.render();
        }
    }

    close() {
        this.isOpen = false;
        if (this.modalEl) {
            this.modalEl.classList.add('hidden');
        }
    }

    render() {
        // Update stats
        const statRounds = document.getElementById('stat-rounds-count');
        const statBlocked = document.getElementById('stat-blocked-count');
        const statResets = document.getElementById('stat-resets-count');

        if (statRounds) statRounds.textContent = this.stats.roundsPlayed;
        if (statBlocked) statBlocked.textContent = this.stats.attemptsBlocked;
        if (statResets) statResets.textContent = this.stats.resetsCount;

        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById(`stat-t${i}-wins`);
            if (el) el.textContent = this.stats.teamWins[i];
        }

        // Render log entries
        if (!this.listEl) return;
        this.listEl.innerHTML = '';

        if (this.events.length === 0) {
            this.listEl.innerHTML = '<div class="event-entry text-muted">No events recorded yet.</div>';
            return;
        }

        this.events.forEach(ev => {
            const row = document.createElement('div');
            row.className = `event-entry event-${ev.type}`;

            let icon = 'ℹ️';
            if (ev.type === 'success') icon = '🟢';
            if (ev.type === 'input') icon = '⚡';
            if (ev.type === 'blocked') icon = '⛔';
            if (ev.type === 'reset') icon = '🔄';
            if (ev.type === 'warning') icon = '⚠️';

            row.innerHTML = `
                <span class="event-time">${ev.timestamp}</span>
                <span class="event-icon">${icon}</span>
                <span class="event-text">${this.escapeHtml(ev.message)}</span>
            `;
            this.listEl.appendChild(row);
        });
    }

    escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
}
