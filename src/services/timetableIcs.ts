import type { TimetableSection } from './timetableService';

// iCalendar (.ics) export for a selected timetable. Each meeting becomes a weekly
// recurring all-term event (RRULE) between the user-chosen start and end dates.
// Lingnan is in Hong Kong (UTC+8, no DST), so events carry an Asia/Hong_Kong
// TZID with a self-contained VTIMEZONE for correctness in every calendar app.

const BYDAY: Record<string, string> = {
  MON: 'MO', TUE: 'TU', WED: 'WE', THU: 'TH', FRI: 'FR', SAT: 'SA', SUN: 'SU',
};
const JS_DOW: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Escape a text value per RFC 5545 (backslash, semicolon, comma, newline). */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Fold a content line at 75 chars; continuation lines start with a single space. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  let out = line.slice(0, 75);
  let rest = line.slice(75);
  while (rest.length > 0) {
    out += '\r\n ' + rest.slice(0, 74);
    rest = rest.slice(74);
  }
  return out;
}

/** "YYYY-MM-DD" + weekday → the first matching date on/after it, as "YYYYMMDD". */
function firstOccurrence(startYmd: string, day: string): string {
  const [y, m, d] = startYmd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const offset = (JS_DOW[day] - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
}

/** Minutes from midnight → "HHMMSS". */
function hms(minutes: number): string {
  return `${pad2(Math.floor(minutes / 60))}${pad2(minutes % 60)}00`;
}

function nowStamp(): string {
  const d = new Date();
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  );
}

/**
 * Build a full .ics document for the given selected sections.
 * @param startYmd / endYmd  "YYYY-MM-DD" bounds of the recurring events.
 */
export function buildTimetableIcs(
  sections: TimetableSection[],
  startYmd: string,
  endYmd: string,
  calendarName?: string,
): string {
  const lines: string[] = [];
  const push = (line: string) => lines.push(fold(line));

  push('BEGIN:VCALENDAR');
  push('VERSION:2.0');
  push('PRODID:-//LingUBible//Timetable//EN');
  push('CALSCALE:GREGORIAN');
  push('METHOD:PUBLISH');
  if (calendarName) push(`X-WR-CALNAME:${escapeText(calendarName)}`);
  push('X-WR-TIMEZONE:Asia/Hong_Kong');

  push('BEGIN:VTIMEZONE');
  push('TZID:Asia/Hong_Kong');
  push('BEGIN:STANDARD');
  push('DTSTART:19700101T000000');
  push('TZOFFSETFROM:+0800');
  push('TZOFFSETTO:+0800');
  push('TZNAME:HKT');
  push('END:STANDARD');
  push('END:VTIMEZONE');

  const stamp = nowStamp();
  const until = `${endYmd.replace(/-/g, '')}T235959Z`;

  for (const s of sections) {
    // Merge meetings sharing the same day + time (different venues) into one event.
    const groups = new Map<
      string,
      { day: string; startMinutes: number; endMinutes: number; type: string; venues: string[] }
    >();
    for (const m of s.meetings) {
      const key = `${m.day}-${m.start}-${m.end}`;
      const g = groups.get(key);
      if (g) {
        if (m.venue && !g.venues.includes(m.venue)) g.venues.push(m.venue);
      } else {
        groups.set(key, {
          day: m.day,
          startMinutes: m.startMinutes,
          endMinutes: m.endMinutes,
          type: m.type,
          venues: m.venue ? [m.venue] : [],
        });
      }
    }

    let idx = 0;
    for (const g of groups.values()) {
      const date = firstOccurrence(startYmd, g.day);
      const venues = g.venues.join(', ');
      const description = [
        `${s.courseCode} ${s.courseTitle}`,
        g.type ? `Type: ${g.type}${s.section ? ` (Section ${s.section})` : ''}` : '',
        s.instructors.length ? `Instructor: ${s.instructors.join(', ')}` : '',
        venues ? `Venue: ${venues}` : '',
        s.crn ? `CRN: ${s.crn}` : '',
      ].filter(Boolean).join('\n');

      push('BEGIN:VEVENT');
      push(`UID:${(s.crn || s.id)}-${g.day}-${hms(g.startMinutes)}-${idx}@lingubible.com`);
      push(`DTSTAMP:${stamp}`);
      push(`DTSTART;TZID=Asia/Hong_Kong:${date}T${hms(g.startMinutes)}`);
      // endMinutes is the inclusive last minute (e.g. 16:29) — add 1 for the real end.
      push(`DTEND;TZID=Asia/Hong_Kong:${date}T${hms(g.endMinutes + 1)}`);
      push(`RRULE:FREQ=WEEKLY;UNTIL=${until};BYDAY=${BYDAY[g.day]}`);
      push(`SUMMARY:${escapeText(`${s.courseCode} ${s.courseTitle}`)}`);
      if (venues) push(`LOCATION:${escapeText(venues)}`);
      push(`DESCRIPTION:${escapeText(description)}`);
      push('END:VEVENT');
      idx++;
    }
  }

  push('END:VCALENDAR');
  return lines.join('\r\n');
}
