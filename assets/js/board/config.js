// Board constants. Weather key/city, durations, photos and videos copied from
// Standard_reception_hub - v4.html lines 369-387.
export const CONFIG = {
    weatherKey: "a5bbc068379441b89cf24203251803",
    weatherCity: "Perth",
    mapDuration: 30000,
    photoDuration: 6000,

    photos: [
        "Orientation-2026-1.png","Orientation-2026-2.png","Building.jpg", "Campus Logo.jpg", "Classroom 1.jpg", "Classroom 2.jpg",
        "Enterance.jpg", "Kitchen.jpg", "Meeting Room.jpg", "orientation.jpg","orientation2.jpg", "orientation3.jpg", "orientation4.jpg",
        "ds2.jpg",
    ],

    videos: [
        "Data-1.mp4",
        "Hacking-1.mp4",
        "Data-2.mp4",
        "Hacking-2.mp4",
        "Hacking-3.mp4"
    ],

    mediaFolder: "Present Pictures/",
    scheduleRefreshMs: 30000,   // v4 used 3 s; the board re-renders every 30 s
    reloadAfterMs: 46800000     // existing 13-hour full reload
};

export function mediaUrl(name) {
    return encodeURI(CONFIG.mediaFolder + name);
}
