/**
 * Shareable Lesson Planner links.
 *
 * A shared link carries the *term* plus the section ids (CRNs) the sender has
 * added to that term's timetable, e.g.
 *
 *   https://www.lingubible.com/planner?term=2025-26-t2&sections=12345.12678.S1-9021
 *
 * Section ids are only unique within a term (CRNs are reused across terms), so
 * the term id is always part of the link. Ids are joined with "." because it is
 * an unreserved URL character — the query string stays readable and short even
 * for a full 5-course timetable.
 *
 * The receiving planner *merges* these sections into whatever the viewer has
 * already picked for that term; it never clears or replaces their timetable.
 */
import { TERMS } from './timetableService';

export const SHARE_TERM_PARAM = 'term';
export const SHARE_SECTIONS_PARAM = 'sections';

const SEPARATOR = '.';
/** Guards against absurdly long/crafted links; a real timetable is ~10 sections. */
const MAX_SHARED_SECTIONS = 60;
/** Section ids are CRNs ("12345"), summer-prefixed CRNs ("S1-12345") or "CODE-SECT". */
const SECTION_ID_PATTERN = /^[A-Za-z0-9-]{1,32}$/;

export interface PlannerShare {
  termId: string;
  sectionIds: string[];
}

/** Drop blanks/duplicates/malformed ids and cap the count, preserving order. */
function sanitiseSectionIds(ids: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    const id = (raw ?? '').trim();
    if (!id || seen.has(id) || !SECTION_ID_PATTERN.test(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_SHARED_SECTIONS) break;
  }
  return out;
}

/**
 * Build the absolute link to share. Returns the bare planner URL when there is
 * nothing selected, so the share button always produces something usable.
 */
export function buildPlannerShareUrl(baseUrl: string, termId: string, sectionIds: string[]): string {
  const root = `${baseUrl.replace(/\/$/, '')}/planner`;
  const ids = sanitiseSectionIds(sectionIds);
  if (ids.length === 0 || !TERMS.some((tm) => tm.id === termId)) return root;
  // Hand-built rather than URLSearchParams: every character used here is
  // unreserved, and this keeps the "." separators literal instead of %2E-ish
  // escapes in some consumers.
  return `${root}?${SHARE_TERM_PARAM}=${encodeURIComponent(termId)}&${SHARE_SECTIONS_PARAM}=${ids.join(SEPARATOR)}`;
}

/**
 * Read a shared timetable out of a location search string. Returns null when the
 * link carries no share, names an unknown term, or lists no usable section id.
 */
export function parsePlannerShare(search: string): PlannerShare | null {
  if (!search) return null;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return null;
  }
  const termId = (params.get(SHARE_TERM_PARAM) ?? '').trim();
  const rawSections = params.get(SHARE_SECTIONS_PARAM) ?? '';
  if (!termId || !rawSections) return null;
  if (!TERMS.some((tm) => tm.id === termId)) return null;
  const sectionIds = sanitiseSectionIds(rawSections.split(SEPARATOR));
  if (sectionIds.length === 0) return null;
  return { termId, sectionIds };
}

/** Stable key for "this exact share has already been handled". */
export function plannerShareKey(share: PlannerShare): string {
  return `${share.termId}|${share.sectionIds.join(SEPARATOR)}`;
}
