# Auto-switching Reception Board — Design

Date: 20 Nov 2026 · Status: draft for approval

## 1. Why

The ADCI reception screen shows an HTML "board" (clock, weather, live news feeds, map/photo/video carousel, and a right-hand hub). Today there is one hand-edited HTML copy per period — Standard (timetable), Tuition-Free Week, Study Break, Exam Week, Semester Break, Christmas — and dates are typed into each copy (banner text, hub title, countdown dates). Every period change means editing and swapping files on the reception PC, and copies drift (e.g. `Semester_Break_Hub.html` is still titled "Exam Week Hub").

Goal: the user fills in two Excel templates (calendar + timetable) once a year / once a semester, uploads them to GitHub, and the board — hosted on GitHub Pages — shows the right version for today on its own.

## 2. Goals, non-goals, anti-goals

**Goals**
- One board that picks its mode from today's date using an uploaded calendar spreadsheet.
- Timetable driven by an uploaded spreadsheet, per term (Feb, Jul, Summer 1, Summer 2, …), with per-class date ranges.
- Hosted on GitHub Pages from a public repo; updates by uploading files through github.com — no editing on the reception PC.
- Reception screen picks up changes within ~15 minutes without anyone touching it.
- Keep the current look and live features (clock, weather, cyber/AI news, threat watch, data-science pulse, map, photos, videos, QR).

**Non-goals**
- No admin login, server, or database. GitHub is the only "backend".
- No visual redesign.
- No upload button on the board itself (uploading happens on github.com).

**Anti-goals (failure even if it "works")**
- A blank or broken screen at reception because a spreadsheet has a typo.
- The user having to edit HTML/JS to change dates or classes.
- Showing classes during weeks they don't run (e.g. ORG303 in assessment week).

## 3. Constraints

- GitHub Pages, public repo (user confirmed public is fine; all API keys are free-tier).
- GitHub Pages is case-sensitive and caches ~10 min; filenames include spaces (`Present Pictures/`).
- Largest file `Hacking-2.mp4` is 56 MB (GitHub warns >50 MB, blocks >100 MB). Total ~153 MB.
- Timezone: Perth (AWST, no daylight saving). "Today" = the reception PC's local date.
- Must be readable on a wall screen; existing layout is 3 columns (sidebar / carousel / hub).
- Excel reading in the browser via SheetJS from cdnjs (pinned version).

## 4. Approaches considered

| | Approach | Trade-off | Decision |
|---|---|---|---|
| A | One `index.html` + data files; board switches mode by date | Most up-front work; then fixes happen once, not 5× | **Chosen base** |
| B | Keep separate HTML files + router page that redirects by date | Least rework, but dates and layout fixes still live in 5 files | Rejected — keeps the drift problem |
| C | Dates from a live Google Sheet / Excel Online | Easy editing, but adds a second service and a publicly shared sheet | Rejected |

User refinement of A: the data files are **Excel templates** the user fills in and uploads, rather than a JS config file.

## 5. Design

### 5.1 Repository layout

```
index.html              the single board
check.html              data-check page (lists problems in the spreadsheets)
data/Calendar.xlsx      periods + one-day events
data/Timetable.xlsx     classes per term
templates/              blank copies of both spreadsheets with instructions
assets/                 board JS/CSS split out of index.html
Present Pictures/       existing media (unchanged names)
archive/                the old per-period HTML files, kept for reference
version.txt             changed on every upload (see 5.6)
```

### 5.2 `Calendar.xlsx` (sheet "Calendar")

| Column | Example | Notes |
|---|---|---|
| Type | Exam | Dropdown: Orientation, Teaching, Tuition Free, Study, Exam, Assessment, Semester Break, Summer, Christmas, Event |
| Name | Exam Week 1 | Shown on board ("Teaching Week 7") |
| Start | 09/11/2026 | Real Excel date, dd/mm/yyyy |
| End | 13/11/2026 | Inclusive |
| Term | Jul 2026 | Links to Timetable `Term`. Blank for Christmas/Event |
| Banner text | (optional) | Overrides the default banner message for that period/day |

A second sheet "How to use" explains columns. Data validation enforces the Type dropdown and date cells.

Sources (OneDrive, Student Services):
- `02-Student Services - Documents\Academic Calendar\Approved Academic Calendar 2026.pdf`
- `02-Student Services - Documents\Academic Calendar\Academic Calendar 2027 draft.pdf` (draft has typos — "09/22", duplicate "11/01", Tue "22/04"; derive all dates from each week's Monday)
- `04-Academic - Documents\Unit Planning & Timetable\summer\Summer Timetable.docx`

One row per calendar week, mirroring the PDF's "Term" column (so "Teaching Week 7" is a row's Name; no week counting in code). Unlabelled weeks get no row (they fall back to Semester Break).

Christmas closures: 21/12/2026–01/01/2027 (2026 PDF week 52 + 2027 PDF week 1); 27/12/2027–31/12/2027 (2027 PDF). 20–24 Dec 2027 is unlabelled → Semester Break.

Pre-filled from the approved 2026 calendar, the 2027 draft, and the summer dates:
- Summer 1: 23/11/2026–18/12/2026 (classes 23/11–11/12, Assessment 14/12–18/12)
- Summer 2: 11/01/2027–05/02/2027 (classes 11/01–29/01, Assessment 01/02–05/02)
- Census dates, results-release dates, public holidays as `Event` rows.

### 5.3 `Timetable.xlsx` (sheet "Timetable")

| Column | Example |
|---|---|
| Term | Summer 1 |
| Unit | CAP302 |
| Unit name | Industry Capstone |
| Lecturer | Dr Anna Griffin |
| Day | Mon (dropdown Mon–Sun) |
| Start / End | 09:00 / 13:00 |
| Room | ADCI Classroom 1 |
| From / To | 23/11/2026 / 18/12/2026 (optional; default = term's dates) |

A class with two days (Mon, Fri) is two rows. Pre-filled with:
- **Summer 1:** CAP302 (Dr Anna Griffin, Mon+Fri 09:00–13:00, 23/11–18/12), ORG303 (Dr Maen Hawari, Tue–Thu 09:00–12:00, 24/11–10/12), CYB306 (Chloe Wu, Tue–Thu 13:00–16:00, 24/11–10/12).
- **Summer 2:** SEC101 (Dr Alfred Tseng, Tue–Thu 09:00–12:00, 12/01–28/01), CYB201 (Mohammad Qatatsha, Tue–Thu 13:00–16:00, 12/01–28/01).
- All rooms ADCI Classroom 1. Struck-out units (CSC101, CAP301, MAT101) excluded.
- **Jul 2026:** the timetable currently in `Standard_reception_hub - v4.html`.

### 5.4 Mode selection

On load and every hour, the board finds the calendar row(s) covering today.
- Priority when rows overlap: Christmas > Exam > Study > Assessment > Tuition Free > Summer > Orientation > Teaching > Semester Break. `Event` rows never change the mode; they only add banner text.
- No covering row → **Semester Break** mode with countdown to the next non-Event period.

| Mode | Hub panel | Countdown | Default banner |
|---|---|---|---|
| Teaching / Summer / Orientation | Today's classes from the term's timetable (existing live/next/ended styling) + QR | — | "Teaching Week 7" / "Summer Semester" / "Orientation Week" |
| Assessment | Today's classes if any, else "Assessment week — no scheduled classes" card | To next period | "Assessment Week" |
| Tuition Free | Existing tuition-free card + tips | Classes resume in | "Tuition-free week — classes resume <date>" |
| Study | Existing study-break card + news cards | Exam starts in | "Study week — exams start <date>" |
| Exam | Existing exam card + exam rules list | Exams complete in | "Exam week — good luck to all students" |
| Semester Break | Existing break card + news cards | Next period starts in (named, e.g. "Orientation") | "Semester break — classes resume <date>" |
| Christmas | Existing Christmas theme (snow, red header) | Campus reopens in | "Merry Christmas — campus reopens <date>" |

Header title follows the mode ("ADCI | Exam Week Hub"). Weekend in a Teaching week shows the existing "No classes scheduled" card. Event banner text is appended to the banner on that day.

### 5.5 Error handling

- Each row is validated (dates parse, End ≥ Start, Type known, times valid). Bad rows are skipped; good rows still used.
- If a spreadsheet fails to load entirely, the board uses the last good copy cached in the browser (localStorage) and still shows clock/weather/news.
- `check.html` shows: each file's last-loaded time, rows skipped and why, overlapping periods, terms in Timetable with no Calendar match, and gaps with no period. Open it after every upload.
- `?date=YYYY-MM-DD` on `index.html` previews any day.

### 5.6 Auto-update

- Every 5 minutes the board fetches `version.txt` (cache-busted). If it differs from the loaded value, the page reloads. Keeps the existing 13-hour reload as a backstop.
- A GitHub Action writes the commit SHA into `version.txt` on each push, so uploads via "Add file → Upload files" trigger it automatically — the user does nothing extra.

### 5.7 Hosting setup

- New public repo `ADCI-Perth/adci-reception-board` (user is an org admin; org is on the free plan, so public is required). Pages served from `main` root → `https://adci-perth.github.io/adci-reception-board/`. Reception PC browser opens that URL in kiosk/full-screen (user to confirm the PC can reach github.io).
- Build timing: full build in one pass; not live for Summer 1 start (23 Nov 2026). User handles the interim manually.
- Media paths URL-encoded; all filename references verified against actual case.
- Compress `Hacking-2.mp4` below 50 MB if quality allows (optional).

## 6. Decided by the user

- Hosting on GitHub Pages, public repo; free-tier API keys may be public.
- Excel templates, uploaded via github.com "Upload files".
- Summer semester dates and timetable as above; all summer classes in ADCI Classroom 1; no breaks within summer.
- Approach A with Excel data files.

## 7. Builder's calls (Claude's proposals, correctable)

- Mode priority order and Semester Break as the fallback.
- Summer weeks show summer classes (not the Semester Break hub) even though regular students are on break.
- 4–8 Jan 2027 and 8–12 Feb 2027 gap weeks → Semester Break mode, countdown to next period.
- Orientation Week uses the Standard board with an orientation banner.
- One-day events change banner text only.
- Exam rules, tips, and quotes stay in the code (rarely change), not in the spreadsheets.
- Each mode keeps the panels of its base file (e.g. Standard keeps cyber/AI news + QR in the sidebar; Exam/Tuition Free keep threat watch + data-science pulse; Christmas keeps snow theme + QR and no feeds). No mode gains or loses panels in this build.
- Calendar has one row per week, copied from the PDF.
- Which existing files are the base: Standard v4, `Standard_reception_hub_tuition_free_week.html`, `Semester_Break_Hubv2.html`, `Exam_Week_Hub.html`, `Christmas_Version.html`.

## 8. Left to the builder

- Code structure, SheetJS version, CSS merging, GitHub Action details, exact wording of the "How to use" sheet.
