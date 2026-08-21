/**
 * 課程「指定 / 建議閱讀書目」（courses.readings）的解析、分類與外部連結。
 *
 * 資料格式：`readings` 欄位存放一段 JSON 字串，內容是
 * `[{ TYPE, FULL_NAME, SOURCE }, ...]`：
 * - `TYPE`   — `required/essential`（必讀）或 `supplementary/recommended`（選讀）
 * - `FULL_NAME` — 完整書目描述（作者、書名、版次、出版社…）
 * - `SOURCE` — 若是網上資源就是網址，否則是可用來搜尋該書的關鍵字串
 *
 * 分類規則（依照 SOURCE）：
 * - 不是網址 → 書籍（Books）
 * - 是 doi.org 網址 → 論文及期刊（Articles / Thesis）
 * - 其餘網址 → 網頁（Websites）
 */

/** 閱讀資料的分組：必讀 / 選讀 */
export type ReadingGroup = 'required' | 'supplementary';

/** 閱讀資料的種類：書籍 / 論文及期刊 / 網頁 */
export type ReadingKind = 'book' | 'article' | 'website';

export interface CourseReading {
  group: ReadingGroup;
  kind: ReadingKind;
  /** 完整書目描述（SOURCE 缺 FULL_NAME 時退回 SOURCE） */
  fullName: string;
  /** 原始 SOURCE 欄位 */
  source: string;
  /** kind 為 website / article 時的正規化網址（補上 https://） */
  url?: string;
  /** kind 為 article 時的 DOI，例如 10.1007/s11301-020-00181-x */
  doi?: string;
}

/** 有 scheme 的網址 */
const URL_WITH_SCHEME = /^https?:\/\//i;
/** 沒有 scheme 但明顯是網址，例如 www.hkicpa.org.hk/... */
const BARE_WWW_URL = /^www\.[^\s]+\.[^\s]/i;
/** doi.org（含 dx.doi.org / www.doi.org），取出後面的 DOI */
const DOI_URL = /^https?:\/\/(?:www\.|dx\.)?doi\.org\/(.+)$/i;
/** 嶺南圖書館的 DOI 代理網址，例如 https://doi-org.lingnan.idm.oclc.org/10.1080/... */
const DOI_PROXY_URL = /^https?:\/\/doi-org(?:[.-][a-z0-9-]+)*\.oclc\.org\/(.+)$/i;

/** Anna's Archive 域名 — 中文介面走 tw. 子網域 */
const ANNAS_ARCHIVE_DOMAIN = 'annas-archive.pk';

const classifySource = (source: string): Pick<CourseReading, 'kind' | 'url' | 'doi'> => {
  if (!source) return { kind: 'book' };

  const hasScheme = URL_WITH_SCHEME.test(source);
  if (!hasScheme && !BARE_WWW_URL.test(source)) return { kind: 'book' };

  const url = hasScheme ? source : `https://${source}`;
  const doiMatch = url.match(DOI_URL) || url.match(DOI_PROXY_URL);
  if (doiMatch) {
    const doi = doiMatch[1].trim().replace(/\/+$/, '');
    if (doi) return { kind: 'article', url, doi };
  }
  return { kind: 'website', url };
};

/**
 * 把 `courses.readings` 的 JSON 字串解析成閱讀清單。
 * 欄位為空、不是合法 JSON 或不是陣列時一律回傳空陣列（頁面據此隱藏分頁）。
 */
export const parseCourseReadings = (raw?: string | null): CourseReading[] => {
  if (!raw || typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'null' || trimmed === '[]') return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    console.warn('Failed to parse course readings JSON');
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const readings: CourseReading[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    const fullName = String(entry.FULL_NAME ?? '').trim();
    const source = String(entry.SOURCE ?? '').trim();
    if (!fullName && !source) continue;

    const type = String(entry.TYPE ?? '').toLowerCase();
    const group: ReadingGroup =
      type.includes('required') || type.includes('essential') ? 'required' : 'supplementary';

    readings.push({
      group,
      fullName: fullName || source,
      source,
      ...classifySource(source),
    });
  }
  return readings;
};

/** 依站台語言取得 Anna's Archive 域名（繁 / 簡中介面使用 tw. 子網域） */
export const getAnnasArchiveDomain = (language: string): string =>
  language === 'zh-TW' || language === 'zh-CN'
    ? `tw.${ANNAS_ARCHIVE_DOMAIN}`
    : ANNAS_ARCHIVE_DOMAIN;

/**
 * 取得該筆閱讀資料的外部連結：
 * - 書籍 → Anna's Archive 搜尋頁
 * - 論文及期刊 → Anna's Archive SciDB（以 DOI 定位）
 * - 網頁 → 原始網址
 */
export const getReadingLink = (reading: CourseReading, language: string): string => {
  if (reading.kind === 'website' && reading.url) return reading.url;

  const domain = getAnnasArchiveDomain(language);
  if (reading.kind === 'article' && reading.doi) {
    // DOI 內的斜線是路徑的一部分，不能整段編碼
    const doiPath = reading.doi.split('/').map(encodeURIComponent).join('/');
    return `https://${domain}/scidb/${doiPath}`;
  }
  return `https://${domain}/search?q=${encodeURIComponent(reading.source || reading.fullName)}`;
};
