/*
Class consisting of properties that act as Jens JS templates
 */
class Commons {
    templates = {
        control: {
            tag: "button", classes: ["control"], id: "ref:control_id", onclick: "ref:clickFunc", children: [
                { tag: "img", classes: ["icon"], id: "ref:icon_id", src: "ref:icon_src", alt: "ref:control_text", title: "ref:control_text" }
            ]
        },
        controlSlider: {
            tag: "div", classes: ["sliderContainer"], children: [
                { tag: "label", for: "ref:control_id", text: "ref:control_text", css: {display: "none"} },
                { tag: "input", type: "range", min: "0", max: "100", value: "ref:control_value", id: "ref:control_id", onchange: "ref:changeFunc" }
            ]
        },
        controlTitle: {
            tag: "div", classes: ["flex-v", "controlTitle"], children: [
                { tag: "span", classes: ["trackTitle"], text: "ref:control_text" },
                { tag: "div", classes: ["flex"], children: [
                        { tag: "div", classes: ["trackTime"], children: [
                                { tag: "span", id: "currentTime", text: "0:00" },
                                { tag: "span", text: "/" },
                                { tag: "span", id: "duration", text: "0:00" }
                            ]
                        },
                        { template: "controlSlider" }
                    ]
                }
            ]
        },
        playingIndicator: {
            tag: "div", classes: ["playingIndicator"], id: "ref:soundId", text: "PLAYING",
        },
        playingLoader: {
            tag: "div", classes: ["playingLoader"], id: "ref:soundId"
        }
    };
}

class Controls {
    templates = {
        trackControls: {
            tag: "div", classes: ["flex-v", "trackControls"], children: [
                { tag: "div", classes: ["flex", "trackControlsRow"] },
                { tag: "div", classes: ["flex", "trackControlsRow"] }
            ]
        },
        toggle: {
            tag: "div", classes: ["toggle", "ref:toggleName"], onclick: "ref:toggleClickFunc", children: [
                { tag: "span", classes: ["toggleText"], text: "ref:toggleText" }
            ]
        },
        settingBool: {
            tag: "div", classes: ["settingBool"], onclick: "ref:changeFunc", children: [
                { tag: "div", classes: ["checkbox-container"], children: [
                        {tag: "input", type: "checkbox", id: "ref:setting_id"},
                        {tag: "span", classes: ["checkmark"], children: [
                                {tag: "span", classes: ["checkmark-icon"], text: "✓"},
                            ]
                        },
                        {tag: "label", text: "ref:setting_name", classes: ["checkbox-text"]}
                    ]
                }
            ]
        }
    }
}

class Layouts {
    templates = {
        overlay: {
            tag: "div", classes: ["overlay"], children: [
                { tag: "div", classes: ["toggles"], attributes: {"tracklist-active": "true", "settingslist-active": "false" } },
                { template: "trackSideBar" },
                { tag: "div", classes: ["flex-v", "settings"], css: {display: "none"}, children: [
                        { tag: "div", classes: ["flex-v", "themeSettings", "settingsSection"], children: [
                                { tag: "h2", classes: ["settingsTitle"], text: "Theme Settings" },
                            ]
                        }
                    ]
                }
            ]
        },
        trackSideBar: {
            tag: "div", classes: ["tracklist"], children: [
                { template: "trackControls" },
                { tag: "div", classes: ["trackListContent"] }
            ]
        },
    }
}

export { Commons, Layouts, Controls };