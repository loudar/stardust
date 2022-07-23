class DefaultConfiguration {
    default = {
        keymap: {
            player: {
                togglePlay: " ",
                next: "ArrowRight",
                previous: "ArrowLeft",
            },
            ui: {
                toggleTracklist: "t"
            }
        },
        colour: {
            definitions: [
                {
                    "background": "#111",
                    "background-hover": "#222",
                    "foreground": "white",
                    "active": "#0f6",
                },
                {
                    "background": "#eee",
                    "background-hover": "#ddd",
                    "foreground": "black",
                    "active": "#0a1",
                },
            ],
            mode: 0
        },
        audio: {
            volume: 1,
            userVolume: 1,
            useMic: false,
            analyze: {
                smoothing: .7,
                thresholds: [.3, .3],
                peakThreshold: .99
            },
            autoplay: false,
        },
        visualizer: {
            model: {
                current: "",
                default: "models/stardust.obj"
            },
            circles: {
                max: 100,
            },
            rectangles: {
                max: 500,
            },
            lines: {
                max: 50,
            },
            spectrum: {
                adjustToBase: true
            },
            theme: "default"
        },
        ui: {
            progress: {
                show: true
            },
            width: 100,
            height: 100,
            cameraDistance: 50
        }
    }

    get() {
        return this.default;
    }
}

export { DefaultConfiguration };