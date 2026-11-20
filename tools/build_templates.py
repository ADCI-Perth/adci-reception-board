"""Build data/*.xlsx (seeded) and templates/*_TEMPLATE.xlsx (blank). Run from project root."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from openpyxl import Workbook
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

from seed_data import board_rooms, calendar_rows, timetable_rows

TYPES = ["Orientation", "Teaching", "Tuition Free", "Study", "Exam", "Assessment",
         "Semester Break", "Summer", "Christmas", "Event"]
DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
LAST = 500
DATE_FMT = "dd/mm/yyyy"

CAL_HEAD = ["Type", "Name", "Start", "End", "Term", "Banner text"]
CAL_WIDTHS = [16, 32, 13, 13, 20, 36]
TT_HEAD = ["Term", "Unit", "Unit name", "Lecturer", "Day", "Start", "End", "Room", "From", "To"]
TT_WIDTHS = [20, 18, 42, 22, 8, 9, 9, 22, 13, 13]

CAL_HELP = [
    "Calendar.xlsx - how to fill it in",
    "One row per week (or per event). Type is picked from the dropdown in column A.",
    "For a week, Start is the Monday and End is the Friday of that week.",
    "For a one-day event (census date, public holiday, results), Start and End are the same date.",
    "Enter dates as dd/mm/yyyy. Leave Term blank for breaks, Christmas and events.",
    "Term must match the Term column in Timetable.xlsx exactly (e.g. Jul 2026, Summer 1 2026-27).",
    "Banner text is optional; fill it only to override the banner shown on the board for that row.",
    "Gaps between periods are shown as Semester Break automatically - no rows needed.",
    "To upload: github.com -> open the project -> data folder -> Add file -> Upload files.",
    "Use the same file name (Calendar.xlsx) so the new file replaces the old one, then Commit.",
    "Afterwards open check.html to confirm the data has no errors.",
]
TT_HELP = [
    "Timetable.xlsx - how to fill it in",
    "One row per class per day (a class on Mon and Fri needs two rows).",
    "Term must match the Term column in Calendar.xlsx exactly (e.g. Jul 2026, Summer 1 2026-27).",
    "Day is picked from the dropdown in column E (Mon to Sun).",
    "Start and End are times typed as HH:MM, 24-hour (e.g. 09:00, 13:30).",
    "From and To are optional dates (dd/mm/yyyy). Leave blank and the class shows in that term's Teaching (or Summer) weeks only - not in Orientation or Assessment weeks.",
    "Fill From/To to set exact dates, e.g. a class that runs in Assessment week, or a Summer class that stops before the term ends.",
    "Unit is the code (e.g. CYB204); Unit name is the title shown on screen.",
    "To upload: github.com -> open the project -> data folder -> Add file -> Upload files.",
    "Use the same file name (Timetable.xlsx) so the new file replaces the old one, then Commit.",
    "Afterwards open check.html to confirm the data has no errors.",
]

BOARD_SHEETS = [
    ("Notices", ["Title", "Message", "Start", "End"], [34, 60, 13, 13], [3, 4]),
    ("Courses", ["Course", "Tagline", "Duration", "Intakes", "Location", "Photo"], [34, 40, 14, 20, 18, 22], []),
    ("Rooms", ["Room"], [28], []),
    ("Media", ["File", "Caption"], [28, 50], []),
]
BOARD_HELP = [
    "Board.xlsx - how to fill it in",
    "Notices: one row per notice. Title is required; Message is optional.",
    "Start and End are optional dates (dd/mm/yyyy). Leave blank and the notice is always shown.",
    "Courses: one row per course. Photo is optional - a file name from the media/photos folder (e.g. campus.jpg).",
    "Rooms: one row per room. These rooms are always listed in the Rooms right now strip, in addition to rooms found in the Timetable.",
    "Media: File is a photo file name in media/photos (e.g. campus.jpg); Caption is the text shown with that photo. Photos with no row have no caption.",
    "Photos and videos themselves are added or deleted on github.com in media/photos, media/videos and media/christmas (max 25 MB per file) - not in this workbook.",
    "Every sheet is optional - an empty or missing sheet is simply skipped.",
    "To upload: github.com -> open the project -> data folder -> Add file -> Upload files.",
    "Use the same file name (Board.xlsx) so the new file replaces the old one, then Commit.",
    "Afterwards open check.html to confirm the data has no errors.",
]


def build_board(path, rooms):
    wb = Workbook()
    wb.remove(wb.active)
    for name, head, widths, date_cols in BOARD_SHEETS:
        ws = wb.create_sheet(name)
        ws.append(head)
        for c in ws[1]:
            c.font = Font(bold=True)
        ws.freeze_panes = "A2"
        for i, w in enumerate(widths, 1):
            ws.column_dimensions[get_column_letter(i)].width = w
        if name == "Rooms":
            for r in rooms:
                ws.append(list(r))
        for row in range(2, LAST + 1):
            for col in date_cols:
                ws.cell(row=row, column=col).number_format = DATE_FMT
        for col in date_cols:
            dv = DataValidation(type="date", operator="greaterThan", formula1="36526", allow_blank=True,
                                showErrorMessage=True, errorTitle="Date", error="Enter a date as dd/mm/yyyy")
            letter = get_column_letter(col)
            dv.add(f"{letter}2:{letter}{LAST}")
            ws.add_data_validation(dv)
    h = wb.create_sheet("How to use")
    for i, line in enumerate(BOARD_HELP, 1):
        h.cell(row=i, column=1, value=line)
    h["A1"].font = Font(bold=True, size=13)
    h.column_dimensions["A"].width = 110
    os.makedirs(os.path.dirname(path), exist_ok=True)
    wb.save(path)


def build(path, sheet, head, widths, rows, help_lines, date_cols, time_cols, validations):
    wb = Workbook()
    ws = wb.active
    ws.title = sheet
    ws.append(head)
    for c in ws[1]:
        c.font = Font(bold=True)
    ws.freeze_panes = "A2"
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    for r in rows:
        ws.append([None if v == "" else v for v in r])
    for row in range(2, LAST + 1):
        for col in date_cols:
            ws.cell(row=row, column=col).number_format = DATE_FMT
        for col in time_cols:
            ws.cell(row=row, column=col).number_format = "@"
    for col, formula in validations:
        dv = DataValidation(type="list", formula1=formula, allow_blank=True, showErrorMessage=True)
        letter = get_column_letter(col)
        dv.add(f"{letter}2:{letter}{LAST}")
        ws.add_data_validation(dv)
    for col in date_cols:
        dv = DataValidation(type="date", operator="greaterThan", formula1="36526", allow_blank=True,
                            showErrorMessage=True, errorTitle="Date", error="Enter a date as dd/mm/yyyy")
        letter = get_column_letter(col)
        dv.add(f"{letter}2:{letter}{LAST}")
        ws.add_data_validation(dv)
    h = wb.create_sheet("How to use")
    for i, line in enumerate(help_lines, 1):
        h.cell(row=i, column=1, value=line)
    h["A1"].font = Font(bold=True, size=13)
    h.column_dimensions["A"].width = 110
    os.makedirs(os.path.dirname(path), exist_ok=True)
    wb.save(path)


def main():
    cal = calendar_rows()
    tt = timetable_rows()
    cal_val = [(1, '"' + ",".join(TYPES) + '"')]
    tt_val = [(5, '"' + ",".join(DAYS) + '"')]
    for folder, c_rows, t_rows, suffix in (("data", cal, tt, ""), ("templates", [], [], "_TEMPLATE")):
        build_board(f"{folder}/Board{suffix}.xlsx", board_rooms() if folder == "data" else [])
        build(f"{folder}/Calendar{suffix}.xlsx", "Calendar", CAL_HEAD, CAL_WIDTHS, c_rows, CAL_HELP, [3, 4], [], cal_val)
        build(f"{folder}/Timetable{suffix}.xlsx", "Timetable", TT_HEAD, TT_WIDTHS, t_rows, TT_HELP, [9, 10], [6, 7], tt_val)
    print(f"Calendar rows: {len(cal)}  Timetable rows: {len(tt)}")


if __name__ == "__main__":
    main()
