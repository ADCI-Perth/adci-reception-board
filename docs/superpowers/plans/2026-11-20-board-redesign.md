# Reception Board Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the board's look and side panels from the approved mockup, make media folder-driven, and add a staff-editable Board.xlsx (notices, courses, rooms, captions).

**Architecture:** Keep the existing data/mode engine (`assets/js/core/*`, `data.js`, reload/version-watch). Add pure, tested core modules (board data, key dates, rooms, playlist, mode rules), a deploy-time media manifest, and a new page shell whose panels are rendered by small board modules wired from `main.js`.

**Tech Stack:** Vanilla ES modules, SheetJS xlsx@0.18.5 (cdnjs in browser, npm in tests), `node --test`, Python + openpyxl for workbooks, GitHub Actions Pages deploy.

**Spec:** `docs/superpowers/specs/2026-11-20-board-redesign-design.md` (visual reference: `mockups/board-redesign.html`, `mockups/screens/*.png` — mockups are untracked; copy CSS from them freely).

## Global Constraints

- Colours exactly: `--navy #002b55`, `--navy-deep #0a1628`, `--teal #003f5c`, `--blue #0056b3`, `--cyan #00d2ff`, `--bg #ecf0f3`, ok `#2e7d32`, warn `#ed6c02`, alert `#d32f2f`; Christmas accent `#ff5a5f`, header `#3b0710 → #7a0e1c → #002b55`.
- Fonts: Oswald (titles), Inter (body), JetBrains Mono (labels, numbers) — existing Google Fonts link.
- Target 1920×1080; grid rows 104px / 1fr / 58px; columns 420px / 1fr / 470px; gap 24px; padding 24px 28px.
- QR shown in: teaching, orientation, summer, assessment, tuition, study, exam. Hidden in: break, christmas.
- Rooms strip shown in: teaching, orientation, summer, assessment only.
- Key dates: next 3, after today, within 120 days.
- Notices rotate every 10 s; default when none: title "Welcome to ADCI", message "Please see reception for any enquiries."
- Playlist: map → course spotlights → photos/videos interleaved (one video after every 3 photos), alphabetical; christmas folder photos added first in christmas mode only.
- Media files over 25 MB flagged on check.html ("cannot be replaced through the github.com upload page").
- Never invent facts on screen (no hours, Wi-Fi, courses, exam lists). Board.xlsx seeds: no notices, no courses, Rooms = `ADCI Classroom 1`, no captions.
- All paths relative (site is served from `/adci-reception-board/`). All spreadsheet text HTML-escaped (`escapeHtml` in `assets/js/board/util.js`).
- Tests: `npm test` (= `node --test "tests/**/*.test.js"`); all must pass at every commit.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Media file names with spaces, `&`, `#`, `(1)` — URLs must be built with `encodeURIComponent` per path segment (old `encodeURI` breaks `#`). Test in Task 3.
2. Missing or invalid `media/manifest.json` → playlist is map-only, no exception. Test in Task 3.
3. Board.xlsx missing (404) or with only bad rows → board runs with defaults, cache kept. Test in Task 2.
4. Notice with blank Start/End is always active; End before Start is a row error, not a crash. Test in Task 2.
5. Calendar with nothing ahead in 120 days → Key dates returns [] and the card shows "No upcoming dates". Test in Task 3 (function) and Task 6 (render).

---

### Task 1: Media folders and deploy-time manifest

**Files:**
- Move (git mv): the 14 photos in `CONFIG.photos` → `media/photos/`; the 5 videos in `CONFIG.videos` → `media/videos/`; `institute_logo.png`, `QRCode.JPG` → `assets/img/`; every other file in `Present Pictures/` → `archive/media/`. Remove the empty `Present Pictures/`. Create `media/christmas/.gitkeep`.
- Create: `tools/build-media-manifest.mjs`, `tests/media-manifest.test.js`
- Modify: `.github/workflows/pages.yml`, `index.html` (logo/QR/video src paths only), `assets/js/board/config.js` (drop `photos`, `videos`, `mediaFolder`; keep `mediaUrl` for now pointing at `media/`), `.gitignore` (add `media/manifest.json`)

**Interfaces:**
- Produces: `buildManifest(rootDir: string) -> { generated: string, photos: Item[], videos: Item[], christmas: Item[] }`, `Item = { file: string, path: string, size: number }` (path relative to site root, e.g. `media/photos/Classroom 1.jpg`, unencoded). Folders scanned: `media/photos`, `media/videos`, `media/christmas`. Photos/christmas accept `.jpg .jpeg .png .webp .gif` (case-insensitive); videos accept `.mp4 .webm`. Dotfiles skipped. Sorted by `file` with `localeCompare(…, 'en', {sensitivity:'base'})`. Missing folder → empty list.
- CLI: `node tools/build-media-manifest.mjs [root]` writes `<root>/media/manifest.json` (pretty JSON).
- Workflow: after checkout, `node tools/build-media-manifest.mjs .`; copy step replaces `"Present Pictures"` with `media` (manifest included) and keeps `assets data templates`.

- [ ] **Step 1: Write failing tests** in `tests/media-manifest.test.js` using a temp dir (`fs.mkdtempSync`): files `media/photos/B.jpg`, `media/photos/a b.PNG`, `media/photos/.DS_Store`, `media/photos/notes.txt`, `media/videos/v.mp4`; no christmas folder. Assert photos `file`s deep-equal `['a b.PNG','B.jpg']`, `photos[0].path === 'media/photos/a b.PNG'`, `size` equals byte length written, videos length 1, christmas `[]`, `typeof generated === 'string'`.
- [ ] **Step 2: Run** `npm test` → FAIL (module missing).
- [ ] **Step 3: Implement** `tools/build-media-manifest.mjs` (export `buildManifest`; run CLI only when `import.meta.url` is the entry script).
- [ ] **Step 4: Do the moves and path edits**; run `node tools/build-media-manifest.mjs .` and check `media/manifest.json` lists 14 photos, 5 videos.
- [ ] **Step 5: Run** `npm test` → all pass. Start the `board` preview (`.claude/launch.json`) and confirm the logo and QR still load (carousel may be broken until Task 5 — acceptable, note it).
- [ ] **Step 6: Commit** `feat(media): folder-based media with deploy-time manifest`.

### Task 2: Board.xlsx — notices, courses, rooms, captions

**Files:**
- Create: `assets/js/core/boarddata.js`, `tests/boarddata.test.js`
- Modify: `tools/build_templates.py`, `tools/seed_data.py` (seed rows), `assets/js/board/data.js`, `tests/seed.test.js`
- Generated: `data/Board.xlsx`, `templates/Board_TEMPLATE.xlsx`

**Interfaces:**
- Consumes: `normaliseRow` (calendar.js), `toISODate` (dates.js), `sheetRows` (workbook.js).
- Produces (boarddata.js):
  - `parseBoardSheets({ notices, courses, rooms, media }: {[k]: Row[]|null}) -> Board` where `Board = { notices: Notice[], courses: Course[], rooms: string[], captions: Record<string,string>, errors: {sheet: string, row: number, message: string}[] }`.
  - `Notice = { title, message, start: iso|null, end: iso|null, row }` — Title required; Message optional; Start/End optional, invalid date → error; end < start → error `End date is before Start date`.
  - `Course = { course, tagline, duration, intakes, location, photo, row }` — Course required.
  - rooms: trimmed non-blank `Room` values, de-duplicated, in sheet order.
  - captions: `File` → `Caption` (both required for the row to count; blank caption rows ignored silently).
  - `emptyBoard() -> Board` (all empty).
  - `activeNotices(notices, iso) -> Notice[]` — start null = from always, end null = forever.
  - `DEFAULT_NOTICE = { title: 'Welcome to ADCI', message: 'Please see reception for any enquiries.' }`.
- `data.js`: `loadData` also fetches `data/Board.xlsx` sheets `Notices`, `Courses`, `Rooms`, `Media` (each sheet optional — a missing sheet is `null`, not a failure); cache key `adci.boardRows`; returns `{ cal, tt, board, source, loadedAt }`. Board failure never changes `source` semantics for cal/tt and never throws (falls back to cache, then `emptyBoard()`).
- Workbook columns: Notices `Title, Message, Start, End`; Courses `Course, Tagline, Duration, Intakes, Location, Photo`; Rooms `Room`; Media `File, Caption`; plus a `How to use` sheet. Dates dd/mm/yyyy with date validation like Calendar.

- [ ] **Step 1: Failing tests** `tests/boarddata.test.js`: (a) notice rows `{Title:'A',Message:'m',Start:'',End:''}`, `{Title:'',…}` (error "Missing Title"), `{Title:'B',Start:'10/12/2026',End:'01/12/2026'}` (error "End date is before Start date"), `{Title:'C',Start:'xx'}` (error "Invalid Start date") → 1 notice, 3 errors each with `sheet:'Notices'`; (b) `activeNotices` with notices [always, 01/12–05/12] on `2026-12-03` → 2, on `2026-12-06` → 1; (c) rooms `[' Room A ','Room A','', 'Room B']` → `['Room A','Room B']`; (d) captions ignores blank caption; (e) `parseBoardSheets({notices:null,courses:null,rooms:null,media:null})` deep-equals `emptyBoard()`; (f) course without name → error "Missing Course".
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `boarddata.js`.
- [ ] **Step 4: Workbooks**: add Board builders to `build_templates.py` (seed: Rooms `ADCI Classroom 1` only; template blank) and run `python tools/build_templates.py`. Add to `tests/seed.test.js`: Board.xlsx parses with zero errors, `rooms` deep-equals `['ADCI Classroom 1']`, notices and courses empty.
- [ ] **Step 5: data.js** loading as above. Add `tests/data-board.test.js` only if `loadData` can be tested with a stubbed `fetch`/`localStorage` in node; otherwise verify in the browser preview that a 404 for Board.xlsx leaves the board running (temporarily rename the file, then restore).
- [ ] **Step 6: Run** `npm test` → pass. **Commit** `feat(data): Board.xlsx for notices, courses, rooms and captions`.

### Task 3: Core logic — key dates, rooms, playlist, mode rules

**Files:**
- Create: `assets/js/core/keydates.js`, `assets/js/core/rooms.js`, `assets/js/core/playlist.js`, `assets/js/core/modes.js`; tests `tests/keydates.test.js`, `tests/rooms.test.js`, `tests/playlist.test.js`, `tests/modes.test.js`

**Interfaces:**
- `keyDates(cal, iso, { limit = 3, horizonDays = 120 } = {}) -> { iso, title, sub, days }[]`
  - Candidates: every Event with `start > iso`, title = `event.name`; plus the first day of each **block change** in `cal.periods` (a period whose type differs from the previous period's type or which starts more than 3 days after the previous period ends), `start > iso`, type ≠ `break`, titles: teaching → `${term} classes start`, summer → `${term} classes start`, orientation → `${term} orientation`, exam → `Exam week`, study → `Study week`, tuition → `Tuition-free week`, assessment → `Assessment week`, christmas → `Christmas closure` (empty term → drop the `${term} ` prefix, capitalise). `sub` = `formatLong(iso)`; `days` = `daysBetween(today, iso)`. Sorted by date then title; ≤ horizon; first `limit`.
- `roomsNow(classesToday, extraRooms, nowHHMM) -> { room, status: 'busy'|'next'|'free', text }[]` — rooms = distinct `class.room` (non-blank, in class order) then `extraRooms` not already present. busy: a class with `start <= now < end` → text `${unit} · until ${end}`; else next: earliest later class → `${unit} from ${start}`; else free: `No more classes today` if the room had classes, else `Free`.
- `buildPlaylist({ manifest, courses, captions, mode }) -> Slide[]`, `Slide = {kind:'map'} | {kind:'photo', url, caption} | {kind:'video', url} | {kind:'course', course, photoUrl}`. Order per Global Constraints; videos left over when photos run out are appended at the end; no photos → map, courses, then all videos. `manifest` null/invalid shape → `[{kind:'map'}]`. `url` = `mediaPath(item.path)`.
- `mediaPath(path) -> string` — split on `/`, `encodeURIComponent` each segment, join with `/`.
- `course.photo` → `photoUrl = mediaPath('media/photos/' + photo)` when that file is in the manifest, else `null`.
- `modes.js`: `showsQR(mode) -> boolean`, `showsRooms(mode) -> boolean`, `hubKind(mode) -> 'classes'|'info'` (classes for teaching/orientation/summer/assessment), `chipText(state) -> string` (period name uppercased; break → `SEMESTER BREAK`; christmas → `CHRISTMAS CLOSURE`; no period → `WELCOME`).

- [ ] **Step 1: Failing tests.**
  - keydates (use `tests/fixtures/calendar-rows.js` via `parseCalendarRows`): on `2026-11-19` first item is `{ iso:'2026-11-23', title:'Summer 1 2026-27 classes start', days:4 }`; no duplicate for Summer 1 Week 2; on a date after the last fixture row → `[]`; an Event 200 days ahead is excluded.
  - rooms: classes `[{unit:'ORG303',room:'R1',start:'09:00',end:'12:00'},{unit:'CYB306',room:'R1',start:'13:00',end:'16:00'}]`, extra `['R2']`: at `10:00` → R1 busy `ORG303 · until 12:00`, R2 free `Free`; at `12:30` → R1 next `CYB306 from 13:00`; at `17:00` → R1 free `No more classes today`.
  - playlist: manifest with photos p1..p7, videos v1,v2, christmas c1; mode teaching, no courses → kinds `map,photo,photo,photo,video,photo,photo,photo,video,photo`; mode christmas → c1 is the first photo; courses [{course:'X',photo:'p1'}] → slide 2 is course with photoUrl; `buildPlaylist({manifest:null})` → `[{kind:'map'}]`; `mediaPath('media/photos/a #1 & b (1).jpg') === 'media/photos/a%20%231%20%26%20b%20(1).jpg'`; caption from captions map by file name.
  - modes: QR true for the 7 modes, false for break/christmas; rooms true only for the 4 schedule modes; chipText for teaching period name `Teaching Week 7` → `TEACHING WEEK 7`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** the four modules. **Step 4: Run** → pass.
- [ ] **Step 5: Commit** `feat(core): key dates, rooms now, media playlist and mode rules`.

### Task 4: New page shell, styles and header

**Files:**
- Rewrite: `index.html`, `assets/css/board.css`, `assets/css/christmas.css`
- Delete: `assets/js/board/widgets/threat.js`, `dspulse.js`, `news.js` and their imports/starts in `main.js`
- Modify: `assets/js/board/widgets/clock.js` (header clock `#clock`, date `#date`, long uppercase date e.g. `TUESDAY 24 NOV 2026`), `assets/js/board/widgets/weather.js`

**Interfaces:**
- DOM ids (later tasks rely on these exactly): header `#logo`, `#header-title`, `#mode-chip-text`, `#clock`, `#date`; left `#panel-weather` > `#weather-content`, `#panel-keydates` > `#keydates-list`, `#panel-notice` > `#notice-title`, `#notice-message`, `#notice-pager`; centre `#stage` (carousel host), `#rooms-strip`; right `#hub` (host for hub cards), `#panel-countdown` > `#countdown-label`, `#days-count`, `#countdown-sub`, `#panel-qr`; footer `#ticker-run`; `#snow-container`. `body[data-mode]` set by layout; `body.xmas` for Christmas.
- Weather: `forecast.json?key=…&q=Perth&days=1`; renders icon, temp, condition, `Feels like N° · Wind N km/h`, then 4 tiles: next two hours at least 2 h apart from now (`h AM/PM` + temp), `UV` (value + Low/Moderate/High/Very high/Extreme at 0–2/3–5/6–7/8–10/11+), `Sunset` (astro.sunset, 24 h → shown as returned, e.g. `07:01 PM` → `7:01`). Failure → text `Weather unavailable`. Weather background classes as before.
- CSS ported from `mockups/board-redesign.html` (header, cards, labels, weather, dates, notice, stage, rooms, hub, classes, qr, count, hero, rules, ticker with CSS marquee animation, snow). The `.mock` badge is not ported.

- [ ] **Step 1:** Write the shell and CSS; remove the three widgets. Panels may show placeholders until Tasks 5–6.
- [ ] **Step 2:** `npm test` → pass (no core changes).
- [ ] **Step 3:** Preview at 1920×1080 (`?date=2026-11-24`): header, clock, weather render; no console errors except panels not yet wired.
- [ ] **Step 4: Commit** `feat(ui): new board shell, header clock and forecast weather`.

### Task 5: Carousel on the new playlist

**Files:**
- Rewrite: `assets/js/board/widgets/carousel.js`; Modify: `assets/js/board/widgets/map.js` only if its mount point changes; `assets/js/board/config.js` (remove `mediaUrl`)

**Interfaces:**
- Consumes: `buildPlaylist`, `mediaPath` (Task 3); `board.courses`, `board.captions` (Task 2); `media/manifest.json`.
- Produces: `startCarousel(stageEl, { manifestUrl = 'media/manifest.json', courses, captions, mode, mapDuration, photoDuration })` — fetches manifest (`cache: 'no-store'`; failure → null), builds playlist, renders slides into `#stage` with the progress bars (one segment per slide, max 12 shown; current segment fills over the slide's duration). Photo: cover image, caption overlay (kicker `OUR CAMPUS`, title = caption) only when captioned. Video: plays muted to end, error/stall >5 s → next. Course: spotlight slide (kicker `COURSE SPOTLIGHT`, name, tagline, fact boxes for non-blank duration/intakes/location, photo or navy gradient), shown for `photoDuration * 2`. Map: existing `drawMap` for `mapDuration`.

- [ ] **Step 1:** Implement; wire from `main.js` after data load (carousel needs `board`).
- [ ] **Step 2:** Preview: map → photos → video sequence plays; add a temporary Media caption row and a Courses row in a local copy of Board.xlsx to see caption + spotlight, then restore the seed file.
- [ ] **Step 3:** `npm test` → pass. **Commit** `feat(ui): playlist carousel with captions and course spotlights`.

### Task 6: Panels and hub wiring

**Files:**
- Create: `assets/js/board/panels.js` (key dates, notices + ticker, rooms strip), `assets/js/board/hub.js` (hub cards per mode)
- Rewrite: `assets/js/board/layout.js` (now: set `body.dataset.mode`, `xmas` class, toggle `#panel-qr`, `#rooms-strip`, `#panel-countdown`), `assets/js/main.js`
- Delete: `assets/js/board/infohub.js`, `assets/js/board/schedule.js` (classes rendering moves to hub.js; keep live/next/ended logic and `autoScrollTimetable` behaviour)
- Modify: `assets/js/board/content.js` (add `welcomeLines`, `christmasLines`; exam rules keep the 6 existing entries, shown in a 2-column grid of icon + title)

**Interfaces:**
- `renderKeyDates(el, items)` — tiles as mockup; `[]` → `No upcoming dates`.
- `startNotices(cardEls, tickerEl, notices, bannerText, intervalMs = 10000)` — rotation + pager; ticker text = banner, then each notice `title message`, separated by `◆`. Empty notices → `DEFAULT_NOTICE` in the card; ticker shows banner only.
- `renderRooms(el, rooms)` from `roomsNow`; re-render on the 30 s tick.
- `renderHub(el, state, { classes, now, content })`: classes kind → "Today's classes" card (`N LIVE` badge when N>0; empty → `No classes scheduled today`; assessment empty → `Assessment week — no scheduled classes`); info kinds → hero card (`CURRENTLY ON` / `titlesFor(mode).card` / block dates; exam red, christmas red with `🎄 HOLIDAY CLOSURE` kicker and title `Merry Christmas`), then tips (tuition/study: `content.tuitionTips`), rules grid (exam), welcome lines + quote (break), christmas lines (christmas).
- Countdown card: label from `state.countdown.label`, big `N day(s)`, sub = `formatLong(target)`; hidden with no countdown.
- Mode chip text = `chipText(state)`; header title = `titlesFor(mode).header` with `|` removed (e.g. `ADCI Exam Week Hub`).

- [ ] **Step 1:** Add `tests/hub.test.js` only for pure helpers you extract (e.g. ticker text builder `tickerItems(bannerText, notices) -> string[]`: no notices → `[banner]`). Run → fail → implement → pass.
- [ ] **Step 2:** Implement panels/hub/layout/main wiring; delete replaced files.
- [ ] **Step 3:** Preview at 1920×1080 for `?date=2026-11-24` (summer classes, rooms, QR), `2026-11-19` (exam, QR, countdown), `2027-01-05` (break, no QR, no rooms), `2026-12-23` (christmas red, snow, no QR); take screenshots; compare against `mockups/screens/*.png`. Long unit name (CYB306) wraps inside its card.
- [ ] **Step 4:** `npm test` → pass. **Commit** `feat(ui): key dates, notices, rooms and per-mode hub`.

### Task 7: Check page, README and templates help

**Files:**
- Modify: `check.html`, `assets/js/check.js`, `assets/js/core/checks.js` (only if a pure helper is added), `README.md`, `tools/build_templates.py` (Board "How to use" text), regenerate templates

**Interfaces:**
- check.html adds: Board.xlsx in **Files** (rows per sheet), its row errors in **Problems** (`Board.xlsx › Notices row 4: …`), a **Notices** section (active in the next 21 days), and a **Media** section from `media/manifest.json`: counts per folder, each file with size in MB, warning line for files > 25 MB: `<file> is <N> MB — too big to replace through the github.com upload page (limit 25 MB)`.
- README: new "Photos and videos" section (upload/delete in `media/photos`, `media/videos`, `media/christmas`; 25 MB limit; captions via Board.xlsx Media sheet) and "Notices, courses and rooms" section; remove threat-watch/news mentions.

- [ ] **Step 1:** Implement; regenerate templates (`python tools/build_templates.py`); `npm test` → pass.
- [ ] **Step 2:** Preview check.html: shows `Hacking-2.mp4` warning (~56 MB) and no Board errors.
- [ ] **Step 3: Commit** `feat(check): Board.xlsx and media checks; docs for media and notices`.
