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
const visualizer = new Visualizer(config);
const ui = new Ui(config, configSpreader, visualizer);
const playController = new PlayController(config, ui, audioAnalyzer, visualizer);

// pass play controller to ui because we can't initialize both while knowing about the other
ui.setPlayController(playController);

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

async function setup(p) {
    console.info("%cSTARDUST: Starting initialization...", "color: #f7f700");

    playController.setP5(p);
    visualizer.setP5(p);
    audioAnalyzer.setP5(p);
    ui.setP5(p);

    config.ui.width = window.innerWidth;
    config.ui.height = window.innerHeight;
    let mainCanvas = p.createCanvas(config.ui.width, config.ui.height - 4, 'webgl');

    let secondCanvas = p.createGraphics(config.ui.width, config.ui.height - 4, p.WEBGL);

    if (setupRan) {
        return;
    }

    console.info("STARDUST: Loading sounds...");
    sounds = await fetch('/sounds');
    sounds = await sounds.json();
    console.info("STARDUST: Loading models...");
    models = await fetch('/models');
    models = await models.json();

    console.info("STARDUST: Loading shaders...");
    visualizer.addCanvas(mainCanvas, secondCanvas);

    sounds = Object.values(sounds);
    playController.setSounds(sounds);
    ui.setSounds(sounds);

    p.soundFormats('mp3', 'ogg');

    // suspend audio context at first to avoid startup problems
    console.info("STARDUST: Suspending audio context...");
    await p.getAudioContext().suspend();

    console.info("STARDUST: Initializing microphone connection...");
    mic = new p5.AudioIn();
    mic.start();
    audioAnalyzer.setMic(mic);

    console.info("STARDUST: Loading sound...");
    let progress = document.querySelector("progress");
    progress.style.opacity = "1";
    sound = p.loadSound("sounds/" + sounds[0], function () {
    }, console.log.bind(console, "Error"), ui.showProgress);
    progress.style.opacity = "0";

    console.info("STARDUST: Setting up classes...");
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

    setupRan = true;

    p.disableFriendlyErrors = true;
    p.smooth();
    console.info("%cSTARDUST: Initialization complete!", "color: #00ff00");
}

function windowResized() {
    config.ui.width = window.innerWidth;
    config.ui.height = window.innerHeight;
    visualizer.p5.resizeCanvas(config.ui.width, config.ui.height - 4);
    config.cameraDist = (config.ui.height / 2);
    configSpreader.spread(config);
}

function draw() {
    if (!setupRan) {
        return;
    }
    playController.playCheck();
    audioFrame = audioAnalyzer.analyze(audioFrame);
    visualizer.draw(audioFrame);
}

const s = (p) => {
    p.preload = () => {}

    p.setup = async () => {
        await setup(p);
    }

    p.draw = draw
}

let p = new p5(s);
/*
window.preload = preload;
window.setup = setup;
window.draw = draw;*/