# ADCI Reception Board: handover (state as of 23 Nov 2026)

For whoever maintains the board next, person or AI. The staff guide is [README.md](../README.md).
This page covers how it is built, how to work on it, and what is still open.

## What it is

A display board for the reception screen. It switches its own mode by date (teaching,
orientation, summer, assessment, tuition-free, study, exam, semester break, Christmas). Staff
change it by uploading Excel files and media on github.com; nobody edits anything on the
reception PC.

- **Live:** https://adci-perth.github.io/adci-reception-board/ (data check page: `check.html`;
  preview another day: `?date=YYYY-MM-DD`).
- **Repo:** ADCI-Perth/adci-reception-board. It is public on purpose: all API keys are free-tier.
- **Deploy:** GitHub Actions (`.github/workflows/pages.yml`) on every push to `main`. The
  workflow builds `media/manifest.json`, writes `version.txt` (the commit SHA) and copies
  `index.html`, `check.html`, `version.txt`, `README.md`, `assets`, `data`, `templates` and
  `media` into `_site`. Tools, tests and docs are not published.
- **Reception PC updates itself:** it checks `version.txt` every 5 minutes and reloads when it
  changes. It also reloads every 13 hours and at midnight. Expect changes on screen within about
  15 minutes of a successful deploy.

## How it works

- Vanilla ES modules with no build step, and all paths are relative. SheetJS `xlsx@0.18.5`
  comes from cdnjs in the browser and from npm in tests. Workbooks are read with `raw:true`
  (never `cellDates`, which shifts dates in the Perth timezone).
- **Data** (`data/`):
  - `Calendar.xlsx` sets the modes and key dates. `resolveDay` picks the mode in this priority:
    christmas > exam > study > assessment > tuition > summer > orientation > teaching > break.
  - `Timetable.xlsx` holds the classes and rooms.
  - `Board.xlsx` has the sheets Notices, Courses, Rooms and Media (captions).
  - If a file fails to load, the board uses the last good copy cached in localStorage.
- **Notices** come from two sources:
  - The Notices sheet of `Board.xlsx`.
  - GitHub Issues made with the **Notice** issue form (`.github/ISSUE_TEMPLATE/notice.yml`,
    label `notice`). The board reads these without logging in (60 requests per hour per IP) and
    refreshes them every 5 minutes.
  - Only issues by logins listed in `data/notice-posters.txt` are shown, because org membership
    is private and the anonymous API reports everyone as author_association NONE.
- **Media:** whatever is in `media/photos`, `media/videos` and `media/christmas` (the last is
  used only in Christmas mode). The playlist runs: world map, then course spotlights, then the
  photos alphabetically with one video after every 3 photos. Credits for the stock media are in
  `media/CREDITS.md`.
- **Carousel** (`assets/js/board/widgets/carousel.js`):
  - It preloads the next photo or video and only switches once that slide is ready.
  - A photo is skipped if it hasn't loaded within 25 s, a video if it hasn't started within 30 s,
    and a playing video that freezes for 20 s.
  - Two `<video>` elements take turns, so back-to-back videos preload.
  - Photos are shown whole (`object-fit: contain`) on a blurred fill. The ring progress shows
    the time left on each slide.
- **Layout** (1920×1080):
  - Left column: weather, key dates, and the Student System QR (hidden in semester break and
    Christmas).
  - Centre: the carousel stage and the "Rooms right now" strip.
  - Right column: the hub (today's classes or a mode card), the countdown and the notice board.
  - Footer: the ticker.
- **Live classes** show a heartbeat dot on the LIVE NOW tag and the room "In use" dot only (not
  the card or the header badge), plus a progress bar and "% · hour/total HRS".

## Media sizes

GitHub Pages serves large files slowly on first request, and github.com uploads are capped at
25 MB per file. Everything in `media/` has been compressed: photos at most 1920 px, and videos
1080p H.264 at about 4 Mbit/s with no audio and faststart. That's 41 MB of video in total.

Staff use `tools/Compress-for-board.bat`, documented in the README: drag files onto it and it
writes to a "Compressed for board" folder. It needs ffmpeg (`winget install Gyan.FFmpeg`) and
offers to install it. The file is stored with CRLF line endings (`.gitattributes`:
`*.bat -text`); keep it that way.

## Working on it

- Run the tests with `npm test`: 102 pass, using Node's built-in test runner on `tests/**/*.test.js`.
- To preview locally, run `node tools/build-media-manifest.mjs .` (the manifest is gitignored),
  then serve the folder, for example with `python -m http.server 8000`.
- Templates are rebuilt with `python tools/build_templates.py` (openpyxl).
- To check a deploy: `gh run watch`, then compare `version.txt` on the live site with
  `git rev-parse HEAD`. A deploy-pages step once failed with "No artifacts named github-pages";
  re-running the job (`gh run rerun <id>`) fixed it.
- Screenshots: if the browser pane is hidden, or you use `--virtual-time-budget`, CSS
  animations freeze. Use headless Chrome in real time over CDP instead, with
  `--remote-debugging-port`, a wait in milliseconds, then `Page.captureScreenshot`.
- The owner often edits the xlsx files locally between requests. Check `git status` and diff
  their edits before committing.
- **Working agreements with the owner:**
  - Give a plan before larger changes.
  - Show screenshots before publishing design changes.
  - Get a "publish" OK before pushing.
  - Only copyright-free or free-stock-licence media.

## Open items (waiting on the owner)

- Timetables for Feb 2027 and Jul 2027.
- A course list for the course spotlight slides (the Courses sheet of `Board.xlsx`).
- Colleagues' GitHub usernames for `data/notice-posters.txt`.
- Optional: larger versions of the low-resolution photos `ds2.jpg` (612 px) and
  `orientation4.jpg` (572 px).

## Recent history

| Commit | Change |
|---|---|
| 1bdb335 / 683764a | Compressed the remaining videos; added the drag-and-drop compress tool and README steps |
| 383662e | Data-1, Data-2 and Hacking-3 compressed to 1080p (61 MB to 14 MB) |
| 43475a6 | Carousel preloads and waits for slides; campus photos resized (16 MB to 5 MB) |
| 58c10e7 / a1af974 | LIVE NOW heartbeat (tag and room dot only); class progress bar restored |
| a855019 / 5e60970 | Notices posted via GitHub Issues |
| bd4dbed | QR card moved left, notice board moved right; "Student System" heading |
| f73454f | Whole photos shown on a blurred fill |
| 96c5877 / 34ed6e7 | Ring progress indicator, stock media, uppercase hub title, summer week 4 as exam week |
