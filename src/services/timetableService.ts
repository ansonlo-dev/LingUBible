/**
 * TimetableService
 *
 * Loads the term teaching records from a CSV file and exposes them as
 * structured, grouped "sections" for the Timetable planner page.
 *
 * IMPORTANT: This intentionally does NOT touch the Appwrite database. The CSV
 * is a slow-changing, term-level export. Today it is bundled in `public/data/`,
 * but the intended source is Appwrite Storage — when the file is uploaded there,
 * only `TIMETABLE_CSV_URL` needs to change (e.g. to the storage file's view URL).
 *
 * The fetch result is cached in-memory for the lifetime of the page session
 * (passive: fetched once on demand, never background-refreshed).
 */

// 🔧 When the CSV is uploaded to Appwrite Storage, swap this for the file's
// public view URL, e.g. `${endpoint}/storage/buckets/<bucket>/files/<id>/view?project=<project>`.
export const TIMETABLE_CSV_URL = '/data/timetable.csv';

/** A single scheduled meeting (one day/time/venue) of a section. */
export interface TimetableMeeting {
  day: string;          // normalised: MON, TUE, WED, THU, FRI, SAT, SUN
  startMinutes: number; // minutes from 00:00, e.g. 13:30 → 810
  endMinutes: number;   // inclusive end as given (e.g. 16:29 → 989); render adds 1
  start: string;        // "13:30"
  end: string;          // "16:29"
  venue: string;
  type: string;         // LEC, TUT, PRJ, ...
}

/** One teaching section (grouped by CRN), with all of its meetings. */
export interface TimetableSection {
  id: string;             // unique key (CRN, or a fallback composite)
  crn: string;
  courseCode: string;
  courseTitle: string;
  section: string;        // "Sect" column
  language: string;       // "Lang" column code (E/C/P/1..5)
  serviceLearning: string;// "SVL" column (SC/SO/Y/...)
  types: string[];        // distinct meeting types, e.g. ["LEC"] or ["LEC","TUT"]
  instructors: string[];  // split on " / "
  instructorEmails: string[];
  meetings: TimetableMeeting[];
}

export const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const DAY_ALIASES: Record<string, string> = {
  MON: 'MON', MONDAY: 'MON',
  TUE: 'TUE', TUES: 'TUE', TUESDAY: 'TUE',
  WED: 'WED', WEDNESDAY: 'WED',
  THU: 'THU', THUR: 'THU', THURS: 'THU', THURSDAY: 'THU',
  FRI: 'FRI', FRIDAY: 'FRI',
  SAT: 'SAT', SATURDAY: 'SAT',
  SUN: 'SUN', SUNDAY: 'SUN',
};

/** Parse a single CSV line, honouring double-quoted fields that contain commas. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; } // escaped quote
        else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out.map((f) => f.trim());
}

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  return h * 60 + min;
}

let sectionsCache: TimetableSection[] | null = null;
let inflight: Promise<TimetableSection[]> | null = null;

/** Parse raw CSV text into grouped sections. Exported for testing/reuse. */
export function parseTimetableCsv(text: string): TimetableSection[] {
  // Strip BOM (real ﻿ or the visible mojibake variant from mis-decoded files).
  const cleaned = text.replace(/^﻿/, '').replace(/^ï»¿/, '');
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  // Drop the header row.
  const rows = lines.slice(1);
  const byKey = new Map<string, TimetableSection>();

  for (const line of rows) {
    const cols = parseCsvLine(line);
    // CRN,LWE,Course Code,Course Title,Sect,Lang,STC,SVL,Type,Day,Start,End,Venue,Instructor Name,Instructor Email
    const [crn, , courseCode, courseTitle, sect, lang, , svl, type, day, start, end, venue, instructorName, instructorEmail] = cols;
    if (!courseCode) continue;

    const key = `${crn || `${courseCode}-${sect}`}`;
    let section = byKey.get(key);
    if (!section) {
      section = {
        id: key,
        crn: crn || '',
        courseCode: courseCode.toUpperCase(),
        courseTitle: courseTitle || '',
        section: sect || '',
        language: lang || '',
        serviceLearning: svl || '',
        types: [],
        instructors: [],
        instructorEmails: [],
        meetings: [],
      };
      byKey.set(key, section);
    }

    if (type && !section.types.includes(type)) section.types.push(type);

    // Instructors can be combined with " / " and emails with ";".
    if (instructorName) {
      for (const name of instructorName.split('/').map((s) => s.trim()).filter(Boolean)) {
        if (!section.instructors.includes(name)) section.instructors.push(name);
      }
    }
    if (instructorEmail) {
      for (const email of instructorEmail.split(';').map((s) => s.trim()).filter(Boolean)) {
        if (!section.instructorEmails.includes(email)) section.instructorEmails.push(email);
      }
    }

    const normalisedDay = DAY_ALIASES[(day || '').toUpperCase()];
    const startMin = toMinutes(start || '');
    const endMin = toMinutes(end || '');
    if (normalisedDay && startMin != null && endMin != null) {
      const exists = section.meetings.some(
        (mt) => mt.day === normalisedDay && mt.startMinutes === startMin && mt.endMinutes === endMin && mt.venue === (venue || ''),
      );
      if (!exists) {
        section.meetings.push({
          day: normalisedDay,
          startMinutes: startMin,
          endMinutes: endMin,
          start: start.trim(),
          end: end.trim(),
          venue: venue || '',
          type: type || '',
        });
      }
    }
  }

  const sections = Array.from(byKey.values());
  // Stable, human-friendly ordering: by course code, then section number.
  sections.sort((a, b) => {
    if (a.courseCode !== b.courseCode) return a.courseCode.localeCompare(b.courseCode);
    const sa = parseInt(a.section, 10);
    const sb = parseInt(b.section, 10);
    if (!Number.isNaN(sa) && !Number.isNaN(sb)) return sa - sb;
    return a.section.localeCompare(b.section);
  });
  return sections;
}

/** Fetch + parse the timetable CSV. Result is cached for the session. */
export async function loadTimetableSections(): Promise<TimetableSection[]> {
  if (sectionsCache) return sectionsCache;
  if (inflight) return inflight;

  inflight = (async () => {
    const res = await fetch(TIMETABLE_CSV_URL, { cache: 'force-cache' });
    if (!res.ok) {
      throw new Error(`Failed to load timetable data (${res.status})`);
    }
    const text = await res.text();
    const sections = parseTimetableCsv(text);
    sectionsCache = sections;
    inflight = null;
    return sections;
  })();

  try {
    return await inflight;
  } catch (err) {
    inflight = null;
    throw err;
  }
}

/** True if two meetings overlap in time on the same day. */
export function meetingsOverlap(a: TimetableMeeting, b: TimetableMeeting): boolean {
  if (a.day !== b.day) return false;
  // End is inclusive-minute (16:29 == until 16:30), so compare with +1.
  const aEnd = a.endMinutes + 1;
  const bEnd = b.endMinutes + 1;
  return a.startMinutes < bEnd && b.startMinutes < aEnd;
}

/** Find all clashing pairs among the given sections (by id). */
export function findConflicts(sections: TimetableSection[]): Set<string> {
  const conflicting = new Set<string>();
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      const a = sections[i];
      const b = sections[j];
      const clash = a.meetings.some((ma) => b.meetings.some((mb) => meetingsOverlap(ma, mb)));
      if (clash) {
        conflicting.add(a.id);
        conflicting.add(b.id);
      }
    }
  }
  return conflicting;
}
