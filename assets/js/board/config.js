// Board constants. Weather key/city and durations copied from
// Standard_reception_hub - v4.html lines 369-387.
export const CONFIG = {
    weatherKey: "a5bbc068379441b89cf24203251803",
    weatherCity: "Perth",
    mapDuration: 30000,
    photoDuration: 6000,

    mediaFolder: "media/",
    scheduleRefreshMs: 30000,   // v4 used 3 s; the board re-renders every 30 s
    reloadAfterMs: 46800000     // existing 13-hour full reload
};
