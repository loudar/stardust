class Timer {
    elapsed = false;

    constructor(duration) {
        this.duration = duration;
        this.reset();
    }

    isDone(){
        return this.elapsed;
    }

    reset(){
        this.elapsed = false;
        setTimeout(this.elapse.bind(this), this.duration);
    }

    elapse(){
        this.elapsed = true;
    }
}

class PlayController {
    constructor(config, ui, analyzer, visualizer) {
        this.setConfig(config);
        this.ui = ui;
        this.analyzer = analyzer;
        this.visualizer = visualizer;
        this.timer = new Timer(500);
    }

    setP5(processing) {
        this.p5 = processing;
    }

    setSounds(sounds) {
        this.sounds = sounds;
    }

    setSound(sound, index) {
        this.sound.object = sound;
        this.sound.index = index;
    }

    setConfig(config) {
        this.config = config;
        this.initializeKeybinds();
        this.updateVolume();
    }

    updateVolume() {
        if (this.sound.object != null) {
            this.sound.object.setVolume(Math.pow(this.config.audio.userVolume, 2));
        }
    }

    sounds = [];
    sound = {
        object: null,
        loading: true,
        index: 0,
    }

    playCheck() {
        if (!this.sound.loading
            && this.sound.object.currentTime() >= this.sound.object.duration() - 0.01
            && !this.sound.object.isPlaying()
            && this.p5.getAudioContext().state === 'running')
        {
            this.playNextSound();
        }
        if (this.sound.object.isPlaying() && this.timer.isDone())
        {
            this.ui.setSound(this.sound.object);
            this.analyzer.setSound(this.sound.object);
            this.ui.updateCurrentTime();
            this.timer.reset();
        }
    }

    initializeKeybinds() {
        this.checkBindsEvent = this.checkBindsEvent ?? this.checkKeybinds.bind(this);

        this.removeKeybinds();
        window.addEventListener('keydown', this.checkBindsEvent);
    }

    removeKeybinds() {
        this.checkBindsEvent = this.checkBindsEvent ?? this.checkKeybinds.bind(this);

        window.removeEventListener('keydown', this.checkBindsEvent);
    }

    async checkKeybinds(e) {
        const keymap = this.config.keymap.player;
        e.preventDefault();
        if (!this.sound.loading) {
            switch (e.key) {
                case keymap.togglePlay:
                    await this.togglePlay();
                    break;
                case keymap.next:
                    this.playNextSound();
                    break;
                case keymap.previous:
                    this.playPreviousSound()
                    break;
            }
        }
    }

    async togglePlay() {
        if (this.config.audio.useMic) {
            this.sound.stop();
        }
        if (this.p5.getAudioContext().state === 'running') {
            await this.p5.getAudioContext().suspend();
        } else {
            await this.startPlay();
        }
    }

    async startPlay() {
        if (!this.sound.object.isPlaying() && !this.config.audio.useMic) {
            this.sound.object.play();
        }
        if (this.p5.getAudioContext().state !== 'running') {
            await this.p5.getAudioContext().resume();
            return;
        }
        // if (!audioPlayed) {
        //     sound.play();
        //     while (!sound.isPlaying()) {}
        // }
        // audioPlayed = true;
    }

    playNewSound() {
        this.sound.loading = true;
        this.sound.object.stop();
        this.sound.object.setPath("sounds/"+this.sounds[this.sound.index], () => {
            if (this.p5.getAudioContext().state !== 'running') {
                this.p5.getAudioContext().resume();
            }
            document.title = this.sounds[this.sound.index];
            if (!this.config.audio.autoplay) this.config.audio.autoplay = true;
            if (!this.config.audio.useMic) {
                this.sound.object.play(0);
            }
            while (!this.sound.object.isPlaying()) {}
            this.analyzer.setSound(this.sound.object);
            this.ui.updateTitle(this.sounds[this.sound.index]);
            this.ui.updateTracklist(this.sound.index);
            this.ui.updateDuration();
            this.visualizer.updateModel(this.sounds[this.sound.index]);
            this.sound.loading = false;
        });
    }

    /**
     * Uses the {@link el.id} (Usually set with {@link TODO}) to find the correct sound and attempts to play it.
     * @param el
     */
    playTrack(el) {
        let listIndex = parseInt(el.id);
        this.sound.index = Math.max(0, Math.min(this.sounds.length, listIndex));
        if (this.sounds[this.sound.index]) {
            this.playNewSound();
        }
    }

    playNextSound() {
        this.sound.index++;
        if (this.sound.index > this.sounds.length - 1) this.sound.index = 0;
        this.playNewSound();
    }

    playPreviousSound() {
        this.sound.index = this.sound.index - 1;
        if (this.sound.index < 0) this.sound.index = this.sounds.length;
        this.playNewSound();
    }

    scrubTime(el) {
        let duration = this.sound.object.duration();
        let newTime = (el.value / el.max) * duration;
        this.jumpToTime(newTime);
    }

    jumpToTime(newTime, duration) {
        this.p5.getAudioContext().resume();
        if (!this.sound.object.isPlaying() && !this.config.audio.useMic) {
            this.sound.object.play(newTime);
            while (!this.sound.object.isPlaying()) {}
            this.ui.updateCurrentTime();
            return;
        }
        try {
            this.sound.object.jump(newTime, duration);
        } catch(e) {
            console.log(e);
        }
        this.ui.updateCurrentTime();
    }
}

export { PlayController };