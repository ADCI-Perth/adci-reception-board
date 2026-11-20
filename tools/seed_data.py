"""Seed data for the 2026-27 reception board workbooks."""
from datetime import date, timedelta

D = timedelta


def _semester(term, orientation, weeks):
    rows = [("Orientation", "Orientation Week", orientation, orientation + D(4), term, "")]
    monday = orientation + D(7)
    tw = 0
    for w in weeks:
        if w == "TW":
            tw += 1
            t, name = "Teaching", f"Teaching Week {tw}"
        elif w == "TF":
            t, name = "Tuition Free", "Tuition Free Week"
        elif w == "Study":
            t, name = "Study", "Study Week"
        else:
            t, name = "Exam", f"Exam Week {w}"
        rows.append((t, name, monday, monday + D(4), term, ""))
        monday += D(7)
    return rows


JUL_WEEKS = ["TW"] * 6 + ["TF"] + ["TW"] * 2 + ["TF"] + ["TW"] * 4 + ["Study", 1, 2]
FEB_WEEKS = ["TW"] * 5 + ["TF"] + ["TW"] * 3 + ["TF"] + ["TW"] * 4 + ["Study", 1, 2]


def _summer(label, mondays, assess):
    term = f"{label} 2026-27"
    rows = [("Summer", f"{label} Week {i}", m, m + D(4), term, "") for i, m in enumerate(mondays, 1)]
    rows.append(("Assessment", f"{label} Assessment Week", assess, assess + D(4), term, ""))
    return rows


def calendar_rows():
    rows = []
    rows += _semester("Jul 2026", date(2026, 7, 20), JUL_WEEKS)
    rows += _summer("Summer 1", [date(2026, 11, 23), date(2026, 11, 30), date(2026, 12, 7)], date(2026, 12, 14))
    rows += _summer("Summer 2", [date(2027, 1, 11), date(2027, 1, 18), date(2027, 1, 25)], date(2027, 2, 1))
    rows += _semester("Feb 2027", date(2027, 2, 15), FEB_WEEKS)
    rows += _semester("Jul 2027", date(2027, 7, 19), JUL_WEEKS)
    for s, e in [(date(2026, 12, 21), date(2027, 1, 1)), (date(2027, 12, 27), date(2027, 12, 31))]:
        rows.append(("Christmas", "Christmas & New Year Break", s, e, "", ""))
    events = [
        ("Census Date", date(2026, 8, 21)), ("Census Date", date(2027, 3, 19)), ("Census Date", date(2027, 8, 20)),
        ("July 2026 Results Released", date(2026, 12, 11)),
        ("February 2027 Results Released", date(2027, 7, 9)),
        ("July 2027 Results Released", date(2027, 12, 10)),
        ("Christmas Day", date(2026, 12, 25)), ("New Year's Day", date(2027, 1, 1)),
        ("Australia Day", date(2027, 1, 26)), ("Labour Day", date(2027, 3, 1)),
        ("Good Friday", date(2027, 3, 26)), ("Easter Monday", date(2027, 3, 29)),
        ("Western Australia Day", date(2027, 6, 7)), ("King's Birthday", date(2027, 9, 27)),
    ]
    for name, d in events:
        rows.append(("Event", name, d, d, "", ""))
    return rows


DAYNAMES = {"Monday": "Mon", "Tuesday": "Tue", "Wednesday": "Wed", "Thursday": "Thu", "Friday": "Fri"}

# Copied from "Standard_reception_hub - v4.html" schedule (lines 389-420).
JUL_2026_SCHEDULE = {
    "Monday": [
        ("09:30", "12:30", "CSC203: Data Structure and Algorithms", "ADCI Classroom 1", "Malik Asim"),
        ("09:30", "12:30", "CSC101: Intro to Programming", "ADCI Classroom 2", "Lucy Yuan"),
        ("13:30", "16:30", "ARI101: Intro to Artificial Intelligence", "ADCI Classroom 1", "Zia Ur Rehman"),
        ("13:30", "16:30", "MAT101: Intro to Mathematics", "ADCI Classroom 2", "Lucy Yuan"),
    ],
    "Tuesday": [
        ("09:00", "12:00", "CYB204: Ethical Hacking", "ADCI Classroom 1", "Nima Moktan"),
        ("09:00", "12:00", "DNA102: Intro to Database Systems", "KCBT Classroom 12 ", "Uzma Malik"),
        ("13:00", "16:00", "SEC102: Information Risk and Security", "ADCI Classroom 1", "Dr Anna Griffin"),
        ("13:00", "16:00", "CYB203: Security System Design", "ADCI Classroom 2", "Mohammad Qatatsha"),
        ("17:00", "20:00", "SEC303: Security Auditing and Compliance", "Online", ""),
        ("17:00", "20:00", "ARI303: Intelligent Bot Services", "Online", "Zia Ur Rehman"),
    ],
    "Wednesday": [
        ("09:00", "12:00", "CYB205: Cyber Forensics", "ADCI Classroom 1", "Uzma Malik"),
        ("09:00", "12:00", "MAT203: Graph Theory", "ADCI Classroom 2", "Dr Alfred Tseng"),
        ("13:00", "16:00", "CSC204: Access Control and Authentication", "ADCI Classroom 1", "Uzma Malik"),
        ("13:00", "16:00", "ARI202: Machine Learning", "ADCI Classroom 2", "Nima Mirnateghi"),
    ],
    "Thursday": [
        ("09:00", "12:00", "ORG304: Professional Case Study", "ADCI Classroom 1", "Dr Alfred Tseng"),
        ("09:00", "12:00", "ORG201: Data Governance", "ADCI Classroom 2", "Dr Maen Hawari"),
        ("13:00", "16:00", "CAP301 & CAP302: Industry Capstone", "ADCI Classroom 1", "Dr Anna Griffin"),
        ("13:00", "16:00", "DNA203: Big Data Infrastructure and Architecture", "ADCI Classroom 2", "Chloe Wu"),
    ],
    "Friday": [
        ("09:00", "12:00", "CYB308: Incident Response and Disaster Management", "ADCI Classroom 1", "Dr Maen Hawari"),
        ("13:00", "16:00", "DNA305: Data Visualisation", "ADCI Classroom 1", "Chloe Wu"),
    ],
}


def timetable_rows():
    rows = []
    for day, entries in JUL_2026_SCHEDULE.items():
        for start, end, name, room, lect in entries:
            unit, unit_name = name.split(": ", 1)
            rows.append(("Jul 2026", unit, unit_name, lect, DAYNAMES[day], start, end, room.strip(), None, None))

    def summer(term, unit, uname, lect, days, start, end, frm, to):
        for d in days:
            rows.append((term, unit, uname, lect, d, start, end, "ADCI Classroom 1", frm, to))

    s1 = "Summer 1 2026-27"
    summer(s1, "CAP302", "Industry Capstone", "Dr Anna Griffin", ["Mon", "Fri"], "09:00", "13:00", date(2026, 11, 23), date(2026, 12, 18))
    summer(s1, "ORG303", "Digital Innovation", "Dr Maen Hawari", ["Tue", "Wed", "Thu"], "09:00", "12:00", date(2026, 11, 24), date(2026, 12, 10))
    summer(s1, "CYB306", "Security & Privacy Implications of the IOT", "Chloe Wu", ["Tue", "Wed", "Thu"], "13:00", "16:00", date(2026, 11, 24), date(2026, 12, 10))
    s2 = "Summer 2 2026-27"
    summer(s2, "SEC101", "Human Factors Security and Privacy", "Dr Alfred Tseng", ["Tue", "Wed", "Thu"], "09:00", "12:00", date(2027, 1, 12), date(2027, 1, 28))
    summer(s2, "CYB201", "Network Security", "Mohammad Qatatsha", ["Tue", "Wed", "Thu"], "13:00", "16:00", date(2027, 1, 12), date(2027, 1, 28))
    return rows


def board_rooms():
    """Rooms always shown in the 'Rooms right now' strip."""
    return [("ADCI Classroom 1",)]
