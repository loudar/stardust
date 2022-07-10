class Ui {
    constructor(config, configSpreader) {
        this.setConfig(config);
        this.configSpreader = configSpreader;
        this.setupMouse();
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
        this.createTracklist();
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
        let tracklist = document.querySelector(".trackListContent");
        if (tracklist.style.display === "none") {
            tracklist.style.display = "initial";
        } else {
            tracklist.style.display = "none";
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
        let i = 0;
        for (const soundName of this.sounds){
            let soundEl = document.createElement("div");
            soundEl.classList.add("trackListTrack");
            soundEl.id = i;
            soundEl.innerHTML = soundName;
            soundEl.onclick = () => {
                this.playController.playTrack(soundEl);
            };
            tracklist.appendChild(soundEl);
            i++;
        }
        let tracklistToggle = document.querySelector(".trackListToggle");
        tracklistToggle.onclick = () => {
            this.toggleTrackList();
        }
    }

    updateCurrentTime() {
        if (this.mouse.down) return;
        let currentTimeEl = document.querySelector("#currentTime");
        let currentTime = this.sound.currentTime();
        currentTimeEl.innerHTML = new Date(1000 * currentTime).toISOString().substr(11, 8);
        let scrubTimeEl = document.querySelector("#currentTimeScrub");
        scrubTimeEl.value = 100 * currentTime / this.sound.duration();
        this.updateDuration();
    }

    updateDuration() {
        let duration = this.sound.duration();
        let durationEl = document.querySelector("#duration");
        durationEl.innerHTML = new Date(1000 * duration).toISOString().substring(11, 8);
    }

    setup() {
        this.setupDarkModeToggle();
        this.setupVolumeSlider();
        this.setupMicToggle();
        this.setupModelToggle();
        this.setupScrubTime();

        this.updateTitle(this.sound);
        this.updateTracklist();
        this.updateDuration();
    }

    setupDarkModeToggle() {
        let darkModeToggle = document.querySelector(".darkModeToggle");
        darkModeToggle.onclick = () => {
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
            darkModeToggle.innerHTML = buttonText;
            this.changeColors();
        }
    }

    setupVolumeSlider() {
        let volumeSlider = document.querySelector("#volumeSlider");
        volumeSlider.onchange = () => {
            this.config.audio.userVolume = volumeSlider.value / 100;
            this.updateConfig();
        }
    }

    setupMicToggle() {
        let micToggle = document.querySelector(".micToggle");
        micToggle.onclick = () => {
            this.config.audio.useMic = !this.config.audio.useMic;
            let buttonText;
            if (this.config.audio.useMic) {
                buttonText = "Disable mic";
            } else {
                buttonText = "Enable mic";
            }
            micToggle.innerHTML = buttonText;
            this.updateConfig();
        }
    }

    setupModelToggle() {
        let modelToggle = document.querySelector(".modelToggle");
        modelToggle.onclick = () => {
            this.config.visualizer.model.show = !this.config.visualizer.model.show;
            let buttonText;
            if (this.config.visualizer.model.show) {
                buttonText = "Disable model";
            } else {
                buttonText = "Enable model";
            }
            modelToggle.innerHTML = buttonText;
            this.updateConfig();
        }
    }

    setupScrubTime() {
        let scrub = document.querySelector("#currentTimeScrub");
        scrub.onchange = () => {
            this.playController.scrubTime(scrub);
        };
    }
}

export { Ui };