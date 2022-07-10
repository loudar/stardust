/// <reference path="node_modules/@types/p5/global.d.ts" />
import { DefaultConfiguration } from "./classes/models/DefaultConfiguration.mjs";
import { AudioAnalyzer } from "./classes/AudioAnalyzer.mjs";
import { Visualizer } from "./classes/Visualizer.mjs";
import { Ui } from "./classes/Ui.mjs";
import { PlayController } from "./classes/PlayController.mjs";
import { ConfigSpreader } from "./classes/ConfigSpreader.js";

let config = (new DefaultConfiguration()).get();
const configSpreader = new ConfigSpreader(config);

const audioAnalyzer = new AudioAnalyzer(config);
const ui = new Ui(config, configSpreader);
const visualizer = new Visualizer(config);
const playController = new PlayController(config, ui, audioAnalyzer, visualizer);

ui.setPlayController(playController); // this is a bit of a workaround, but it works (?)

configSpreader.addInstances([
    audioAnalyzer, visualizer, playController, ui
]);

let sound, mic;
let audioFrame = {
    time: {
        millis: 0,
    },
    colour: {},
    perspective: {},
    speed: {},
    volume: {}
};
let sounds, models;

window.onresize = function() {
    windowResized();
}

let setupRan = false;

/**
 * Proxy function for {@link PlayController.playTrack}.
 * @param element
 */
function playTrack(element) {
    playController.playTrack(element);
}

function setup(p) {
    console.log("Startup", p);
    playController.setP5(p);
    visualizer.setP5(p);
    audioAnalyzer.setP5(p);

    config.ui.width = window.innerWidth;
    config.ui.height = window.innerHeight;
    p.createCanvas(config.ui.width, config.ui.height - 4, 'webgl');

    if (setupRan) {
        return;
    }
    setupRan = true;

    sounds = Object.values(sounds);
    playController.setSounds(sounds);
    ui.setSounds(sounds);

    p.soundFormats('mp3', 'ogg');

    // suspend audio context at first to avoid startup problems
    p.getAudioContext().suspend();

    mic = new p5.AudioIn();
    mic.start();
    audioAnalyzer.setMic(mic);

    let progress = document.querySelector("progress");
    progress.style.opacity = "1";
    sound = p.loadSound("sounds/"+sounds[0], function() {}, console.log.bind(console, "Error"), ui.showProgress);
    progress.style.opacity = "0";

    ui.setSound(sound);
    audioAnalyzer.setSound(sound);
    playController.setSound(sound);

    models = Object.values(models);
    visualizer.setModels(models);

    config.ui.cameraDistance = config.ui.height / 2;
    configSpreader.spread(config);

    visualizer.initBase();

    audioFrame.time.millis = p.millis();

    ui.setup();
}

function windowResized() {
    config.ui.width = window.innerWidth;
    config.ui.height = window.innerHeight;
    visualizer.p5.resizeCanvas(config.ui.width, config.ui.height - 4);
    config.cameraDist = (config.ui.height / 2);
    configSpreader.spread(config);
}

function draw() {
    playController.playCheck();
    audioFrame = audioAnalyzer.analyze(audioFrame);
    visualizer.draw(audioFrame);
}

const s = (p) => {
    p.preload = () => {
        sounds = p.loadJSON("/sounds");
        models = p.loadJSON("/models");
    }

    p.setup = () => {
        setup(p);
    }

    p.draw = draw
}

let p = new p5(s);
/*
window.preload = preload;
window.setup = setup;
window.draw = draw;*/