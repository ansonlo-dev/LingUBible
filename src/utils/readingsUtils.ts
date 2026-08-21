/**
 * 課程「指定 / 建議閱讀書目」（courses.readings）的解析、分類與外部連結。
 *
 * 資料格式：`readings` 欄位存放一段 JSON 字串，內容是
 * `[{ TYPE, FULL_NAME, SOURCE }, ...]`：
 * - `TYPE`   — `required/essential`（必讀）或 `supplementary/recommended`（選讀）
 * - `FULL_NAME` — 完整書目描述（作者、書名、版次、出版社…）
 * - `SOURCE` — 若是網上資源就是網址，否則是可用來搜尋該書的關鍵字串
 *
 * 分類規則：
 * - SOURCE 是 doi.org 網址，或 FULL_NAME 內含 doi.org → 論文及期刊（Articles / Thesis）
 *   （不少書目把 DOI 寫在描述句末，SOURCE 卻只放書名關鍵字）
 * - 否則 SOURCE 不是網址 → 書籍（Books）
 * - 否則 → 網頁（Websites）
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
/** 文字中的 doi.org 連結（含 dx.doi.org / www.doi.org，scheme 可省略），取出後面的 DOI */
const DOI_IN_TEXT = /(?:https?:\/\/)?(?:www\.|dx\.)?doi\.org\/(\S+)/i;
/** 嶺南圖書館的 DOI 代理網址，例如 https://doi-org.lingnan.idm.oclc.org/10.1080/... */
const DOI_PROXY_IN_TEXT = /https?:\/\/doi-org(?:[.-][a-z0-9-]+)*\.oclc\.org\/(\S+)/i;

/** 書目描述常把 DOI 放在句末，需要剝掉不屬於 DOI 的結尾標點與包裹符號 */
const CLOSING_PAIRS: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
const trimBibliographyPunctuation = (value: string): string => {
  let doi = value.trim();
  while (doi) {
    const last = doi.slice(-1);
    // 成對括號可能是 DOI 的一部分（例如 10.1016/S0140-6736(06)69479-8），
    // 只有在沒有對應開括號時才視為書目的包裹符號
    const opener = CLOSING_PAIRS[last];
    if (opener) {
      const opens = doi.split(opener).length - 1;
      const closes = doi.split(last).length - 1;
      if (closes <= opens) break;
    } else if (!'.,;:>"\u2019\u201d'.includes(last)) {
      break;
    }
    doi = doi.slice(0, -1);
  }
  return doi;
};

/** 從網址或書目描述中擷取 DOI（例如 10.1007/s11301-020-00181-x） */
const extractDoi = (text?: string): string | undefined => {
  if (!text) return undefined;
  const match = text.match(DOI_IN_TEXT) || text.match(DOI_PROXY_IN_TEXT);
  if (!match) return undefined;
  return trimBibliographyPunctuation(match[1]) || undefined;
};

/** Anna's Archive 域名 — 中文介面走 tw. 子網域 */
const ANNAS_ARCHIVE_DOMAIN = 'annas-archive.pk';

const classifyReading = (source: string, fullName: string): Pick<CourseReading, 'kind' | 'url' | 'doi'> => {
  const hasScheme = URL_WITH_SCHEME.test(source);
  const isUrl = hasScheme || BARE_WWW_URL.test(source);
  const url = isUrl ? (hasScheme ? source : `https://${source}`) : undefined;

  // 論文及期刊：SOURCE 是 doi.org 網址，或書目描述裡帶有 doi.org 連結
  const doi = extractDoi(url) || extractDoi(fullName);
  if (doi) return { kind: 'article', doi, url: url ?? `https://doi.org/${doi}` };

  return isUrl ? { kind: 'website', url } : { kind: 'book' };
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
      ...classifyReading(source, fullName),
    });
  }
  return readings;
};

/** 依站台語言取得 Anna's Archive 域名（繁 / 簡中介面使用 tw. 子網域） */
export const getAnnasArchiveDomain = (language: string): string =>
  language === 'zh-TW' || language === 'zh-CN'
    ? `tw.${ANNAS_ARCHIVE_DOMAIN}`
    : ANNAS_ARCHIVE_DOMAIN;

/** Anna's Archive 的維基百科條目 — 跟隨站台語言（繁 / 簡中走 zh 維基的字詞轉換路徑） */
const ANNAS_ARCHIVE_WIKIPEDIA: Record<string, string> = {
  'zh-TW': 'https://zh.wikipedia.org/zh-tw/安娜的檔案',
  'zh-CN': 'https://zh.wikipedia.org/zh-cn/安娜的檔案',
  en: "https://en.wikipedia.org/wiki/Anna's_Archive",
};

export const getAnnasArchiveWikipediaUrl = (language: string): string =>
  ANNAS_ARCHIVE_WIKIPEDIA[language] || ANNAS_ARCHIVE_WIKIPEDIA.en;

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
