class Visualizer {
    constructor(config) {
        this.config = config;
    }

    setP5(processing) {
        this.p5 = processing;
        this.setModel(this.config.visualizer.model.default);
    }

    circles = [];
    rectangles = [];
    lines = [];
    rectDirections = [
        {dx: -1, dy: 0, dz: 0},
        {dx: 0, dy: -1, dz: 0},
        {dx: 1, dy: 0, dz: 0},
        {dx: 0, dy: 1, dz: 0},
        {dx: 0, dy: 0, dz: -1},
        {dx: 0, dy: 0, dz: 1},
    ];
    wave = {
        active: false,
        state: 0,
        max: 120,
        satState: 0,
    }
    audioFrame;
    models;
    model = {
        object: null,
        path: null
    }

    setModels(models) {
        this.models = models;
    }

    setModel(modelPath) {
        this.model = {
            object: this.p5.loadModel(modelPath, true),
            path: modelPath
        }
    }

    draw(currentAudioFrame) {
        this.audioFrame = currentAudioFrame;
        this.calculateWave();

        this.drawBase();
        this.drawModel();
        this.drawSpectrum();
        this.drawLines();
        this.drawRectangles();
        this.drawCircles();
    }

    initBase() {
        this.p5.camera(0, 0, this.config.ui.cameraDistance);
        this.p5.colorMode('hsl');
        this.p5.strokeWeight(.5);
        this.p5.stroke(0);
        this.p5.background(0, 1);
        this.p5.angleMode('degrees');
    }

    drawBase() {
        this.setCamera();
        this.setBaseColor();
        this.drawLights();
        this.setMaterial();
    }

    setCamera() {
        this.p5.camera(0, 0, this.config.ui.cameraDistance + (this.audioFrame.speed.factor * this.config.ui.height * .001));
        this.p5.rotateY(this.audioFrame.perspective.yRot);
    }

    setBaseColor() {
        this.p5.strokeWeight(.5);
        this.p5.fill(this.audioFrame.colour.hueShift, 100, 50, .2);
        this.p5.stroke(this.audioFrame.colour.hueShift, 100, 50, .1);
        if (this.config.colour.mode !== 1) {
            this.p5.background(0);
        } else {
            this.p5.background(255);
        }
        this.p5.fill(255);
        this.p5.box(1);
    }

    setMaterial() {
        this.p5.specularMaterial(this.audioFrame.colour.hueShift, 100, 20, .8);
        this.p5.shininess(255);
        if (this.audioFrame.volume.avg[0] < .95) {
            this.p5.noFill();
        }
    }

    drawLights() {
        this.p5.ambientLight(100);

        let lightShift = this.audioFrame.colour.hueShift + 180;
        if (lightShift > 360) {
            lightShift -= 360;
        }
        this.p5.pointLight(lightShift, 80, 75, -200, 300, 300);
        this.p5.pointLight(lightShift, 80, 50, 200, -300, -300);
        this.p5.pointLight(lightShift, 80, 75, -50, 200, -200);
        this.p5.pointLight(lightShift, 80, 50, 50, -200, 200);
    }

    drawModel() {
        if (this.config.visualizer.model.show) {
            let upscale = 1 + (this.audioFrame.volume.avg[0] * .3);
            let rotateVector = this.p5.createVector(0, 2, 0);
            let rotation = 2 * this.audioFrame.perspective.yRot;

            this.p5.scale(upscale);
            this.p5.rotateY(-rotation, rotateVector);
            this.p5.rotateX(180);
            this.p5.model(this.model.object);
            this.p5.rotateX(-180);
            this.p5.rotateY(rotation, rotateVector);
        }
    }

    updateModel(trackName) {
        if (!this.config.visualizer.model.show) return;
        let modelFound = false;
        for(const modelName of this.models) {
            let modelN = modelName.substring(0, modelName.indexOf("."));
            if (trackName.toLowerCase().includes(modelN.toLowerCase())) {
                this.model.object = this.p5.loadModel('models/' + modelName, true);
                modelFound = true;
                //break;
            }
        }
        if (!modelFound) {
            this.model.object = this.p5.loadModel('models/stardust.obj', true);
        }
    }

    drawSpectrum() {
        if (this.config.visualizer.spectrum.show) {
            let visWidth = 20 * (this.config.ui.width / 2000);
            let visHeight = this.config.ui.height / 4;

            // range bars
            let oddity = (this.audioFrame.volume.p5.length % 2) * visWidth * 1.125;
            let freqOffset = -((this.audioFrame.volume.p5.length - 1) / 2) * visWidth * 1.25 - oddity;
            let i = this.audioFrame.volume.p5.length - 1;
            let rotateVector = this.p5.createVector(0, 2, 0);
            let rotation = 2 * this.audioFrame.perspective.yRot;
            this.p5.rotateY(-rotation, rotateVector);
            this.audioFrame.volume.p5.forEach(range => {
                range /= 255;
                freqOffset += visWidth * 1.25;
                let x = freqOffset;
                let y = 0;
                if (this.config.visualizer.model.show) {
                    this.config.visualizer.spectrum.adjustToBase = true;
                    y += 250;
                    visHeight = 100;
                } else {
                    this.config.visualizer.spectrum.adjustToBase = false;
                }
                let h = visHeight * Math.pow(range, 1 + (i * 1.5));
                if (this.config.visualizer.spectrum.adjustToBase) {
                    y += -h / 2;
                } else {
                    y += 0;
                }
                this.p5.translate(x, y, 0);
                this.p5.box(visWidth, h, visWidth);
                this.p5.translate(-x, -y, 0);
                i--;
            });
            this.p5.rotateY(rotation, rotateVector);
            this.p5.strokeWeight(.5);
        }
    }

    drawCircles() {
        if (this.config.visualizer.circles.show) {
            if (this.circles.length < this.config.visualizer.circles.max) {
                this.addCircle();
            } else {
                this.circles.shift();
                this.addCircle();
            }
            let i = 0;
            this.circles.forEach(circleEl => {
                i++;
                let opacity = i / this.circles.length;
                opacity *= opacity;
                let hue = (opacity * this.audioFrame.colour.hueArea) + this.audioFrame.colour.hueShift + (circleEl.hOffset / 10);
                while (hue > 360) hue -= 360;
                let satResults = this.getWaveStates(circleEl.x, this.audioFrame.colour.saturation, this.audioFrame.colour.brightness, opacity, hue);
                let specificSat = satResults.specificSat;
                let specificBright = satResults.specificBright;
                opacity = satResults.opacity;
                hue = satResults.hue;

                // draw
                this.p5.translate(circleEl.x, circleEl.y, circleEl.z);
                if (this.config.colour.mode !== 1) {
                    this.p5.stroke(hue, specificSat, specificBright, opacity * this.audioFrame.speed.factor);
                } else {
                    this.p5.stroke(hue, specificSat, 100 - specificBright, opacity * this.audioFrame.speed.factor * specificBright);
                }
                this.p5.noFill();
                this.p5.circle(0, 0, circleEl.size);
                this.p5.translate(-circleEl.x, -circleEl.y, -circleEl.z);
                let bounds = this.p5.random(.001, .1);
                circleEl.vx = Math.min(Math.max(circleEl.vx + this.p5.random(-bounds, bounds), -circleEl.size / 2), circleEl.size / 2);
                circleEl.vy = Math.min(Math.max(circleEl.vy + this.p5.random(-bounds, bounds), -circleEl.size / 2), circleEl.size / 2);
                circleEl.vz = Math.min(Math.max(circleEl.vz + this.p5.random(-bounds, bounds), -circleEl.size / 2), circleEl.size / 2);
                circleEl.x += circleEl.vx * this.audioFrame.speed.factor;
                circleEl.y += circleEl.vy * this.audioFrame.speed.factor;
                circleEl.z += circleEl.vz * this.audioFrame.speed.factor;
                circleEl.size += this.p5.random(-bounds / 5, bounds / 5);
            });
        }
    }

    drawRectangles() {
        if (this.config.visualizer.rectangles.show) {
            if (this.p5.frameCount % this.p5.round(16 / this.audioFrame.speed.factor) === 0) {
                if (this.rectangles.length < this.config.visualizer.rectangles.max) {
                    this.addRect();
                } else {
                    this.rectangles.shift();
                    this.addRect();
                }
            }
            let i = 0;
            this.rectangles.forEach(rectEl => {
                i++;
                if (rectEl.s < 16 + (20 * this.audioFrame.volume.avg[0]) && rectEl.s > 16 - (10 * this.audioFrame.volume.avg[1])) {
                    let opacity = i / this.rectangles.length;
                    let hue = (opacity * this.audioFrame.colour.hueArea) + this.audioFrame.colour.hueShift;
                    while (hue > 360) hue -= 360;
                    opacity = Math.max(0, opacity - this.p5.random(0, 0.1));
                    let satResults = this.getWaveStates(rectEl.x, this.audioFrame.colour.saturation, this.audioFrame.colour.brightness, opacity, hue);
                    let specificSat = satResults.specificSat;
                    let specificBright = satResults.specificBright;
                    opacity = satResults.opacity;
                    hue = satResults.hue;
                    let alpha = opacity * (this.audioFrame.colour.brightness / 50) * (this.audioFrame.colour.saturation / 100);

                    // draw
                    this.p5.translate(rectEl.x, rectEl.y, rectEl.z);

                    if (this.config.colour.mode !== 1) {
                        this.p5.fill(hue, this.audioFrame.colour.saturation, this.audioFrame.colour.brightness, alpha);
                        this.p5.stroke(hue, specificSat, specificBright, (1 - opacity) * this.audioFrame.speed.factor);
                    } else {
                        this.p5.fill(hue, this.audioFrame.colour.saturation, 100 - this.audioFrame.colour.brightness, alpha);
                        this.p5.stroke(hue, specificSat, 100 - specificBright, (1 - opacity) * this.audioFrame.speed.factor);
                    }
                    this.p5.box(rectEl.s);
                    this.p5.translate(-rectEl.x, -rectEl.y, -rectEl.z);
                }

                let bounds = this.p5.random(.001, .005);
                let halfSize = rectEl.s / 2;
                rectEl.vx = Math.min(Math.max(rectEl.vx + this.p5.random(-bounds, bounds), -halfSize), halfSize);
                rectEl.vy = Math.min(Math.max(rectEl.vy + this.p5.random(-bounds, bounds), -halfSize), halfSize);
                rectEl.vz = Math.min(Math.max(rectEl.vz + this.p5.random(-bounds, bounds), -halfSize), halfSize);
                rectEl.x += rectEl.vx * this.audioFrame.speed.factor;
                rectEl.y += rectEl.vy * this.audioFrame.speed.factor;
                rectEl.z += rectEl.vz * this.audioFrame.speed.factor;
            });
        }
    }

    drawLines() {
        if (this.config.visualizer.lines.show) {
            if (this.p5.frameCount % this.p5.round(16 / this.audioFrame.speed.factor) === 0) {
                if (this.lines.length < this.config.visualizer.lines.max) {
                    this.addLine();
                } else {
                    this.lines.shift();
                    this.addLine();
                }
            }
            let i = 0;
            this.lines.forEach(lineEl => {
                i++;
                let opacity = i / this.lines.length;
                let hue = (opacity * this.audioFrame.colour.hueArea) + this.audioFrame.colour.hueShift;
                while (hue > 360) hue -= 360;
                opacity = this.p5.max(0, opacity - this.p5.random(0, 0.1));
                let satResults = this.getWaveStates(lineEl.x, this.audioFrame.colour.saturation, this.audioFrame.colour.brightness, opacity, hue);
                let specificSat = satResults.specificSat;
                let specificBright = satResults.specificBright;
                opacity = satResults.opacity;
                hue = satResults.hue;

                // draw
                opacity = opacity * this.audioFrame.speed.factor * this.p5.random(0.5, 1.5);
                if (this.config.colour.mode !== 1) {
                    this.p5.stroke(hue, specificSat, specificBright, opacity * this.audioFrame.volume.avg[0]);
                } else {
                    this.p5.stroke(hue, specificSat, 100 - specificBright, opacity * this.audioFrame.volume.avg[0]);
                }
                if ((opacity > .8 && this.audioFrame.volume.avg[0] > .5) || this.p5.random(0, 1) > .999) {
                    this.p5.line(lineEl.x, lineEl.y, lineEl.z, lineEl.x2, lineEl.y2, lineEl.z2);
                }

                let bounds = this.p5.random(.001, .005);
                let index = i - 2;
                if (i === 1) {
                    lineEl.vx = lineEl.vx + this.p5.random(-bounds, bounds);
                    lineEl.vy = lineEl.vy + this.p5.random(-bounds, bounds);
                    lineEl.vz = lineEl.vz + this.p5.random(-bounds, bounds);
                } else {
                    lineEl.vx = this.lines[index].vx2;
                    lineEl.vy = this.lines[index].vy2;
                    lineEl.vz = this.lines[index].vz2;
                }
                lineEl.x += lineEl.vx * this.audioFrame.speed.factor;
                lineEl.y += lineEl.vy * this.audioFrame.speed.factor;
                lineEl.z += lineEl.vz * this.audioFrame.speed.factor;
                lineEl.vx2 = lineEl.vx2 + this.p5.random(-bounds, bounds);
                lineEl.vy2 = lineEl.vy2 + this.p5.random(-bounds, bounds);
                lineEl.vz2 = lineEl.vz2 + this.p5.random(-bounds, bounds);
                lineEl.x2 += lineEl.vx2 * this.audioFrame.speed.factor;
                lineEl.y2 += lineEl.vy2 * this.audioFrame.speed.factor;
                lineEl.z2 += lineEl.vz2 * this.audioFrame.speed.factor;
            });
        }
    }

    getWaveStates(x, saturation, brightness, opacity, hue) {
        let specificSat, specificBright;
        if (this.wave.active) {
            let dist = Math.max(x, this.wave.satState) - Math.min(x, this.wave.satState);
            let part = 1 - (dist / (2 * this.config.ui.width));
            if (part > .9) {
                specificSat = 100 * part;
                specificBright = part * 50;
                opacity = 1;
                hue = this.p5.millis() % 360;
            } else {
                specificSat = saturation;
                specificBright = brightness;
                opacity = 0;
            }
        } else {
            specificSat = saturation;
            specificBright = brightness;
        }
        return {specificSat, specificBright, opacity, hue};
    }

    calculateWave() {
        if (!this.wave.active && this.p5.random(0, 1) > 1 - (1 / 1000)) {
            this.wave.active = true;
            this.wave.max = this.p5.random(120, 300); // frames
            this.wave.state = 0;
        } else {
            if (this.wave.active && this.wave.state < this.wave.max) {
                this.wave.state++;
                this.wave.satState = (this.wave.state - (this.wave.max / 2)) / (this.wave.max / 2);
                this.wave.satState *= this.config.ui.width;
            } else {
                this.wave.active = false;
                this.wave.state = 0;
            }
        }
    }

    addCircle() {
        let x, y, z;
        x = this.p5.random(-this.config.ui.width / 2, this.config.ui.width / 2);
        y = this.p5.random(-this.config.ui.height / 2, this.config.ui.height / 2);
        z = this.p5.random(-this.config.ui.width, this.config.ui.width);
        const startV = .2;
        const vx = this.p5.random(-startV, startV);
        const vy = this.p5.random(-startV, startV);
        const vz = this.p5.random(-startV, startV);
        const size = this.p5.random(1, 40);
        const hOffset = this.p5.random(0, 360);
        this.circles.push({x, y, z, vx, vy, vz, size, hOffset});
    }

    addRect() {
        let x, y, z, s;
        const idCount = this.rectangles.filter(rect => rect.rectId === this.rectId).length;
        if (idCount > this.p5.random(50, 100) || this.rectangles.length === 0) {
            this.rectId++;
            const maxSize = 22;
            x = this.p5.random(-this.config.ui.width / 2, this.config.ui.width / 2);
            y = this.p5.random(-this.config.ui.height / 2, this.config.ui.height / 2);
            z = this.p5.random(-this.config.ui.width, this.config.ui.width);
            s = this.p5.random(12, maxSize);
        } else {
            const index = this.rectangles.length - 1;
            const offset = (this.rectangles[index].s * 2);

            const direction = this.rectDirections[this.p5.round(this.p5.random(0, 5))];

            x = this.rectangles[index].x + (direction.dx * offset);
            y = this.rectangles[index].y + (direction.dy * offset);
            z = this.rectangles[index].z + (direction.dz * offset);
            const change = .3;
            s = this.rectangles[index].s + this.p5.random(-this.rectangles[index].s * change, this.rectangles[index].s * change);
        }
        const startV = .0005;
        const vx = this.p5.random(-startV, startV);
        const vy = this.p5.random(-startV, startV);
        const vz = this.p5.random(-startV, startV);
        this.rectangles.push({x, y, z, vx, vy, vz, s, rectId: this.rectId});
    }

    addLine() {
        let x, y, z, x2, y2, z2;
        let vx, vy, vz, vx2, vy2, vz2;
        const dist = 500;
        const idCount = this.lines.filter(line => line.lineId === this.lineId).length;
        const startV = .0005;
        if (idCount > this.p5.random(10, 100) || this.lines.length === 0) {
            this.lineId++;
            x = this.p5.random(-this.config.ui.width / 2, this.config.ui.width / 2);
            y = this.p5.random(-this.config.ui.height / 2, this.config.ui.height / 2);
            z = this.p5.random(-this.config.ui.width, this.config.ui.width);
            x2 = x + this.p5.random(-dist, dist);
            y2 = y + this.p5.random(-dist, dist);
            z2 = z + this.p5.random(-dist, dist);
            vx = this.p5.random(-startV, startV);
            vy = this.p5.random(-startV, startV);
            vz = this.p5.random(-startV, startV);
        } else {
            const index = this.lines.length - 1;
            x = this.lines[index].x2;
            y = this.lines[index].y2;
            z = this.lines[index].z2;
            vx = this.lines[index].vx2;
            vy = this.lines[index].vy2;
            vz = this.lines[index].vz2;
            x2 = x + this.p5.random(-dist, dist);
            y2 = y + this.p5.random(-dist, dist);
            z2 = z + this.p5.random(-dist, dist);
        }
        vx2 = this.p5.random(-startV, startV);
        vy2 = this.p5.random(-startV, startV);
        vz2 = this.p5.random(-startV, startV);
        this.lines.push({x, y, z, x2, y2, z2, vx, vy, vz, vx2, vy2, vz2, lineId: this.lineId});
    }

    rectId = 0;
    lineId = 0;
}

export { Visualizer };