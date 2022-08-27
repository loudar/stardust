class AudioFrame {
    fullHueRange = 360;

    constructor(config, p5volumes, average, spectrum, previousFrame, p5) {
        this.volume = {
            p5: p5volumes,
            avg: average,
            spectrum: spectrum
        }
        
        if (this.volume.avg[0] < config.audio.analyze.thresholds[0]) {
            this.volume.avg[0] = 0 
        } else {
            this.volume.avg[0] = Math.pow((this.volume.avg[0] - config.audio.analyze.thresholds[0]) / (1 - config.audio.analyze.thresholds[0]), 1.5)
        }
        
        if (this.volume.avg[1] < config.audio.analyze.thresholds[1]) {
            this.volume.avg[1] = 0
        } else {
            this.volume.avg[1] = Math.pow((this.volume.avg[1] - config.audio.analyze.thresholds[1]) / (1 - config.audio.analyze.thresholds[1]), 4)
        }

        let highToLow = .5;
        let speed = Math.min(1, (this.volume.avg[0] / highToLow + this.volume.avg[1] * highToLow) * .5);
        speed = config.audio.analyze.volumeFunction(speed);
        this.speeds = previousFrame.speeds || [];
        this.speeds.push(speed);
        if (this.speeds.length > 100) {
            this.speeds.shift();
        }
        let sum = 0;
        for (let i = 0; i < this.speeds.length; i++) {
            sum += this.speeds[i];
        }
        let walkingAverage = sum / this.speeds.length;

        this.maxSpeed = previousFrame.maxSpeed !== undefined ? previousFrame.maxSpeed : {value: 0, timestamp: p5.millis()};
        if (this.maxSpeed.timestamp + 10 * 1000 < p5.millis()) {
            this.maxSpeed.value = 0;
            this.maxSpeed.timestamp = p5.millis();
        }
        if (speed > this.maxSpeed.value) {
            this.maxSpeed = {
                value: speed,
                timestamp: p5.millis()
            }
        }
        if (walkingAverage > .5) {
            speed = speed * (1 / this.maxSpeed.value);
        }

        if (isNaN(previousFrame.colour.hueShift)) {
            previousFrame.colour.hueShift = 0;
        }
        let hueShift = previousFrame.colour.hueShift + .1;
        if (hueShift >= this.fullHueRange) {
            hueShift -= this.fullHueRange;
        }
        const hueLimit = p5.random(90, this.fullHueRange);
        if (isNaN(previousFrame.colour.hueV)) {
            previousFrame.colour.hueV = 0;
        }
        if (isNaN(previousFrame.colour.hueArea)) {
            previousFrame.colour.hueArea = 0;
        }
        const hueV = Math.min(Math.max(-3, previousFrame.colour.hueV + p5.random(-.1, .1)), 3);
        const hueArea = Math.min(Math.max(90, previousFrame.colour.hueArea + hueV), hueLimit);

        const peakTreshholdH = config.audio.analyze.peakThresholdHigh;
        const peakTreshholdL = config.audio.analyze.peakThresholdLow;
        this.lastPeaks = previousFrame.lastPeaks !== undefined ? previousFrame.lastPeaks : [];
        this.waitForNextPeak = previousFrame.waitForNextPeak !== undefined ? previousFrame.waitForNextPeak : false;
        this.peak = false;
        const peakDeviation = 0.2;
        if (this.volume.avg > previousFrame.volume.avg * (1 + peakDeviation) && !previousFrame.waitForNextPeak) {
            if (config.audio.analyze.peakHueShift) {
                hueShift += 30;
                if (hueShift >= this.fullHueRange) hueShift -= this.fullHueRange;
            }

            this.waitForNextPeak = true;
            let peak = {
                timestamp: p5.millis(),
            };
            if (this.lastPeaks.length > 10) {
                this.lastPeaks.shift();
            }
            this.lastPeaks.push(peak);
            this.peak = true
        } else if (speed < peakTreshholdL) {
            this.waitForNextPeak = false;
        }

        this.speed = {
            speed: speed,
            factor: Math.pow((speed + .5), 8),
        }

        let millisDif = p5.millis() - previousFrame.time.millis;
        if(isNaN(previousFrame.perspective.yRot)){
            previousFrame.perspective.yRot = 0;
        }
        let yRotation = (previousFrame.perspective.yRot + ((millisDif / 400) + this.speed.speed * .2 + this.volume.avg[0] + .5) * .35) % 360;
        let yRotationB = (previousFrame.perspective.yRot + ((millisDif / 400) + this.speed.speed * .4 + this.volume.avg[0] + .5) * .35) % 360;

        this.time = {
            millis: p5.millis(),
        }
        this.perspective = {
            yRot: yRotation,
            yRotB: yRotationB
        }
        this.colour = {
            brightness: this.speed.speed * 50,
            saturation: this.speed.speed * 100,
            hueShift: hueShift,
            hueV: hueV,
            hueArea: hueArea,
        }
    }

    colour = {};
    perspective = {};
    time = {};
    speed = {};
    volume = {};
}

export { AudioFrame };