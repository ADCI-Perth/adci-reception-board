# ADCI Reception Board

The board is shown at: **https://adci-perth.github.io/adci-reception-board/**

It switches itself between Standard, Exam, Tuition-free, Semester break and Christmas
depending on the date in the Calendar spreadsheet. You do not need to touch the board itself.

What the board shows:

- **Key dates** from the Calendar spreadsheet (census date, public holidays, results and so on).
- **Notice board** and a **ticker** along the bottom, from notices posted on GitHub (see
  *Posting a notice* below) and the Notices sheet of `Board.xlsx`.
- **Rooms right now**, from the Timetable plus the Rooms sheet of `Board.xlsx`. The strip
  shows only in teaching, orientation, summer and assessment weeks.
- **Course spotlight** slides, from the Courses sheet of `Board.xlsx`.
- **Photos** (with optional captions from the Media sheet) and videos.
- A **QR code** in teaching, orientation, summer, assessment, tuition-free, study and exam
  weeks. It is hidden in semester break and Christmas.

## Updating the Calendar, Timetable or Board spreadsheet

1. Go to github.com, sign in, and open the **adci-reception-board** repository.
2. Open the **data** folder.
3. Click **Add file**, then **Upload files**.
4. Drag in your updated file. It must have exactly the same name: `Calendar.xlsx`, `Timetable.xlsx` or `Board.xlsx`.
5. Click **Commit changes**.

Wait about 5 to 10 minutes. The reception screen reloads by itself when the update is ready.

## Checking your changes

Open the board address and add `check.html` on the end:
**https://adci-perth.github.io/adci-reception-board/check.html**
It lists any problems found in the spreadsheets (for example a misspelt date), the notices that
will show over the next three weeks, and every photo and video with its size. A file bigger than
25 MB is flagged (see Photos and videos below).

## Posting a notice

The quickest way, with no spreadsheet:

1. On github.com, open the **adci-reception-board** repository and click the **Issues** tab.
2. Click **New issue**, then **Notice**, then **Get started**.
3. Type the heading in **Title** (keep it short). Optionally fill in **Message**, **Show from** and
   **Show until** (dates as dd/mm/yyyy; leave blank to show it straight away / until removed).
4. Click **Create**. The notice appears on the board within about 5 minutes.

**To remove a notice, close its issue.** To change it, edit the issue. You can post as many
notices as you like: the board rotates them every 10 seconds and runs them all in the ticker.
This also works from the GitHub phone app.

Only notices posted by the GitHub accounts listed in `data/notice-posters.txt` are shown,
because the repository is public and anyone can open an issue. To let another staff member post,
add their GitHub username to that file (open it, click the pencil, add a line, Commit). If a
notice does not appear, `check.html` says why (for example a mistyped date).

## Previewing a particular day

Add `?date=YYYY-MM-DD` to the board address, for example
`https://adci-perth.github.io/adci-reception-board/?date=2026-11-24`

## Notices, courses and rooms

These live in `data/Board.xlsx`, which has four sheets. Every sheet is optional.

- **Notices**: one row per notice. Title is required; Message, Start and End are optional.
  Leave Start and End blank and the notice always shows. With no active notices the board shows
  a default welcome notice.
- **Courses**: one row per course (Course, Tagline, Duration, Intakes, Location, Photo). Each
  becomes a course spotlight slide. Photo is a file name from `media/photos`.
- **Rooms**: one row per room, always listed in Rooms right now (rooms in the Timetable are
  included automatically).
- **Media**: File and Caption, to put a caption on a photo in `media/photos`.

Upload it the same way as the other spreadsheets (steps above), then open `check.html`.

## Photos and videos

Photos and videos are plain files in the repository. No code changes are needed.

- `media/photos` - photos shown on the board (jpg, jpeg, png, webp, gif)
- `media/videos` - videos (mp4, webm)
- `media/christmas` - photos shown only during Christmas

To add one: on github.com open the folder, click **Add file**, then **Upload files**, drag the
file in and **Commit changes**. To remove one: open the file, click the bin (delete) icon and
commit. The list of files (`media/manifest.json`) is built automatically when the site is
published, so just wait the usual 5 to 10 minutes.

**github.com will not accept an upload bigger than 25 MB per file.** `check.html` flags any existing
file over 25 MB, because it cannot be replaced through the github.com upload page.

### Compress photos and videos before uploading

Always compress new photos and videos first. Phone photos and stock videos are often 5 to 25 MB, far
more than the board can show, and big files load slowly on the reception screen.

**One-time setup:** on github.com open the **tools** folder, click `Compress-for-board.bat`, then
click the **Download raw file** button (the down arrow) and save it somewhere handy, such as your
Desktop. If Windows shows *"Windows protected your PC"* the first time, click **More info**, then
**Run anyway**.

**Each time:**

1. Put the new photos and videos in a folder on your PC.
2. Drag the files (or the whole folder) onto `Compress-for-board.bat`.
3. A window shows each file's size before and after. The first time, it offers to install the free
   **ffmpeg** tool it needs: type **Y** and press Enter.
4. When it says **Done**, a **Compressed for board** folder opens next to your files. Upload the
   files from that folder (see above). Your original files are not changed.

What it does: photos become JPEGs no bigger than 1920 pixels (phone photos are turned the right way
up), and videos become 1080p MP4s with no sound (the board plays videos muted). A PNG or MOV file
comes out as `.jpg` or `.mp4`, so use the new name if you add a caption on the Media sheet. A
video that is still over 25 MB is shown in red: trim it shorter first.

No admin rights to install ffmpeg? Use [squoosh.app](https://squoosh.app) for photos (resize to
1920 wide, MozJPEG quality 80) or the free [HandBrake](https://handbrake.fr) app for videos
(preset *Fast 1080p30*, audio removed).

The logo and QR code image are in `assets/img/`.

## Blank spreadsheets

Blank templates are in the **templates** folder of the repository
(`Calendar_TEMPLATE.xlsx`, `Timetable_TEMPLATE.xlsx` and `Board_TEMPLATE.xlsx`). Copy one, fill it
in, and save it as `Calendar.xlsx`, `Timetable.xlsx` or `Board.xlsx` before uploading. Each template
has a **How to use** sheet.

## If the screen looks wrong

Open `check.html` (see above) and fix what it reports. If a spreadsheet can't be downloaded,
can't be opened, or has no valid rows at all, the board keeps using the last good copy it saved,
so reception is never left blank. If only some rows are wrong, those rows are skipped (the rest
still show) and `check.html` lists them.

## Setting up the reception PC

- Open the board address in **Chrome** or **Edge** and make it full screen (press **F11**),
  or run the browser in kiosk mode.
- Set the browser to open the board automatically when the PC starts.
- Don't use an incognito/private or guest window: those forget the saved copy of the board's data.
- Turn off screen sleep and screen savers so the display stays on.
- Make sure the PC's clock and time zone are set to **Perth**. The board uses the PC's date to
  decide what to show.

## Previewing on your own computer (optional)

Run `node tools/build-media-manifest.mjs .` once from the project folder to create
`media/manifest.json`, then serve the folder with any local web server. Without the manifest the
board has no photos or videos to show.
