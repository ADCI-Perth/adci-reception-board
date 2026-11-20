# ADCI Reception Board

The board is shown at: **https://adci-perth.github.io/adci-reception-board/**

It switches itself between Standard, Exam, Tuition-free, Semester break and Christmas
depending on the date in the Calendar spreadsheet. You do not need to touch the board itself.

## Updating the Calendar or the Timetable

1. Go to github.com, sign in, and open the **adci-reception-board** repository.
2. Open the **data** folder.
3. Click **Add file**, then **Upload files**.
4. Drag in your updated file. It must have exactly the same name: `Calendar.xlsx` or `Timetable.xlsx`.
5. Click **Commit changes**.

Wait about 5 to 10 minutes. The reception screen reloads by itself when the update is ready.

## Checking your changes

Open the board address and add `check.html` on the end:
**https://adci-perth.github.io/adci-reception-board/check.html**
It lists any problems found in the spreadsheets (for example a misspelt date).

## Previewing a particular day

Add `?date=YYYY-MM-DD` to the board address, for example
`https://adci-perth.github.io/adci-reception-board/?date=2026-11-24`

## Blank spreadsheets

Blank templates are in the **templates** folder of the repository
(`Calendar_TEMPLATE.xlsx` and `Timetable_TEMPLATE.xlsx`). Copy one, fill it in, and save it as
`Calendar.xlsx` or `Timetable.xlsx` before uploading.

## If the screen looks wrong

Open `check.html` (see above) and fix what it reports. If a spreadsheet cannot be read, the board
keeps showing the last good data, so reception is never left blank.
