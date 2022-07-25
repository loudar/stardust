import {Jens} from 'https://jensjs.com/latest/jens.js';
import {Commons, Controls, Layouts} from "./Ui/Templates.js";

class Ui {
    constructor(config, configSpreader, visualizer) {
        this.setConfig(config);
        this.configSpreader = configSpreader;
        this.setupMouse();
        const templates = this.getTemplates();
        this.jens = new Jens(templates);
        this.visualizer = visualizer;
        this.visualizer.setUi(this);

        this.themeSettings = [
            {
                id: "model",
                label: "Enable 3D models",
                default: this.visualizer.themes.default.elements.includes("model"),
            },
            {
                id: "peaks",
                label: "Show peaks",
                default: this.visualizer.themes.default.elements.includes("peaks"),
            },
            {
                id: "lines",
                label: "Show lines",
                default: this.visualizer.themes.default.elements.includes("lines"),
            },
            {
                id: "circles",
                label: "Show circles",
                default: this.visualizer.themes.default.elements.includes("circles"),
            },
            {
                id: "cubes",
                label: "Show cubes",
                default: this.visualizer.themes.default.elements.includes("cubes"),
            },
            {
                id: "spectrum",
                label: "Show spectrum",
                default: this.visualizer.themes.default.elements.includes("spectrum"),
            },
            {
                id: "boxy",
                label: "Show box spectrum",
                default: this.visualizer.themes.default.elements.includes("boxy"),
            },
        ];
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

    setP5(p5) {
        this.p5 = p5;
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
    };
    themeSettingPrefix = "setting_theme_";

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
            if (toggles.getAttribute("settingslist-active") === "true") this.toggleSettingsList();

            tracklist.style.display = "flex";
            toggles.setAttribute("tracklist-active", "true");
        } else {
            tracklist.style.display = "none";
            toggles.setAttribute("tracklist-active", "false");
        }
    }

    toggleSettingsList() {
        let settingslist = document.querySelector(".settings");
        let toggles = document.querySelector(".toggles");
        if (settingslist.style.display === "none") {
            if (toggles.getAttribute("tracklist-active") === "true") this.toggleTrackList();

            settingslist.style.display = "flex";
            toggles.setAttribute("settingslist-active", "true");
        } else {
            settingslist.style.display = "none";
            toggles.setAttribute("settingslist-active", "false");
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
        if (trackName.split) {
            let parts = trackName.split(".");
            document.querySelector(".trackTitle").innerHTML = parts.slice(0, parts.length - 1).join(".");
        } else {
            document.querySelector(".trackTitle").innerHTML = "No track playing";
        }
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
        let timeString = new Date(1000 * currentTime).toISOString().substring(11, 11+8);
        currentTimeEl.innerHTML = timeString.startsWith("00") ? timeString.substring(3) : timeString;
        let scrubTimeEl = document.querySelector("#control_time");
        scrubTimeEl.value = 100 * currentTime / this.sound.duration();
        this.updateDuration();
    }

    updateDuration() {
        let duration = this.sound.duration();
        let durationEl = document.querySelector("#duration");
        let timeString = new Date(1000 * duration).toISOString().substring(11, 11+8);
        durationEl.innerHTML = timeString.startsWith("00") ? timeString.substring(3) : timeString;
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

    updateSettings(theme) {
        for (const setting of this.themeSettings) {
            const domEl = document.querySelector(`#${this.themeSettingPrefix + setting.id}`);
            domEl.checked = false;
        }
        for (const el of theme.elements) {
            const setting = this.themeSettings.filter(s => s.id === el)[0];
            const domEl = document.querySelector(`#${this.themeSettingPrefix + setting.id}`);
            if (domEl) {
                domEl.checked = true;
            }
        }
    }

    setup() {
        let body = document.querySelector("body");
        body.appendChild(this.jens.createFromTemplateName("overlay"));
        this.setupToggles();
        this.setupControls();
        this.setupSettings();
        this.createTracklist();

        this.updateTitle(this.sound);
        this.updateTracklist();
        this.updateDuration();
    }

    toggleDarkMode() {
        this.config.colour.mode = 1 - this.config.colour.mode;
        const input = document.querySelector('#setting_darkmode');
        input.checked = this.config.colour.mode === 0;
        this.updateConfig();
        this.changeColors();
    }

    togglePeakHueShift() {
        this.config.audio.analyze.peakHueShift = !this.config.audio.analyze.peakHueShift;
        const input = document.querySelector("#setting_peakHueShift");
        input.checked = this.config.audio.analyze.peakHueShift;
        this.updateConfig();
        this.changeColors();
    }

    setupControls() {
        let parents = document.querySelectorAll(".trackControlsRow");
        const controlMap = [
            {
                template: "control",
                data: { control_id: "control_previous", control_text: "PREVIOUS", icon_src: "img/previous.svg", icon_id: "icon_previous", clickFunc: async () => { await this.playController.playPreviousSound(); }}
            },
            {
                template: "control",
                data: { control_id: "control_play", control_text: "PLAY", icon_src: "img/play.svg", icon_id: "icon_play", clickFunc: async () => { await this.playController.togglePlay(); }}
            },
            {
                template: "control",
                data: { control_id: "control_next", control_text: "NEXT", icon_src: "img/next.svg", icon_id: "icon_next", clickFunc: async () => { await this.playController.playNextSound(); }}
            },
            {
                template: "control",
                data: { control_id: "control_repeat", control_text: "REPEAT", icon_src: "img/norepeat.svg", icon_id: "icon_repeat", clickFunc: async () => { await this.playController.toggleRepeat(); }}
            },
            {
                template: "control",
                data: { control_id: "control_mute", control_text: "MUTE", icon_src: "img/mute.svg", icon_id: "icon_mute", clickFunc: async () => { await this.playController.toggleMute(); }}
            },
            {
                template: "controlSlider",
                data: { control_id: "control_volume", control_text: "VOLUME", control_value: "100", changeFunc: async (e) => {
                    let value = e.target.value;
                    this.config.audio.userVolume = value / 100;
                    this.updateConfig();
                    await this.playController.updateVolume();
                }}
            },
        ];
        const songControlMap = [
            {
                template: "controlTitle",
                data: { control_text: "No title playing", control_id: "control_time", control_value: "0", changeFunc: (e) => {
                        this.playController.scrubTime(e.target);
                    }
                }
            }
        ];
        controlMap.forEach(control => {
                let child = this.jens.createFromTemplateName(control.template, control.data);
                parents[0].appendChild(child);
            }
        );
        songControlMap.forEach(control => {
                let child = this.jens.createFromTemplateName(control.template, control.data);
                parents[1].appendChild(child);
            }
        );
    }

    setupSettings() {
        let parent = document.querySelector(".settings");
        const settingMap = [
            {
                template: "settingBool",
                data: { setting_id: "setting_darkmode", setting_name: "Dark mode", setting_default: "true", changeFunc: this.toggleDarkMode.bind(this) }
            },
            {
                template: "settingBool",
                data: { setting_id: "setting_enableMic", setting_name: "Use microphone instead of sounds", setting_default: "false", changeFunc: this.toggleMic.bind(this) }
            },
            {
                template: "settingBool",
                data: { setting_id: "setting_peakHueShift", setting_name: "Shift hue on peaks", setting_default: this.config.audio.analyze.peakHueShift.toString(), changeFunc: this.togglePeakHueShift.bind(this) }
            },
            {
                template: "settingBool",
                data: { setting_id: "setting_cameraShake", setting_name: "Camera shake", setting_default: "false", changeFunc: this.enableEffect.bind(this, "setting_cameraShake", "cameraShake") }
            }
        ];
        settingMap.forEach(control => {
                let child = this.jens.createFromTemplateName(control.template, control.data);
                if (control.data.setting_default === "true") {
                    child.querySelector('input#'+control.data.setting_id).checked = true;
                }
                parent.appendChild(child);
            }
        );
        parent = document.querySelector(".themeSettings");
        this.themeSettings.forEach(setting => {
                let settingData = {
                    setting_id: this.themeSettingPrefix + setting.id,
                    setting_name: setting.label,
                    setting_default: setting.default.toString(),
                    changeFunc: this.toggleThemeSettingWithId.bind(this, this.themeSettingPrefix + setting.id, setting.id)
                };
                let child = this.jens.createFromTemplateName("settingBool", settingData);
                if (setting.default) {
                    child.querySelector('input#' + settingData.setting_id).checked = true;
                }
                parent.appendChild(child);
            }
        );
    }

    toggleMic() {
        this.config.audio.useMic = !this.config.audio.useMic;
        const input = document.querySelector("#setting_enableMic");
        input.checked = this.config.audio.useMic;
        this.updateConfig();
    }

    toggleThemeSettingWithId(id, setting) {
        this.toggleThemeSetting(setting);
        const input = document.querySelector("#"+id);
        input.checked = this.visualizer.themes[this.config.visualizer.theme].elements.includes(setting);
        this.updateConfig();
    }

    toggleThemeSetting(setting) {
        if (this.visualizer.themes[this.config.visualizer.theme].elements.includes(setting)) {
            this.visualizer.themes[this.config.visualizer.theme].elements.splice(this.visualizer.themes[this.config.visualizer.theme].elements.indexOf(setting), 1);
        } else {
            this.visualizer.themes[this.config.visualizer.theme].elements.push(setting);
        }
    }

    enableEffect(id, effect) {
        this.config.visualizer.effects[effect].active = !this.config.visualizer.effects[effect].active;
        const input = document.querySelector("#"+id);
        input.checked = this.config.visualizer.effects[effect].active;
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
                toggleName: "settingsList",
                toggleText: "Settings",
                toggleClickFunc: this.toggleSettingsList.bind(this)
            }
        ];
        toggleMap.forEach(toggle => {
                let child = this.jens.createFromTemplateName("toggle", toggle);
                parent.appendChild(child);
            }
        );
    }
}

export { Ui };