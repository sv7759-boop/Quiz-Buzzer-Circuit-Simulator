/**
 * Web Audio Synthesizer for Buzzer & Click Sound Effects
 * Plays sound for 1 second when triggered, then automatically mutes audio
 * while continuing visual animation until reset.
 */

export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.buzzerOsc = null;
        this.buzzerGain = null;
        this.isBuzzing = false;
        this.buzzerTimeout = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playClick() {
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
    }

    startBuzzerTone() {
        this.init();
        if (!this.ctx || this.isBuzzing) return;

        this.buzzerOsc = this.ctx.createOscillator();
        this.buzzerGain = this.ctx.createGain();

        // Authentic dual-tone piezo buzz
        this.buzzerOsc.type = 'sawtooth';
        this.buzzerOsc.frequency.setValueAtTime(880, this.ctx.currentTime); // Concert A5

        this.buzzerGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

        this.buzzerOsc.connect(this.buzzerGain);
        this.buzzerGain.connect(this.ctx.destination);

        this.buzzerOsc.start();
        this.isBuzzing = true;

        // Requirement: Play audio for 1 second, then stop audio while animation continues
        if (this.buzzerTimeout) clearTimeout(this.buzzerTimeout);
        this.buzzerTimeout = setTimeout(() => {
            this.silenceBuzzer();
        }, 1000);
    }

    silenceBuzzer() {
        if (this.isBuzzing && this.buzzerGain && this.ctx) {
            try {
                this.buzzerGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
                setTimeout(() => {
                    if (this.buzzerOsc) {
                        try {
                            this.buzzerOsc.stop();
                            this.buzzerOsc.disconnect();
                        } catch (e) {}
                        this.buzzerOsc = null;
                    }
                    this.isBuzzing = false;
                }, 90);
            } catch (e) {
                this.isBuzzing = false;
            }
        }
    }

    stopBuzzerTone() {
        if (this.buzzerTimeout) {
            clearTimeout(this.buzzerTimeout);
            this.buzzerTimeout = null;
        }
        this.silenceBuzzer();
    }

    playResetTone() {
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
}
