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
            tag: "div", classes: ["flex", "trackControls"]
        },
        toggle: {
            tag: "div", classes: ["toggle", "ref:toggleName"], onclick: "ref:toggleClickFunc", children: [
                { tag: "span", classes: ["toggleText"], text: "ref:toggleText" }
            ]
        }
    }
}

class Layouts {
    templates = {
        overlay: {
            tag: "div", classes: ["overlay"], children: [
                { tag: "div", classes: ["toggles"], attributes: {"tracklist-active": "true"} },
                { template: "trackSideBar" },
            ]
        },
        trackSideBar: {
            tag: "div", classes: ["tracklist"], children: [
                { template: "trackControls" },
                { tag: "div", classes: ["trackListContent"]
                }
            ]
        }
    }
}

export { Commons, Layouts, Controls };