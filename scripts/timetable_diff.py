#!/usr/bin/env python3
"""
timetable_diff — Compare two Lingnan University term timetable PDFs (or CSVs
already produced by timetable2csv) and report exactly what changed between
them: sections added, sections removed, and sections whose day/time/venue/
instructor/etc. changed.

Usage:
    ./timetable_diff.py OLD.pdf NEW.pdf [-o OUTDIR]
    ./timetable_diff.py OLD.csv NEW.csv [-o OUTDIR]   (mix and match is fine)

Outputs (written to OUTDIR, default: current directory):
    old.csv           - full CSV of OLD (only produced if input was a PDF)
    new.csv           - full CSV of NEW (only produced if input was a PDF)
    diff_report.txt   - human-readable summary of every change
    diff.csv          - machine-readable change list (one row per change)

Requires: poppler-utils (pdftotext) if given PDFs. No Python packages needed.

--- How the comparison works -----------------------------------------------
A raw text/line diff of two timetable PDFs is nearly useless: pdftotext's
column spacing shifts a little between runs/versions even when nothing
meaningful changed, so almost every line would look "different". Instead,
this script re-uses timetable2csv's own line parser to turn each PDF into
structured rows (CRN, Course Code, Day, Time, Venue, Instructor, ...), then
diffs the *rows*:

  1. Rows that are byte-for-byte identical in both files (every field, incl.
     instructor) are matched first and considered unchanged.
  2. Among what's left, rows are matched on a "slot key" of everything
     EXCEPT Instructor Name/Email (CRN, Course Code, Title, Sect, Lang,
     STC/SVL, Type, Day, Start, End, Venue). A match here with a different
     instructor is reported as a "Modified" row (instructor change).
  3. Anything still unmatched only exists in OLD -> "Removed"; anything
     only in NEW -> "Added".

This correctly reports e.g. "CRN 99 CCC8011 sect 1: instructor changed from
TBA to DE CLERCQ Rafael E. P." instead of noise from re-wrapped spacing.
"""

import csv
import os
import re
import subprocess
import sys
import argparse
from collections import Counter, defaultdict

# ----- Column layout of the output CSV (identical to timetable2csv.sh) ------
FIELDS = [
    "CRN", "LWE", "Course Code", "Course Title", "Sect", "Lang",
    "STC", "SVL", "Type", "Day", "Start", "End", "Venue",
    "Instructor Name", "Instructor Email",
]

# Fields that identify "the same scheduled slot" -- everything except who
# teaches it. A change limited to these fields (day/time/venue/etc.) with the
# SAME instructor is still reported as Modified; a change limited to
# Instructor Name/Email is also Modified. Only rows unmatched on this key are
# Added/Removed.
SLOT_FIELDS = [
    "CRN", "LWE", "Course Code", "Course Title", "Sect", "Lang",
    "STC", "SVL", "Type", "Day", "Start", "End", "Venue",
]
INSTRUCTOR_FIELDS = ["Instructor Name", "Instructor Email"]

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
        vtoks = venue.split(None, 1)
        if vtoks:
            rec["Venue"] = vtoks[0]
            if len(vtoks) > 1:
                rec["Instructor Name"] = vtoks[1].strip()
    else:
        leftover = right
        if dm:
            leftover = right[dm.end():]
        leftover = leftover.strip()
        if leftover:
            vtoks = leftover.split(None, 1)
            rec["Venue"] = vtoks[0]
            if len(vtoks) > 1:
                rec["Instructor Name"] = vtoks[1].strip()

    for k in rec:
        rec[k] = re.sub(r"\s{2,}", " ", rec[k]).strip()
    return rec


def pdf_to_rows(pdf_path):
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
    return rows


def csv_to_rows(csv_path):
    rows = []
    with open(csv_path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            rows.append({f: row.get(f, "") for f in FIELDS})
    return rows


def load_rows(path):
    if path.lower().endswith(".csv"):
        return csv_to_rows(path), False
    return pdf_to_rows(path), True


def write_csv(rows, out_path):
    with open(out_path, "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows)


def row_tuple(rec, fields):
    return tuple(rec[f] for f in fields)


def diff_rows(old_rows, new_rows):
    """Returns (modified, added, removed, unchanged_count).

    modified: list of (old_rec, new_rec) pairs -- same slot, some field(s) differ
    added:    list of new_rec -- no matching slot in old
    removed:  list of old_rec -- no matching slot in new
    """
    # Pass 1: exact full-row matches (multiset), these are unchanged.
    old_full = Counter(row_tuple(r, FIELDS) for r in old_rows)
    new_full = Counter(row_tuple(r, FIELDS) for r in new_rows)
    common_full = old_full & new_full
    unchanged_count = sum(common_full.values())

    remaining_old_need = old_full - common_full
    remaining_new_need = new_full - common_full

    def expand(rows, need_counter):
        need = dict(need_counter)
        out = []
        for r in rows:
            key = row_tuple(r, FIELDS)
            if need.get(key, 0) > 0:
                out.append(r)
                need[key] -= 1
        return out

    remaining_old = expand(old_rows, remaining_old_need)
    remaining_new = expand(new_rows, remaining_new_need)

    # Pass 2: match remaining rows on slot key (ignoring instructor).
    old_by_slot = defaultdict(list)
    for r in remaining_old:
        old_by_slot[row_tuple(r, SLOT_FIELDS)].append(r)
    new_by_slot = defaultdict(list)
    for r in remaining_new:
        new_by_slot[row_tuple(r, SLOT_FIELDS)].append(r)

    modified, added, removed = [], [], []
    for key in set(old_by_slot) | set(new_by_slot):
        olds = old_by_slot.get(key, [])
        news = new_by_slot.get(key, [])
        n = min(len(olds), len(news))
        for i in range(n):
            modified.append((olds[i], news[i]))
        for r in olds[n:]:
            removed.append(r)
        for r in news[n:]:
            added.append(r)

    return modified, added, removed, unchanged_count


def describe_slot(rec):
    parts = [f"{rec['Course Code']}"]
    if rec["Course Title"]:
        parts.append(rec["Course Title"])
    tail = []
    if rec["Sect"]:
        tail.append(f"Sect {rec['Sect']}")
    if rec["Type"]:
        tail.append(rec["Type"])
    if rec["Day"] or rec["Start"]:
        tail.append(f"{rec['Day']} {rec['Start']}-{rec['End']}".strip())
    if rec["Venue"]:
        tail.append(rec["Venue"])
    if tail:
        parts.append("(" + ", ".join(tail) + ")")
    return " ".join(parts)


def changed_fields(old_rec, new_rec):
    return [f for f in FIELDS if f not in ("CRN",) and old_rec[f] != new_rec[f]]


def write_report(modified, added, removed, unchanged_count, old_path, new_path, report_path):
    lines = []
    lines.append(f"Timetable diff: {old_path}  ->  {new_path}")
    lines.append("=" * 70)
    lines.append(f"Unchanged rows: {unchanged_count}")
    lines.append(f"Modified rows:  {len(modified)}")
    lines.append(f"Added rows:     {len(added)}")
    lines.append(f"Removed rows:   {len(removed)}")
    lines.append("")

    if modified:
        lines.append(f"--- MODIFIED ({len(modified)}) ---")
        for old_rec, new_rec in sorted(modified, key=lambda p: (p[0]["Course Code"], p[0]["CRN"])):
            lines.append(f"CRN {old_rec['CRN']}  {describe_slot(old_rec)}")
            for f in changed_fields(old_rec, new_rec):
                lines.append(f"    {f}: {old_rec[f] or '(blank)'}  ->  {new_rec[f] or '(blank)'}")
        lines.append("")

    if added:
        lines.append(f"--- ADDED ({len(added)}) ---")
        for rec in sorted(added, key=lambda r: (r["Course Code"], r["CRN"])):
            who = rec["Instructor Name"] or "(no instructor listed)"
            lines.append(f"CRN {rec['CRN']}  {describe_slot(rec)} - {who}")
        lines.append("")

    if removed:
        lines.append(f"--- REMOVED ({len(removed)}) ---")
        for rec in sorted(removed, key=lambda r: (r["Course Code"], r["CRN"])):
            who = rec["Instructor Name"] or "(no instructor listed)"
            lines.append(f"CRN {rec['CRN']}  {describe_slot(rec)} - {who}")
        lines.append("")

    if not (modified or added or removed):
        lines.append("No differences found - the two timetables are identical.")

    text = "\n".join(lines)
    with open(report_path, "w", encoding="utf-8") as fh:
        fh.write(text + "\n")
    return text


def write_diff_csv(modified, added, removed, diff_csv_path):
    header = ["Change Type", "CRN"] + [f for f in FIELDS if f != "CRN"] + \
             [f"Old {f}" for f in FIELDS if f not in ("CRN",)]
    with open(diff_csv_path, "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh)
        w.writerow(header)
        for old_rec, new_rec in modified:
            row = ["Modified", new_rec["CRN"]] + [new_rec[f] for f in FIELDS if f != "CRN"] + \
                  [old_rec[f] for f in FIELDS if f != "CRN"]
            w.writerow(row)
        for rec in added:
            row = ["Added", rec["CRN"]] + [rec[f] for f in FIELDS if f != "CRN"] + \
                  ["" for f in FIELDS if f != "CRN"]
            w.writerow(row)
        for rec in removed:
            row = ["Removed", rec["CRN"]] + ["" for f in FIELDS if f != "CRN"] + \
                  [rec[f] for f in FIELDS if f != "CRN"]
            w.writerow(row)


def main():
    ap = argparse.ArgumentParser(description="Diff two Lingnan timetable PDFs (or CSVs).")
    ap.add_argument("old", help="path to the OLD timetable (.pdf or .csv)")
    ap.add_argument("new", help="path to the NEW timetable (.pdf or .csv)")
    ap.add_argument("-o", "--outdir", default=".", help="directory to write outputs to (default: current dir)")
    args = ap.parse_args()

    os.makedirs(args.outdir, exist_ok=True)

    old_rows, old_was_pdf = load_rows(args.old)
    new_rows, new_was_pdf = load_rows(args.new)

    if old_was_pdf:
        write_csv(old_rows, os.path.join(args.outdir, "old.csv"))
    if new_was_pdf:
        write_csv(new_rows, os.path.join(args.outdir, "new.csv"))

    modified, added, removed, unchanged_count = diff_rows(old_rows, new_rows)

    report_path = os.path.join(args.outdir, "diff_report.txt")
    diff_csv_path = os.path.join(args.outdir, "diff.csv")

    report_text = write_report(modified, added, removed, unchanged_count, args.old, args.new, report_path)
    write_diff_csv(modified, added, removed, diff_csv_path)

    print(report_text)
    print()
    print(f"(written: {report_path}, {diff_csv_path})")


if __name__ == "__main__":
    main()
