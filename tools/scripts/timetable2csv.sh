#!/usr/bin/env python3
"""
timetable2csv — Convert a Lingnan University term timetable PDF into a clean CSV.

Usage:
    ./timetable2csv INPUT.pdf [OUTPUT.csv]

If OUTPUT.csv is omitted, it is written next to the input with a .csv extension.

Requires: poppler-utils (pdftotext).  No Python packages needed.
"""

import csv
import os
import re
import subprocess
import sys

# ----- Column layout of the output CSV --------------------------------------
FIELDS = [
    "CRN", "LWE", "Course Code", "Course Title", "Sect", "Lang",
    "STC", "SVL", "Type", "Day", "Start", "End", "Venue",
    "Instructor Name", "Instructor Email",
]

# ----- Patterns used to anchor the free-text columns ------------------------
RE_TIME   = re.compile(r"(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})")          # 09:30 - 12:29
RE_DAY    = re.compile(r"\b(MON|TUE|WED|THU|FRI|SAT|SUN)\b")
RE_TYPE   = re.compile(r"\b(LEC|TUT|PRJ|SEM|LAB|WKS)\b")
RE_COURSE = re.compile(r"\b([A-Z]{2,4}\d[A-Z0-9]{2,4}[A-Z]?)\b")     # ACT2200, CCC8011, HST3398D, ABCT1D01
RE_EMAIL  = re.compile(r"[\w.\-]+@[\w.\-]+")                          # one or more, possibly ;-joined
RE_LANG   = re.compile(r"^[ECP12345]$")
RE_FLAG   = re.compile(r"^(STC|SVL|SC|SO|Y)$")

SKIP_SUBSTR = ("Term 1, 2025", "Term 2, 2025", "1st Term", "2nd Term")


def extract_text(pdf_path):
    """Run pdftotext -layout and return the raw text."""
    try:
        out = subprocess.run(
            ["pdftotext", "-layout", pdf_path, "-"],
            capture_output=True, text=True, check=True,
        )
    except FileNotFoundError:
        sys.exit("Error: 'pdftotext' not found. Install it with: sudo apt install poppler-utils")
    except subprocess.CalledProcessError as e:
        sys.exit(f"Error: pdftotext failed:\n{e.stderr}")
    return out.stdout


def is_data_line(line):
    """A data row starts with a CRN (pure number) and contains a course code somewhere."""
    s = line.strip()
    if not s:
        return False
    first = s.split()[0]
    if not first.isdigit():
        return False
    return bool(RE_COURSE.search(s))


def parse_line(line):
    """Parse one timetable text line into a dict keyed by FIELDS."""
    rec = {f: "" for f in FIELDS}
    s = line.rstrip()

    # 1) CRN = leading number.
    m = re.match(r"\s*(\d+)\s+(.*)$", s)
    if not m:
        return None
    rec["CRN"] = m.group(1)
    rest = m.group(2)

    # 2) LWE = an optional second pure-number token before the course code.
    parts = rest.split(None, 1)
    if parts and parts[0].isdigit():
        rec["LWE"] = parts[0]
        rest = parts[1] if len(parts) > 1 else ""

    # 3) Course code = first course-code-shaped token.
    cm = RE_COURSE.search(rest)
    if not cm:
        return None
    rec["Course Code"] = cm.group(1)
    after_code = rest[cm.end():]

    # 4) Email(s) at the far right (may be ';'-joined). Pull them off first.
    emails = RE_EMAIL.findall(after_code)
    if emails:
        rec["Instructor Email"] = ";".join(emails)
        after_code = after_code[: after_code.find(emails[0])]

    # 5) Type code (LEC/TUT/PRJ/SEM...) splits "title+sect+lang+flags" from "schedule".
    tm = RE_TYPE.search(after_code)
    if tm:
        rec["Type"] = tm.group(1)
        left = after_code[: tm.start()]
        right = after_code[tm.end():]
    else:
        left, right = after_code, ""

    # 6) LEFT block -> Course Title, Sect, Lang, STC/SVL flags.
    #    Tail tokens of the left block are: ... Sect Lang [STC] [SVL/SC/SO/Y]
    ltoks = left.split()
    flags = []
    while ltoks and RE_FLAG.match(ltoks[-1]):
        flags.insert(0, ltoks.pop())
    lang = ""
    if ltoks and RE_LANG.match(ltoks[-1]):
        lang = ltoks.pop()
    sect = ""
    if ltoks and ltoks[-1].isdigit():
        sect = ltoks.pop()
    rec["Sect"] = sect
    rec["Lang"] = lang
    rec["Course Title"] = " ".join(ltoks).strip()
    # Distribute flags: STC is its own column; the rest (SVL/SC/SO/Y) go to SVL.
    rec["STC"] = "STC" if "STC" in flags else ""
    svl = [f for f in flags if f != "STC"]
    rec["SVL"] = ";".join(svl)

    # 7) RIGHT block -> Day, Start, End, Venue.
    dm = RE_DAY.search(right)
    if dm:
        rec["Day"] = dm.group(1)
    tmt = RE_TIME.search(right)
    if tmt:
        rec["Start"], rec["End"] = tmt.group(1), tmt.group(2)
        venue = right[tmt.end():].strip()
        # Venue is the first remaining token; instructor name is the rest.
        vtoks = venue.split(None, 1)
        if vtoks:
            rec["Venue"] = vtoks[0]
            if len(vtoks) > 1:
                rec["Instructor Name"] = vtoks[1].strip()
    else:
        # No time (e.g. PRJ rows): whatever's left after Day is venue/instructor — usually empty.
        leftover = right
        if dm:
            leftover = right[dm.end():]
        leftover = leftover.strip()
        if leftover:
            vtoks = leftover.split(None, 1)
            rec["Venue"] = vtoks[0]
            if len(vtoks) > 1:
                rec["Instructor Name"] = vtoks[1].strip()

    # Clean stray whitespace runs.
    for k in rec:
        rec[k] = re.sub(r"\s{2,}", " ", rec[k]).strip()
    return rec


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        sys.exit(__doc__)

    pdf_path = sys.argv[1]
    if not os.path.isfile(pdf_path):
        sys.exit(f"Error: file not found: {pdf_path}")

    out_path = sys.argv[2] if len(sys.argv) > 2 else os.path.splitext(pdf_path)[0] + ".csv"

    text = extract_text(pdf_path)
    rows = []
    for line in text.splitlines():
        if any(sub in line for sub in SKIP_SUBSTR):
            continue
        if not is_data_line(line):
            continue
        rec = parse_line(line)
        if rec and rec["Course Code"]:
            rows.append(rec)

    with open(out_path, "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows)

    print(f"OK  {len(rows)} rows -> {out_path}")


if __name__ == "__main__":
    main()
