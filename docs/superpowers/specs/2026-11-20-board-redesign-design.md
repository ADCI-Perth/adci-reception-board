# Reception Board Redesign — Design

Date: 20 Nov 2026 · Status: approved by the user ("Looks good, build it") from the mockups in
`mockups/board-redesign.html` / `mockups/screens/*.png`.

## 1. Why

- ADCI will soon offer courses beyond data science and cyber security, so course-specific panels
  (Live Threat Watch, Live Data Science Pulse, Cyber news, AI news) no longer fit.
- The QR code for the student system (Meshed) matters during classes and exams, not during holidays.
- Photos and videos change often, but today the file list is typed into `assets/js/board/config.js`,
  so adding a photo means editing code.
- The user asked for a fresh design; only the colour theme must stay.

## 2. Goals, non-goals, anti-goals

**Goals**
- New 1920×1080 layout from the approved mockup (section 4), same colours and fonts.
- Course-neutral panels: Key dates, Notice board, Rooms right now, Course spotlight slides, visitor welcome.
- QR shown only in study/class/exam-type modes.
- Photos/videos managed by uploading to or deleting from folders on github.com — no code edits.
- Staff-editable notices, courses and photo captions via a third spreadsheet, uploaded like the others.

**Non-goals**
- No change to calendar/timetable spreadsheets, mode selection rules, auto-update or caching behaviour.
- No new external services or API keys (weather stays on the existing weatherapi.com key).

**Anti-goals**
- A blank or broken screen because the new spreadsheet or a media file is bad.
- Invented facts on a public screen (no made-up courses, opening hours, Wi-Fi details).

## 3. Constraints

- Static GitHub Pages site, vanilla ES modules, no build step for the browser (existing).
- github.com web upload accepts files up to 25 MB each; git push up to 100 MB.
- Media file names contain spaces and mixed case; Pages is case-sensitive.
- Existing tests (46) must keep passing or be updated where the behaviour intentionally changes.

## 4. The design (as approved)

### 4.1 Layout (1920×1080, grid rows 104px / 1fr / 58px)
- **Header** (navy gradient, accent underline): logo on a white tile; title (e.g. "ADCI Information Hub",
  "ADCI Exam Week Hub") with "AUSTRALIAN DATA AND CYBER INSTITUTE" subtitle; **mode chip** (pill with
  pulsing dot, text = current period name, e.g. "TEACHING WEEK 7", "EXAM WEEK", "SEMESTER BREAK",
  "CHRISTMAS CLOSURE"); **clock + long date** on the right.
- **Left column (420px):** Weather card (temp, condition, feels-like, wind, two later hours, UV, sunset);
  **Key dates** card (next 3 dates); **Notice board** card (navy, rotating notices with pager).
- **Centre:** media **stage** (map, photos, videos, course spotlight slides) with progress bars and an
  optional caption; under it a **Rooms right now** strip (schedule modes only).
- **Right column (470px):** the mode hub (section 4.3), countdown card, QR card.
- **Footer ticker:** accent tag "● NOTICES" + scrolling items: the mode banner (existing `bannerFor`),
  then the active notices.
- Christmas: header and accent switch to red; snow overlay.

### 4.2 QR visibility
Shown in teaching, orientation, summer, assessment, tuition-free, study and exam. Hidden in semester
break and Christmas. (Study and tuition-free were Claude's call; the user accepted the mockup.)

### 4.3 Hub per mode
| Mode | Hub content | Countdown | QR |
|---|---|---|---|
| teaching, orientation, summer | "Today's classes" card: live/next/ended rows + "N LIVE" badge; empty-day message | — | yes |
| assessment | Today's classes, or "Assessment week — no scheduled classes" | yes (existing) | yes |
| tuition | Hero card (CURRENTLY ON / title / dates) + tips | yes | yes |
| study | Hero card + tips | yes | yes |
| exam | Hero card (red) + exam rules grid | yes | yes |
| break | Hero card + "Welcome to ADCI" visitor lines + quote | yes | no |
| christmas | Red hero "Merry Christmas" + thank-you lines + closure dates | yes | no |

The "Today's exams" list and "Reception this week" hours seen in the mockups are dropped: there is no
data source for them and the board must not invent it. Exam/break/christmas hubs fill the space with
the rules, visitor lines and quote instead.

### 4.4 Key dates
Next 3 dates after today, at most 120 days ahead: Event rows (census, results, holidays) plus the first
day of each new block (exam week, Summer 2 classes start, Christmas closure, orientation). Each shows a
calendar tile (month, day), a title, a sub-line (weekday date) and "N days". From `Calendar.xlsx`, no new data.

### 4.5 Notice board and ticker
Notices come from `data/Board.xlsx` sheet **Notices**: Title, Message, Start, End (dates, optional =
always). Active notices rotate every 10 s in the card; their titles + messages also run in the ticker.
With no active notice, the card shows "Welcome to ADCI — please see reception for any enquiries."

### 4.6 Rooms right now
Rooms with a class today, plus any rooms listed in Board.xlsx sheet **Rooms** (Room). Each chip: IN USE
(unit, "until HH:MM"), NEXT ("unit from HH:MM") or FREE. Refreshes with the schedule tick. Shown only in
teaching/orientation/summer/assessment; hidden elsewhere.

### 4.7 Course spotlight
Board.xlsx sheet **Courses**: Course, Tagline, Duration, Intakes, Location, Photo (file name in
media/photos, optional). One slide per row: left navy panel (kicker "COURSE SPOTLIGHT", name, tagline,
up to three fact boxes), right photo. Shipped empty — the user will supply courses. No rows → no slides.

### 4.8 Media management
- Folders: `media/photos/`, `media/videos/`, `media/christmas/` (shown only in Christmas mode, in
  addition to photos). Logo and QR move to `assets/img/`. Unused old files go to `archive/media/`
  (not deployed).
- The deploy workflow writes `media/manifest.json` (file names and sizes per folder) — upload or delete a
  file on github.com and the next deploy picks it up. No code edits.
- Optional captions: Board.xlsx sheet **Media**: File, Caption. Captioned photos show the caption overlay.
- Playlist: map → course spotlights → photos and videos interleaved (a video after every 3 photos),
  alphabetical within each folder. Missing manifest → map only (never blank).
- `check.html` lists the media found and warns for files over 25 MB (cannot be replaced through the
  github.com upload page).

### 4.9 Weather
Switch to weatherapi.com `forecast.json?days=1` (same key) for UV, sunset and two later hours.
Failure keeps the card showing "Weather unavailable" — never breaks the board.

## 5. Error handling
- Board.xlsx follows the existing pattern: per-row validation, bad rows skipped and listed on
  check.html, localStorage last-good cache, missing file → board still runs (no notices/courses/rooms extra).
- Each widget starts in its own try/catch (existing).

## 6. Builder's calls (Claude's, correctable)
- New third spreadsheet `Board.xlsx` (Notices, Courses, Rooms, Media sheets) rather than more sheets in
  Calendar.xlsx: it changes more often, and a bad upload can't break the calendar.
- Cyber/AI news panels removed along with threat watch and DS pulse.
- Rooms strip shows only rooms that have classes today or are listed in the Rooms sheet.
- Seed Board.xlsx: no notices, no courses, Rooms = "ADCI Classroom 1", no captions.
- Oversized videos (`Hacking-2.mp4` 57 MB) stay as they are; the check page flags them.

## 7. Left to the builder
Code structure, CSS details, exact copy of the visitor/thank-you lines, test layout.
