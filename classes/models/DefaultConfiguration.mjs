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
                    "active-dark": "#002000",
                    "icon-filter": "brightness(1)"
                },
                {
                    "background": "#eee",
                    "background-hover": "#ddd",
                    "foreground": "black",
                    "active": "#0a1",
                    "active-dark": "#efe",
                    "icon-filter": "brightness(0)"
                },
            ],
            mode: 0
        },
        audio: {
            volume: 1,
            userVolume: 1,
            useMic: false,
            analyze: {
                smoothing: .8,
                thresholds: [.3, .3],
                peakThresholdHigh: .99,
                peakThresholdLow: .9,
                peakHueShift: false,
                volumeFunction: (v) => {
                    let e = .5 + 4 * Math.pow(v - .5, 3);
                    return e - (e - v) * .6;
                }
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
            theme: "default",
            effects: {
                chromaticAberration: {
                    active: true,
                    intensity: 5,
                    phase: 0,
                },
                cameraShake: {
                    active: false
                }
            }
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