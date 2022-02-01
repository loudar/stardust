const sounds = [
    "example sound 1",
    "example sound 2",
];
let i;
createTracklist(sounds);

let circles = [];
const maxCircles = 200;
let rects = [];
const maxRects = 500;
let hueShift = Math.random() * 360;
let hueArea = 90;
let hueV = 0;
let hueLimit = 360;
let rowid = 0;
const bgBrightClamp = 2;
let width = window.innerWidth;
let height = window.innerHeight;
let catchRadius = 100;
let rectDirections = [
    {dx: -1, dy: 0, dz: 0},
    {dx: 0, dy: -1, dz: 0},
    {dx: 1, dy: 0, dz: 0},
    {dx: 0, dy: 1, dz: 0},
    {dx: 0, dy: 0, dz: -1},
    {dx: 0, dy: 0, dz: 1},
];
const bpm = 126;
const bps = bpm / 60;
const spb = (1 / bps);
let bgBrightness;
let autoplay = false;

const drawCircles = true;
const drawRectangles = true;
let sound = [], amplitude, fft;
let bass, lowMid, mid, highMid, treble;
const showVisualizer = true;
let savedMillis, yRotation;
let waitForNextPeak = false;
let audioPlayed = false;

let cam = {
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0
};

let currentSound = 0;
const volume = 1;

window.onresize = function() {
    windowResized();
}

window.onkeydown = function(ev) {
    if (ev.key === "ArrowRight") playNextSound();
    if (ev.key === "ArrowLeft") playPrevSound();
    if (ev.key === " ") togglePlay();
    if (ev.key === "t") toggleTrackList();
}

function updateTitle(trackName) {
    document.querySelector("h1").innerHTML = trackName;
}

function createTracklist(sounds) {
    let tracklist = document.querySelector(".trackListContent");
    i = 0;
    sounds.forEach(soundName => {
        let soundEl = document.createElement("div");
        soundEl.classList.add("trackListTrack");
        soundEl.id = i;
        soundEl.innerHTML = soundName;
        let toPlay = i;
        soundEl.onclick = function() {
            playTrack(toPlay);
        };
        tracklist.appendChild(soundEl);
        i++;
    });
}

async function togglePlay() {
    autoplay = true;
    if (getAudioContext().state === 'running') {
        await getAudioContext().suspend();
    } else {
        await startPlay();
    }
}

async function startPlay() {
    await getAudioContext().resume();
    if (getAudioContext().state !== 'running' || !audioPlayed) {
        sound[currentSound].play(0);
        while (!sound[currentSound].isPlaying()) {
            // wait
        }
    }
    audioPlayed = true;
}

function playNewSound() {
    sound[currentSound].play(0);
    while (!sound[currentSound].isPlaying()) {
        // wait
    }
    getAnalyzers();
    updateTitle(sounds[currentSound]);
    if (getAudioContext().state !== 'running') {
        togglePlay();
    }
    updateTracklist();
}

function updateTracklist() {
    let tracklistTracks = document.querySelectorAll(".trackListTrack");
    tracklistTracks.forEach(trackListTrack => {
        if (parseInt(trackListTrack.id) === currentSound) {
            trackListTrack.classList.add("active");
        } else {
            trackListTrack.classList.remove("active");
        }
    });
}

function playTrack(listIndex) {
    sound[currentSound].stop();
    currentSound = max(0, min(sound.length, listIndex));
    playNewSound();
}

function playNextSound() {
    sound[currentSound].stop();
    currentSound++;
    if (currentSound > sound.length - 1) currentSound = 0;
    playNewSound();
}

function playPrevSound() {
    sound[currentSound].stop();
    currentSound = currentSound - 1;
    if (currentSound < 0) currentSound = sound.length;
    playNewSound();
}

function getAnalyzers() {
    amplitude = new p5.Amplitude();
    amplitude.setInput(sound[currentSound]);
    fft = new p5.FFT();
    fft.setInput(sound[currentSound]);
}

function showProgress(value) {
    let progress = document.querySelector("progress");
    progress.value = value;
    //console.log("sound loaded " + (progress * 100) + " %.");
}

async function preload() {
    soundFormats('mp3', 'ogg');
    let progress = document.querySelector("progress");
    progress.style.opacity = "1";
    for (i = 0; i < sounds.length; i++) {
        let soundName = sounds[i];
        sound[i] = loadSound("sounds/"+soundName, function() {
            //console.log("File "+soundName+" loaded.");
        }, function() {
            throw new Error("Error loading audio file: "+soundName);
        }, showProgress);
        sound[i].setVolume(volume);
    }
    progress.style.opacity = "0";
}

function setup() {
    createCanvas(width, height - 4, WEBGL);
    camera(0, 0, width / 2);
    colorMode(HSL);
    strokeWeight(.5);
    stroke(0);
    getAnalyzers();
    updateTitle(sounds[currentSound]);
    updateTracklist();
    background(0, 1);
    savedMillis = millis();
    yRotation = 0;
    getAudioContext().suspend();
}

function windowResized() {
    width = window.innerWidth;
    height = window.innerHeight;
    resizeCanvas(width, height - 4);
}

function draw() {
    // orbitControl();

    // hue mod, random
    hueShift += .1;
    hueLimit = random(90, 360);
    hueV = min(max(-3, hueV + random(-.1, .1)), 3);
    hueArea = min(max(90, hueArea + hueV), hueLimit);
    if (hueShift >= 360) hueShift -= 360;

    // audio
    if (autoplay && !sound[currentSound].isPlaying()) {
        playNextSound();
    }
    let spectrum = fft.analyze();
    let freq = [];
    freq[0] = fft.getEnergy("bass");
    freq[1] = fft.getEnergy("lowMid");
    freq[2] = fft.getEnergy("mid");
    freq[3] = fft.getEnergy("highMid");
    freq[4] = fft.getEnergy("treble");
    let avg = [
        (freq[0] + freq[1]) / (2 * 255),
        (freq[3] + freq[4]) / (255),
    ];

    let treshhold = [];
    treshhold[0] = .8;
    treshhold[1] = .6;
    if (avg[0] < treshhold[0]) { avg[0] = 0 } else { avg[0] = (avg[0] - treshhold[0]) / (1 - treshhold[0]) }
    if (avg[1] < treshhold[1]) { avg[1] = 0 } else { avg[1] = pow((avg[1] - treshhold[1]) / (1 - treshhold[1]), 2) }
    let speed = min(1, (avg[0] + avg[1]) * .5);
    let speedFactor = pow((speed + .5), 8);
    let brightness = speed * 50;
    let saturation = speed * 100;
    if (brightness > 50 - bgBrightClamp) {
        bgBrightness = 50;
    } else {
        bgBrightness = 0;
    }
    // change hue if lucky :D
    let peakTreshhold = .99;
    if (speed > peakTreshhold && !waitForNextPeak) {
        hueShift += 120;
        if (hueShift >= 360) hueShift -= 360;
        waitForNextPeak = true;
    } else if (speed < peakTreshhold) {
        waitForNextPeak = false;
    }

    background(0);

    if (avg[0] > 2 && cam.z < width / 4) {
        cam.vz += .01;
    } else {
        if (cam.z > 0) {
            cam.z -= cam.vz;
        } else {
            cam.vz = 0;
        }
    }
    camera(0, 0, (width / 2) + (speed * (height * .05)));

    let millisDif = millis() - savedMillis;
    yRotation = yRotation + (millisDif / 200) + speed * .3;
    angleMode(DEGREES);
    rotateY(yRotation);
    savedMillis = millis();

    /* Testing bars*/
    if (showVisualizer) {
        let visWidth = 40;
        let visHeight = height / 4;

        /* bounding box
        stroke(0, 100, 100, 1);
        fill(0, 100, 100, 0);
        rect(-(((freq.length - 1) / 2) * visWidth * 1.25) - 1, -(visHeight + 1), (freq.length * visWidth * 1.25) + 2, visHeight + 2);*/

        // range bars
        //fill(0, 100, 100, 255);
        fill(0, 0);
        strokeWeight(1.5);
        stroke(0, 0, 100, 255);
        let oddity = (freq.length % 2) * visWidth * 1.125;
        let freqOffset = -((freq.length - 1) / 2) * visWidth * 1.25 - oddity;
        freq.forEach(range => {
            range /= 255;
            freqOffset += visWidth * 1.25;
            let x = freqOffset;
            let y = 0;//-visHeight * range;
            translate(x, y, 0);
            box(visWidth, visHeight * range, visWidth);
            //rect(visWidth, visHeight * range);
            translate(-x, -y, 0);
        });
        strokeWeight(.5);
    }

    if (drawCircles) {
        if (circles.length < maxCircles) {
            addCircle();
        } else {
            circles.shift();
            addCircle();
        }
    }
    if (drawRectangles) {
        if (frameCount % round(16 / speedFactor) === 0) {
            if (rects.length < maxRects) {
                addRect();
            } else {
                rects.shift();
                addRect();
            }
        }
    }

    i = 0;
    rects.forEach(rectEl => {
        i++;
        let opacity = i / rects.length;
        let hue = (opacity * hueArea) + hueShift;
        while (hue > 360) hue -= 360;
        opacity = max(0, opacity - random(0, 0.1));

        // draw
        translate(rectEl.x, rectEl.y, rectEl.z);
        fill(hue, saturation, brightness, opacity * (brightness / 50) * (saturation * 100));
        stroke(hue, saturation, brightness, (1 - opacity) * speedFactor);
        box(rectEl.s);
        translate(-rectEl.x, -rectEl.y, -rectEl.z);

        let bounds = random(.001, .005);
        let halfSize = rectEl.s / 2;
        rectEl.vx = min(max(rectEl.vx + random(-bounds, bounds), -halfSize), halfSize);
        rectEl.vy = min(max(rectEl.vy + random(-bounds, bounds), -halfSize), halfSize);
        rectEl.vz = min(max(rectEl.vz + random(-bounds, bounds), -halfSize), halfSize);
        rectEl.x += rectEl.vx * speedFactor;
        rectEl.y += rectEl.vy * speedFactor;
        rectEl.z += rectEl.vz * speedFactor;
    });

    i = 0;
    circles.forEach(circleEl => {
        i++;
        let opacity = i / circles.length;
        opacity *= opacity;
        let hue = (opacity * hueArea) + hueShift + (circleEl.Hoffset / 10);
        while (hue > 360) hue -= 360;

        // draw
        translate(circleEl.x, circleEl.y, circleEl.z);
        stroke(hue, saturation, brightness, opacity * speedFactor);
        //stroke(0, 0);
        fill(0, 0);
        //emissiveMaterial(hue, saturation, brightness, 1);
        circle(0, 0, circleEl.size);
        translate(-circleEl.x, -circleEl.y, -circleEl.z);
        let bounds = random(.001, .1);
        circleEl.vx = min(max(circleEl.vx + random(-bounds, bounds), -circleEl.size / 2), circleEl.size / 2);
        circleEl.vy = min(max(circleEl.vy + random(-bounds, bounds), -circleEl.size / 2), circleEl.size / 2);
        circleEl.vz = min(max(circleEl.vz + random(-bounds, bounds), -circleEl.size / 2), circleEl.size / 2);
        circleEl.x += circleEl.vx * speedFactor;
        circleEl.y += circleEl.vy * speedFactor;
        circleEl.z += circleEl.vz * speedFactor;
        circleEl.size += random(-bounds / 5, bounds / 5);
    });

    function addCircle() {
        let x, y, z;
        x = random(-width / 2, width / 2);
        y = random(-height / 2, height / 2);
        z = random(-width, width);
        let startV = .2;
        let vx = random(-startV, startV);
        let vy = random(-startV, startV);
        let vz = random(-startV, startV);
        let size = random(1, 40);
        let Hoffset = random(0, 360);
        circles.push({x, y, z, vx, vy, vz, size, Hoffset});
    }

    function addRect() {
        let x, y, z, s;
        let idCount = rects.filter(rect => rect.rowid === rowid).length;
        if (idCount > random(50, 100) || rects.length === 0) {
            rowid++;
            let maxSize = 20;
            x = random(-width / 2, width / 2);
            y = random(-height / 2, height / 2);
            z = random(-width, width);
            s = random(10, maxSize);
        } else {
            let index = rects.length - 1;
            let offset = (rects[index].s * 2);

            let direction = rectDirections[round(random(0, 5))];

            x = rects[index].x + (direction.dx * offset);
            y = rects[index].y + (direction.dy * offset);
            z = rects[index].z + (direction.dz * offset);
            let change = .3;
            s = rects[index].s + random(-rects[index].s * change, rects[index].s * change);
        }
        let startV = .0005;
        let vx = random(-startV, startV);
        let vy = random(-startV, startV);
        let vz = random(-startV, startV);
        rects.push({x, y, z, vx, vy, vz, s, rowid, lockV: false});
    }
}

window.preload = preload;
window.setup = setup;
window.draw = draw;