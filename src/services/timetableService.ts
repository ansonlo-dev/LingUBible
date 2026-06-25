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

// 🔧 When the CSV is uploaded to Appwrite Storage, swap each term's `csvUrl`
// for the file's public view URL, e.g.
// `${endpoint}/storage/buckets/<bucket>/files/<id>/view?project=<project>`.
export const TIMETABLE_CSV_URL = '/data/2024-T2.csv';

/** A selectable academic term, each backed by its own CSV export. */
export interface TimetableTerm {
  id: string;
  /** Display name shown as the timetable title (e.g. "2024–25 Term 2"). */
  name: string;
  /** Compact label for the dropdown trigger (e.g. "2425-T1", "2425-S"). */
  short: string;
  csvUrl: string;
  /** Summer terms split into two sequential sessions (1st / 2nd). */
  summer?: boolean;
}

// One entry per term. The dropdown is built from this list (it does NOT scan the
// data folder), so add a row here for every CSV you want to appear. Keep each
// term's `id` stable — it keys that term's saved timetable in localStorage.
export const TERMS: TimetableTerm[] = [
  { id: '2024-25-t1', name: '2024–25 Term 1', short: '2425-T1', csvUrl: '/data/2024-T1.csv' },
  { id: '2024-25-t2', name: '2024–25 Term 2', short: '2425-T2', csvUrl: '/data/2024-T2.csv' },
  { id: '2024-25-s', name: '2024–25 Summer Term', short: '2425-S', csvUrl: '/data/2024-S.csv', summer: true },
  { id: '2025-26-t1', name: '2025–26 Term 1', short: '2526-T1', csvUrl: '/data/2025-T1.csv' },
  { id: '2025-26-t2', name: '2025–26 Term 2', short: '2526-T2', csvUrl: '/data/2025-T2.csv' },
  { id: '2025-26-s', name: '2025–26 Summer Term', short: '2526-S', csvUrl: '/data/2025-S.csv', summer: true },
  { id: '2026-27-t1', name: '2026–27 Term 1', short: '2627-T1', csvUrl: '/data/2026-T1.csv' },
  { id: '2026-27-t2', name: '2026–27 Term 2', short: '2627-T2', csvUrl: '/data/2026-T2.csv' }

];

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
  /** Summer-term session: 1 (1st) or 2 (2nd); null for non-summer terms. */
  summerSession: number | null;
  /** Session date range (ISO "YYYY-MM-DD"), when the CSV provides it. */
  startDate?: string;
  endDate?: string;
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

/**
 * Parse a "Day" field into one or more normalised days. Handles a single day
 * ("TUE"/"Tuesday"), separated lists ("TUE/THU", "TUE,THU", "TUE THU") and
 * concatenated 3-letter codes with no separator ("TUETHU" → Tue + Thu).
 */
export function parseDays(raw: string): string[] {
  if (!raw) return [];
  const days: string[] = [];
  const add = (d: string) => { if (!days.includes(d)) days.push(d); };

  for (const part of raw.toUpperCase().split(/[\s,/&;+|-]+/).filter(Boolean)) {
    // Whole token is a known alias (e.g. "TUE", "TUESDAY").
    if (DAY_ALIASES[part]) { add(DAY_ALIASES[part]); continue; }
    // Otherwise try to read it as back-to-back 3-letter codes ("TUETHU").
    const chunks: string[] = [];
    let ok = part.length % 3 === 0 && part.length > 0;
    for (let i = 0; ok && i < part.length; i += 3) {
      const norm = DAY_ALIASES[part.slice(i, i + 3)];
      if (norm) chunks.push(norm);
      else ok = false;
    }
    if (ok) for (const d of chunks) add(d);
  }
  return days;
}

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

const sectionsCacheByUrl = new Map<string, TimetableSection[]>();
const inflightByUrl = new Map<string, Promise<TimetableSection[]>>();

/** Parse raw CSV text into grouped sections. Exported for testing/reuse. */
export function parseTimetableCsv(text: string): TimetableSection[] {
  // Strip BOM (real ﻿ or the visible mojibake variant from mis-decoded files).
  const cleaned = text.replace(/^﻿/, '').replace(/^ï»¿/, '');
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  // Resolve columns by header name so optional/extra columns (e.g. the summer
  // "Sesson" column present only in 2024-S.csv) don't shift the field mapping.
  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const ci = {
    sesson: col('sesson'),
    crn: col('crn'),
    courseCode: col('course code'),
    courseTitle: col('course title'),
    sect: col('sect'),
    lang: col('lang'),
    svl: col('svl'),
    type: col('type'),
    startDate: col('start date'),
    endDate: col('end date'),
    day: col('day'),
    start: col('start'),
    end: col('end'),
    venue: col('venue'),
    instructorName: col('instructor name'),
    instructorEmail: col('instructor email'),
  };

  // Parse a date into ISO "YYYY-MM-DD" (returns undefined if blank/unparseable).
  // Handles both formats seen across the term exports, with "/" or "-" separators:
  //   • day-first:  "27/05/2025" (DD/MM/YYYY)  — e.g. 2024-S.csv
  //   • year-first: "2026/5/26"  (YYYY/M/D)    — e.g. 2025-S.csv
  const parseDmy = (raw: string): string | undefined => {
    const s = (raw || '').trim();
    // Year-first: YYYY/MM/DD or YYYY-MM-DD.
    let m = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(s);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    // Day-first: DD/MM/YYYY or DD-MM-YYYY.
    m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return undefined;
  };

  const rows = lines.slice(1);
  const byKey = new Map<string, TimetableSection>();

  const parseSession = (raw: string): number | null => {
    const v = (raw || '').trim();
    if (/^1/.test(v)) return 1;
    if (/^2/.test(v)) return 2;
    return null;
  };

  for (const line of rows) {
    const cols = parseCsvLine(line);
    const at = (i: number) => (i >= 0 ? (cols[i] ?? '') : '');
    const crn = at(ci.crn);
    const courseCode = at(ci.courseCode);
    const courseTitle = at(ci.courseTitle);
    const sect = at(ci.sect);
    const lang = at(ci.lang);
    const svl = at(ci.svl);
    const type = at(ci.type);
    const day = at(ci.day);
    const start = at(ci.start);
    const end = at(ci.end);
    const venue = at(ci.venue);
    const instructorName = at(ci.instructorName);
    const instructorEmail = at(ci.instructorEmail);
    const summerSession = parseSession(at(ci.sesson));
    const startDate = parseDmy(at(ci.startDate));
    const endDate = parseDmy(at(ci.endDate));
    if (!courseCode) continue;

    // Sessions are distinct timetables, so the key must include the session.
    const key = `${summerSession ? `S${summerSession}-` : ''}${crn || `${courseCode}-${sect}`}`;
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
        summerSession,
        startDate,
        endDate,
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

    const startMin = toMinutes(start || '');
    const endMin = toMinutes(end || '');
    if (startMin != null && endMin != null) {
      // A row may list several days (e.g. "TUETHU") → one meeting per day.
      for (const normalisedDay of parseDays(day || '')) {
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

/** Fetch + parse a term's timetable CSV. Result is cached per-URL for the session. */
export async function loadTimetableSections(url: string = TIMETABLE_CSV_URL): Promise<TimetableSection[]> {
  const cached = sectionsCacheByUrl.get(url);
  if (cached) return cached;
  const existing = inflightByUrl.get(url);
  if (existing) return existing;

  const promise = (async () => {
    // `no-cache` = always revalidate with the server (cheap 304 when unchanged),
    // so an updated CSV is picked up instead of a stale browser-cached copy.
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`Failed to load timetable data (${res.status})`);
    }
    const text = await res.text();
    const sections = parseTimetableCsv(text);
    sectionsCacheByUrl.set(url, sections);
    inflightByUrl.delete(url);
    return sections;
  })();

  inflightByUrl.set(url, promise);
  try {
    return await promise;
  } catch (err) {
    inflightByUrl.delete(url);
    throw err;
  }
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number) => {
    const color = lN - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Auto-assign a visually distinct colour by position. Uses the golden-angle
 * hue rotation so consecutively-added sections never get similar colours,
 * regardless of how many are selected. Returned as hex (so it works directly
 * with a native colour picker).
 */
export function colorForIndex(index: number): string {
  const hue = (index * 137.508) % 360;
  return hslToHex(hue, 62, 42);
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

// ── Venue helpers ───────────────────────────────────────────────────────────
// Venue codes are a building prefix + a room (e.g. "LKK306", "LKKG01", "MB202",
// "LCHUG14"). Rooms may start with a floor code (B basement, LG lower-ground,
// G ground, UG upper-ground) before the room number.

const FLOOR_CODES = ['UG', 'LG', 'G', 'B'];

/**
 * Split a venue code into its building prefix and room part.
 *   "LKK306"  → { building: "LKK", room: "306" }
 *   "LKKG01"  → { building: "LKK", room: "G01" }
 *   "LCHUG14" → { building: "LCH", room: "UG14" }
 *   "MB202"   → { building: "MB",  room: "202" }   (B not stripped: too short)
 */
export function splitVenue(code: string): { building: string; room: string } {
  const m = /^([A-Za-z]+)(.*)$/.exec((code || '').trim());
  if (!m) return { building: '', room: (code || '').trim() };
  let building = m[1].toUpperCase();
  let room = m[2];
  // A trailing floor code belongs to the room, not the building — but only move
  // it if ≥2 building letters remain (so "MB202" stays MB+202, not M+B202).
  for (const fc of FLOOR_CODES) {
    if (building.length - fc.length >= 2 && building.endsWith(fc)) {
      room = fc + room;
      building = building.slice(0, -fc.length);
      break;
    }
  }
  return { building, room };
}

/** A natural sort key for a room: [floorRank, number, suffix]. */
function roomSortKey(room: string): [number, number, string] {
  const m = /^(UG|LG|G|B)?0*(\d+)?(.*)$/i.exec(room.trim());
  const floor = (m?.[1] || '').toUpperCase();
  const floorRank = floor === 'B' ? 0 : floor === 'LG' ? 1 : floor === 'G' ? 2 : floor === 'UG' ? 3 : 4;
  const num = m?.[2] != null ? parseInt(m[2], 10) : -1;
  return [floorRank, num, (m?.[3] || '').toUpperCase()];
}

/** True if a code looks like a real room (has a building prefix and a digit). */
export function isRoomCode(code: string): boolean {
  const { building, room } = splitVenue(code);
  return building.length >= 2 && /\d/.test(room);
}

/** Extract individual room codes from a meeting's raw venue string. */
export function parseVenueRooms(raw: string): string[] {
  if (!raw) return [];
  return raw.split(/[\/,;]+/).map((s) => s.trim()).filter(Boolean);
}

/** Group venue codes by building, rooms naturally ordered within each building. */
export function groupVenues(codes: Iterable<string>): { building: string; rooms: string[] }[] {
  const byBuilding = new Map<string, Set<string>>();
  for (const code of codes) {
    if (!isRoomCode(code)) continue;
    const { building } = splitVenue(code);
    if (!byBuilding.has(building)) byBuilding.set(building, new Set());
    byBuilding.get(building)!.add(code);
  }
  return [...byBuilding.entries()]
    .map(([building, set]) => ({
      building,
      rooms: [...set].sort((a, b) => {
        const ka = roomSortKey(splitVenue(a).room);
        const kb = roomSortKey(splitVenue(b).room);
        return ka[0] - kb[0] || ka[1] - kb[1] || ka[2].localeCompare(kb[2]) || a.localeCompare(b);
      }),
    }))
    .sort((a, b) => a.building.localeCompare(b.building));
}
