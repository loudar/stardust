function toggleTrackList() {
    let tracklist = document.querySelector(".trackListContent");
    if (tracklist.style.display === "none") {
        tracklist.style.display = "initial";
    } else {
        tracklist.style.display = "none";
    }
}