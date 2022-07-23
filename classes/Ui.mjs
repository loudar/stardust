import { Jens } from 'https://jensjs.com/latest/jens.js';
import { Commons, Layouts, Controls } from "./Ui/Templates.js";

class Ui {
    constructor(config, configSpreader) {
        this.setConfig(config);
        this.configSpreader = configSpreader;
        this.setupMouse();
        const templates = this.getTemplates();
        this.jens = new Jens(templates);
    }

    getTemplates() {
        let templateProviders = [
            new Commons(),
            new Layouts(),
            new Controls()
        ]
        const templates = {};

        templateProviders.forEach(provider => {
            const providerName = provider.constructor.name;
            if (provider.templates === undefined) {
                console.error(`STARDUST: Template provider '${providerName}' has no templates, consider adding templates or removing the provider`);
                return;
            }
            if (Object.keys(provider.templates).length === 0) {
                console.warn(`STARDUST: No templates found in provider '${providerName}', consider adding templates or removing the provider`);
            }
            Object.keys(provider.templates).forEach(key => {
                if (templates[key]) {
                    throw new Error(`STARDUST: Can't add '${key}' from '${providerName}' '${key}' already exists from provider '${templates[key].templateSource}'. Template names must be unique.`);
                }
                templates[key] = provider.templates[key];
                templates[key].templateSource = providerName;
            });
        });

        return templates;
    }

    updateConfig() {
        this.configSpreader.spread(this.config);
    }

    setConfig(config) {
        this.config = config;
        this.initializeKeybinds();
        this.changeColors();
    }

    setSound(sound) {
        this.sound = sound;
    }

    setSounds(sounds) {
        this.sounds = sounds;
    }

    initializeKeybinds() {
        this.removeKeybinds();
        window.addEventListener('keydown', this.checkKeybinds.bind(this));
    }

    removeKeybinds() {
        window.removeEventListener('keydown', this.checkKeybinds.bind(this));
    }

    checkKeybinds(e) {
        const keymap = this.config.keymap.ui;
        e.preventDefault();
        switch (e.key) {
            case keymap.toggleTracklist:
                this.toggleTrackList();
                break;
        }
    }

    mouse = {
        down: 0
    }

    setupMouse() {
        document.body.addEventListener('mousedown', () => {
            ++this.mouse.down;
        });
        document.body.addEventListener('mouseup', () => {
            --this.mouse.down;
        });
    }

    changeColors() {
        let rootNode = document.querySelector(":root");
        Object.keys(this.config.colour.definitions[this.config.colour.mode]).forEach(variable => {
            rootNode.style.setProperty('--'+variable, this.config.colour.definitions[this.config.colour.mode][variable]);
        });
    }

    playController;

    setPlayController(playController) {
        this.playController = playController;
    }

    toggleTrackList() {
        let tracklist = document.querySelector(".tracklist");
        let toggles = document.querySelector(".toggles");
        if (tracklist.style.display === "none") {
            tracklist.style.display = "flex";
            toggles.setAttribute("tracklist-active", "true");
        } else {
            tracklist.style.display = "none";
            toggles.setAttribute("tracklist-active", "false");
        }
    }

    updateTracklist(soundIndex) {
        let tracklistTracks = document.querySelectorAll(".trackListTrack");
        tracklistTracks.forEach(trackListTrack => {
            if (parseInt(trackListTrack.id) === soundIndex) {
                trackListTrack.classList.add("active");
            } else {
                trackListTrack.classList.remove("active");
            }
        });
    }

    showProgress(value) {
        let progress = document.querySelector("progress");
        try {
            progress.value = value;
        } catch (e) {
            // float issues
        }
    }

    updateTitle(trackName) {
        document.querySelector("h1").innerHTML = trackName;
    }

    createTracklist() {
        let tracklist = document.querySelector(".trackListContent");
        for (let i = 0; i < this.sounds.length; i++) {
            let soundName = this.sounds[i];
            let data = {
                soundId: i.toString()
            };
            let soundEl = document.createElement("div");
            soundEl.classList.add("trackListTrack");
            soundEl.id = data.soundId;
            soundEl.appendChild(this.jens.createFromTemplateName("playingIndicator", data));
            soundEl.appendChild(this.jens.createFromTemplateName("playingLoader", data));
            soundEl.appendChild(this.getTrackNameAsHtml(soundName));
            soundEl.onclick = () => {
                this.playController.playTrack(soundEl);
            };
            tracklist.appendChild(soundEl);
        }
    }

    getTrackNameAsHtml(soundName) {
        let span = document.createElement("span");
        let split = soundName.split("\\");
        let name = split[split.length - 1];
        for (let i = 0; i < split.length - 1; i++) {
            span.appendChild(this.makePathSpan(split[i], i > 0 ? split[i - 1] : ""));
        }
        span.innerHTML += name;
        return span;
    }

    pathColors = [];

    makePathSpan(name, previousName) {
        let span = document.createElement("span");
        span.classList.add("path");
        if (this.pathColors[name]) {
            span.style.color = this.pathColors[name];
        } else {
            let hue = Math.floor(Math.random() * 360);
            if (previousName !== "") {
                let previousHue = this.pathColors[previousName];
                if (previousHue !== undefined) {
                    let diff = Math.abs(hue - previousHue);
                    if (diff < 30) {
                        hue += diff * 2;
                    }
                }
            }
            const perceivedBrightness = {
                r: .299,
                g: .587,
                b: .114
            };
            let rgb = this.hueToRGB(hue);
            let brightness = ((perceivedBrightness.r * rgb.r) + (perceivedBrightness.g * rgb.g) + (perceivedBrightness.b * rgb.b)) / 255;
            let color = `hsl(${hue}, 100%, ${Math.max(50, Math.floor(brightness * 100))}%)`;
            span.style.color = color;
            this.pathColors[name] = color;
        }
        span.innerHTML = name + "\\";
        return span;
    }

    hueToRGB(hue) {
        let r, g, b;
        if (hue < 0) {
            hue = 0;
        } else if (hue > 360) {
            hue = 360;
        }
        if (hue < 60) {
            r = 255;
            g = Math.round(hue * 255 / 60);
            b = 0;
        } else if (hue < 120) {
            r = Math.round((120 - hue) * 255 / 60);
            g = 255;
            b = 0;
        } else if (hue < 180) {
            r = 0;
            g = 255;
            b = Math.round((hue - 120) * 255 / 60);
        } else if (hue < 240) {
            r = 0;
            g = Math.round((240 - hue) * 255 / 60);
            b = 255;
        } else if (hue < 300) {
            r = Math.round((hue - 240) * 255 / 60);
            g = 0;
            b = 255;
        } else if (hue < 360) {
            r = 255;
            g = 0;
            b = Math.round((360 - hue) * 255 / 60);
        } else {
            r = 0;
            g = 0;
            b = 0;
        }
        return {r, g, b};
    }

    updateCurrentTime() {
        if (this.mouse.down) return;
        let currentTimeEl = document.querySelector("#currentTime");
        let currentTime = this.sound.currentTime();
        currentTimeEl.innerHTML = new Date(1000 * currentTime).toISOString().substring(11, 11+8);
        let scrubTimeEl = document.querySelector("#currentTimeScrub");
        scrubTimeEl.value = 100 * currentTime / this.sound.duration();
        this.updateDuration();
    }

    updatePlayingLoaders(index) {
        let loader = document.querySelector('.playingLoader[id=\''+index+'\']');
        if (loader) {
            loader.classList.add('active');
        }
    }

    updatePlayingIndicators(index) {
        for (let indicator of document.querySelectorAll('.playingIndicator')) {
            indicator.classList.remove('active');
        }
        for (let indicator of document.querySelectorAll('.playingLoader')) {
            indicator.classList.remove('active');
        }
        let indicator = document.querySelector('.playingIndicator[id=\''+index+'\']');
        if (indicator) {
            indicator.classList.add('active');
        }
    }

    updateControls() {
        let playIcon = document.querySelector("#icon_play");
        if (this.playController.isPlaying()) {
            playIcon.src = "img/pause.svg";
        } else {
            playIcon.src = "img/play.svg";
        }
        let muteIcon = document.querySelector("#icon_mute");
        if (this.playController.isMuted()) {
            muteIcon.src = "img/mute.svg";
        } else {
            muteIcon.src = "img/unmute.svg";
        }
    }

    updateDuration() {
        let duration = this.sound.duration();
        let durationEl = document.querySelector("#duration");
        durationEl.innerHTML = new Date(1000 * duration).toISOString().substring(11, 11+8);
    }

    setup() {
        let body = document.querySelector("body");
        body.appendChild(this.jens.createFromTemplateName("overlay"));
        this.setupToggles();
        this.setupControls();
        this.createTracklist();

        this.setupVolumeSlider();
        this.setupScrubTime();

        this.updateTitle(this.sound);
        this.updateTracklist();
        this.updateDuration();
    }

    toggleDarkMode(e) {
        let toggle = e.target;
        if (toggle.tagName.toLowerCase() === "div") toggle = toggle.firstElementChild;
        this.config.colour.mode = 1 - this.config.colour.mode;
        this.updateConfig();
        let buttonText;
        switch (this.config.colour.mode) {
            case 0:
                buttonText = "Lights on";
                break;
            case 1:
                buttonText = "Lights off";
                break;
        }
        toggle.innerHTML = buttonText;
        this.changeColors();
    }

    setupVolumeSlider() {
        let volumeSlider = document.querySelector("#volumeSlider");
        volumeSlider.onchange = () => {
            this.config.audio.userVolume = volumeSlider.value / 100;
            this.updateConfig();
        }
    }

    setupControls() {
        let parent = document.querySelector(".trackControls");
        const controlMap = [
            { control_id: "control_play", control_text: "PLAY", icon_src: "img/play.svg", icon_id: "icon_play", clickFunc: async () => { await this.playController.togglePlay(); }},
            { control_id: "control_mute", control_text: "MUTE", icon_src: "img/mute.svg", icon_id: "icon_mute", clickFunc: async () => { await this.playController.toggleMute(); }},
        ];
        controlMap.forEach(control => {
                let child = this.jens.createFromTemplateName("control", control);
                parent.appendChild(child);
            }
        );
    }

    toggleMic(e) {
        let toggle = e.target;
        if (toggle.tagName.toLowerCase() === "div") toggle = toggle.firstElementChild;
        this.config.audio.useMic = !this.config.audio.useMic;
        let buttonText;
        if (this.config.audio.useMic) {
            buttonText = "Disable mic";
        } else {
            buttonText = "Enable mic";
        }
        toggle.innerHTML = buttonText;
        this.updateConfig();
    }

    toggleModel(e) {
        let toggle = e.target;
        if (toggle.tagName.toLowerCase() === "div") toggle = toggle.firstElementChild;
        this.config.visualizer.model.show = !this.config.visualizer.model.show;
        let buttonText;
        if (this.config.visualizer.model.show) {
            buttonText = "Disable model";
        } else {
            buttonText = "Enable model";
        }
        toggle.innerHTML = buttonText;
        this.updateConfig();
    }

    setupToggles() {
        let parent = document.querySelector(".toggles");
        const toggleMap = [
            {
                toggleName: "trackList",
                toggleText: "Tracks",
                toggleClickFunc: this.toggleTrackList.bind(this)
            },
            {
                toggleName: "darkMode",
                toggleText: "Lights on",
                toggleClickFunc: this.toggleDarkMode.bind(this)
            },
            {
                toggleName: "micToggle",
                toggleText: "Enable mic",
                toggleClickFunc: this.toggleMic.bind(this)
            },
            {
                toggleName: "modelToggle",
                toggleText: "Enable model",
                toggleClickFunc: this.toggleModel.bind(this)
            }
        ];
        toggleMap.forEach(toggle => {
                let child = this.jens.createFromTemplateName("toggle", toggle);
                parent.appendChild(child);
            }
        );
    }

    setupScrubTime() {
        let scrub = document.querySelector("#currentTimeScrub");
        scrub.onchange = () => {
            this.playController.scrubTime(scrub);
        };
    }
}

export { Ui };