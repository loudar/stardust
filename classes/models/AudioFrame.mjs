class AudioFrame {
    fullHueRange = 360;

    constructor(config, p5volumes, average, previousFrame, p5) {
        this.volume = {
            p5: p5volumes,
            avg: average,
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

        let speed = Math.min(1, (this.volume.avg[0] + this.volume.avg[1]) * .5);

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

        const peakTreshhold = config.audio.analyze.peakThreshold;
        if (speed > peakTreshhold && p5.random(0, 1) > .3 && !previousFrame.waitForNextPeak) {
            hueShift += 30;
            if (hueShift >= this.fullHueRange) hueShift -= this.fullHueRange;
            this.waitForNextPeak = true;
        } else if (speed < peakTreshhold) {
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

        this.time = {
            millis: p5.millis(),
        }
        this.perspective = {
            yRot: yRotation
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