import {AudioFrame} from "./models/AudioFrame.mjs";

class AudioAnalyzer {
    constructor(config) {
        this.config = config;
    }

    setP5(p) {
        this.p5 = p;
    }

    setConfig(config) {
        this.config = config;
        this.getAnalyzers();
    }

    setMic(mic) {
        this.mic = mic;
        this.getAnalyzers();
    }

    setSound(sound) {
        this.sound = sound;
        this.getAnalyzers();
    }

    getAnalyzers() {
        this.p5fft = new p5.FFT(this.config.audio.analyze.smoothing);

        if (this.config.audio.useMic) {
            this.p5fft.setInput(this.mic);
        } else {
            this.p5fft.setInput(this.sound);
        }
    }

    getFrequencyRanges() {
        let freq = [];
        let volume;
        if (this.config.audio.useMic) {
            volume = 1.8;
        } else {
            volume = this.config.audio.volume;
        }
        let adjust = [
            (1 / this.config.audio.userVolume),
            (1 / this.config.audio.userVolume),
            (1 / this.config.audio.userVolume),
            (1 / this.config.audio.userVolume),
            (1 / this.config.audio.userVolume)
        ];
        freq[0] = Math.min(255, adjust[0] * volume * this.p5fft.getEnergy("bass"));
        freq[1] = Math.min(255, adjust[1] * volume * this.p5fft.getEnergy("lowMid"));
        freq[2] = Math.min(255, adjust[2] * volume * this.p5fft.getEnergy("mid"));
        freq[3] = Math.min(255, adjust[3] * volume * this.p5fft.getEnergy("highMid"));
        freq[4] = Math.min(255, adjust[4] * volume * this.p5fft.getEnergy("treble"));
        return freq;
    }

    analyze(previousFrame) {
        // let spectrum = this.p5fft.analyze();
        let freq = this.getFrequencyRanges();
        let avg = [
            (freq[0] + freq[1]) / (2 * 255),
            (freq[3] + freq[4]) / (255),
        ];
        return new AudioFrame(this.config, freq, avg, previousFrame, this.p5);
    }

    newAudioAPI() {
        const analyserNode = new AnalyserNode(audioCtx, {
            fftSize: 1024,
            maxDecibels: 0,
            minDecibels: -255,
            smoothingTimeConstant: 0.7,
        });

        let AudioContext = window.AudioContext || window.webkitAudioContext;
        let audioCtx = new AudioContext();

        let audioElement = document.querySelector("audio");
        let source = audioCtx.createMediaElementSource(audioElement);
        let gainNode = audioCtx.createGain();
        let finish = audioCtx.destination;
    }
}

export { AudioAnalyzer };