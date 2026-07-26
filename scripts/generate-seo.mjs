#!/usr/bin/env node
/**
 * 產生 SEO 靜態資產：
 *   1. 每條可公開索引的路由都輸出一份獨立 HTML（正確的 title / description /
 *      canonical / JSON-LD + 可被爬蟲直接讀到的文字內容與內部連結）。
 *   2. sitemap 索引 + 分檔 sitemap（靜態頁 / 課程 / 講師）。
 *
 * 為什麼需要：本站是純 client-side render 的 SPA，Appwrite Sites 對所有路由
 * 回傳同一份 index.html。Google 在渲染 JS 之前看到的每一頁標題、描述、
 * canonical 全部相同（都指向首頁），因此把上千頁判定為重複內容而不建立索引。
 * 預先產生的 HTML 讓爬蟲第一眼就拿到唯一且正確的中繼資料。
 *
 * 用法：
 *   node scripts/generate-seo.mjs [outDir]     # 預設 dist
 *   SEO_EMIT_FLAT_HTML=1 node scripts/...      # 額外輸出 foo.html（若主機不支援目錄索引）
 *
 * 抓不到資料時只會輸出靜態頁 sitemap 並以 exit 0 結束，不會讓 build 失敗。
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve(process.argv[2] || 'dist');
const SITE_URL = (process.env.SITE_URL || 'https://www.lingubible.com').replace(/\/$/, '');
const ENDPOINT = (process.env.VITE_APPWRITE_ENDPOINT || 'https://appwrite.lingubible.com/v1').replace(/\/$/, '');
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '6a1097400037a55f6472';
const DATABASE_ID = 'lingubible';
const EMIT_FLAT_HTML = process.env.SEO_EMIT_FLAT_HTML === '1';
const OG_IMAGE = `${SITE_URL}/meta-image.png`;
const TODAY = new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------ 工具 */

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const clean = (s = '') => String(s).replace(/\s+/g, ' ').trim();

const truncate = (s, n) => {
  const t = clean(s);
  return t.length <= n ? t : `${t.slice(0, n - 1).trimEnd()}…`;
};

// 資料庫以 -1 / 0 代表「無資料 / N/A」，這些不能出現在中繼資料或結構化資料裡
const num = (v, d = 1) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n.toFixed(d) : null;
};

const lastmod = (doc) => (doc?.$updatedAt || doc?.$createdAt || TODAY).slice(0, 10);

/* --------------------------------------------------------- Appwrite 讀取 */

async function fetchAll(collection) {
  const docs = [];
  let cursor = null;

  for (;;) {
    const queries = [JSON.stringify({ method: 'limit', values: [100] })];
    if (cursor) queries.push(JSON.stringify({ method: 'cursorAfter', values: [cursor] }));
    const qs = queries.map((q) => `queries[]=${encodeURIComponent(q)}`).join('&');
    const url = `${ENDPOINT}/databases/${DATABASE_ID}/collections/${collection}/documents?${qs}`;

    const res = await fetch(url, { headers: { 'X-Appwrite-Project': PROJECT_ID } });
    if (!res.ok) throw new Error(`${collection}: HTTP ${res.status} ${await res.text()}`);
    const body = await res.json();

    docs.push(...body.documents);
    if (body.documents.length < 100) break;
    cursor = body.documents[body.documents.length - 1].$id;
  }

  return docs;
}

/* ------------------------------------------------------------ 靜態頁定義 */

const STATIC_PAGES = [
  {
    route: '/',
    priority: '1.0',
    changefreq: 'daily',
    title: 'LingUBible - Reg科聖經 | 嶺南大學課程與講師評價平台',
    description:
      '嶺南大學學生的課程與講師評價平台。真實學生評價、講師教學評分、成績分佈與選課心得，幫你 Reg 到最適合的課。',
    h1: 'LingUBible — 嶺南大學課程與講師評價平台',
    body: '由嶺南大學學生撰寫的真實課程評價與講師評分，涵蓋課程難度、實用程度、工作量、評分公平度與成績分佈，協助同學做出明智的選課決定。',
  },
  {
    route: '/courses',
    priority: '0.9',
    changefreq: 'daily',
    title: '所有課程｜嶺南大學課程評價與難度評分 - LingUBible',
    description:
      '瀏覽嶺南大學全部課程的學生評價：課程難度、實用程度、工作量、平均 GPA 與講師評分，支援學系、學分、授課語言篩選。',
    h1: '嶺南大學所有課程',
    body: '搜尋並比較嶺南大學開設的課程，查看每科的學生評價、平均評分、難度、工作量與成績分佈。',
  },
  {
    route: '/instructors',
    priority: '0.9',
    changefreq: 'daily',
    title: '所有講師｜嶺南大學講師評價與教學評分 - LingUBible',
    description:
      '瀏覽嶺南大學全部講師的學生評價：教學評分、評分公平度、任教課程與授課語言，找到最適合自己的教授。',
    h1: '嶺南大學所有講師',
    body: '查看嶺南大學各學系講師的教學評分、評分公平度與學生評論，並瞭解他們任教的課程。',
  },
  {
    route: '/planner',
    priority: '0.8',
    changefreq: 'weekly',
    title: '課堂時間表規劃工具｜嶺南大學排課 - LingUBible',
    description:
      '嶺南大學課堂時間表規劃工具：搜尋課程時段、自動偵測衝堂、比較不同組合並匯出 .ics 行事曆。',
    h1: '課堂時間表規劃工具',
    body: '在 Reg 科前先排好時間表：加入課程時段、即時檢查衝堂、比較多個組合，並可匯出成行事曆檔案。',
  },
  {
    route: '/gpa-hons',
    priority: '0.7',
    changefreq: 'monthly',
    title: 'GPA 與榮譽等級計算機｜嶺南大學 - LingUBible',
    description: '計算嶺南大學 GPA 與畢業榮譽等級（Honours Classification），輸入科目成績即時得出結果。',
    h1: 'GPA 與榮譽等級計算機',
    body: '輸入各科成績與學分，計算累積 GPA，並對照嶺南大學的畢業榮譽等級標準。',
  },
  {
    route: '/calendar',
    priority: '0.7',
    changefreq: 'weekly',
    title: '學年行事曆｜嶺南大學重要日期 - LingUBible',
    description: '嶺南大學學年行事曆：開課日、加退選、考試週、公眾假期與學期起訖日期一覽。',
    h1: '嶺南大學學年行事曆',
    body: '查看學期起訖、加退選期限、考試週與公眾假期等重要日期。',
  },
  {
    route: '/faq',
    priority: '0.6',
    changefreq: 'monthly',
    title: '常見問題 FAQ｜LingUBible',
    description: '關於 LingUBible 的常見問題：如何註冊、如何撰寫課程評價、評分標準與匿名機制說明。',
    h1: '常見問題',
    body: '關於註冊資格、撰寫評價、評分標準與匿名保護的常見問題解答。',
  },
  {
    route: '/contact',
    priority: '0.5',
    changefreq: 'monthly',
    title: '聯絡我們｜LingUBible',
    description: '聯絡 LingUBible 團隊：意見回饋、錯誤回報與合作查詢。',
    h1: '聯絡我們',
    body: '有任何意見、錯誤回報或合作查詢，歡迎與我們聯絡。',
  },
  {
    route: '/login',
    priority: '0.4',
    changefreq: 'monthly',
    title: '登入｜LingUBible',
    description: '使用嶺南大學電郵登入 LingUBible，查看與撰寫課程及講師評價。',
    h1: '登入 LingUBible',
    body: '使用你的嶺南大學電郵登入，即可撰寫評價、收藏課程與使用時間表工具。',
  },
  {
    route: '/register',
    priority: '0.4',
    changefreq: 'monthly',
    title: '註冊帳戶｜LingUBible',
    description: '以嶺南大學電郵（@ln.hk）註冊 LingUBible 帳戶，加入同學的課程評價社群。',
    h1: '註冊 LingUBible 帳戶',
    body: '僅限嶺南大學學生註冊，驗證電郵後即可撰寫與閱讀完整的課程及講師評價。',
  },
  {
    route: '/terms',
    priority: '0.3',
    changefreq: 'yearly',
    title: '使用條款｜LingUBible',
    description: 'LingUBible 使用條款與服務規範。',
    h1: '使用條款',
    body: 'LingUBible 的使用條款、內容規範與免責聲明。',
  },
  {
    route: '/privacy',
    priority: '0.3',
    changefreq: 'yearly',
    title: '私隱政策｜LingUBible',
    description: 'LingUBible 私隱政策：我們如何收集、使用與保護你的個人資料。',
    h1: '私隱政策',
    body: '說明我們收集哪些資料、如何使用，以及你對個人資料的權利。',
  },
];

const BASE_KEYWORDS = 'LingUBible,Reg科聖經,嶺南大學,嶺大,Lingnan University,課程評價,講師評分,選課指南';

/* ------------------------------------------------------------ HTML 模板 */

function stripSplashLinks(html) {
  // 42 個 apple-touch-startup-image 佔了 index.html 一半以上體積，
  // 深層連結入口頁不需要它們（PWA 安裝仍靠 manifest）。
  return html.replace(/^[ \t]*<link[^>]*rel="apple-touch-startup-image"[^>]*>\r?\n?/gim, '');
}

function resetRoot(html) {
  // 讓腳本可重複執行：若 dist/index.html 已被上一次執行填過內容，先清空
  return html.replace(/<div id="root"><!--prerender-->[\s\S]*?<!--\/prerender--><\/div>/, '<div id="root"></div>');
}

function replaceTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

function buildHtml(template, page) {
  const canonical = `${SITE_URL}${page.route}`;
  const title = esc(page.title);
  const description = esc(truncate(page.description, 300));
  const keywords = esc(page.keywords || BASE_KEYWORDS);

  let html = template;

  html = replaceTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = replaceTag(html, /<meta name="title" content="[^"]*"\s*\/?>/i, `<meta name="title" content="${title}" />`);
  html = replaceTag(
    html,
    /<meta name="description" content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${description}" />`
  );
  html = replaceTag(
    html,
    /<meta name="keywords" content="[^"]*"\s*\/?>/i,
    `<meta name="keywords" content="${keywords}" />`
  );
  html = replaceTag(
    html,
    /<meta property="og:title" content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${title}" />`
  );
  html = replaceTag(
    html,
    /<meta property="og:description" content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${description}" />`
  );
  html = replaceTag(
    html,
    /<meta property="og:url" content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${esc(canonical)}" />`
  );
  html = replaceTag(
    html,
    /<meta property="twitter:title" content="[^"]*"\s*\/?>/i,
    `<meta property="twitter:title" content="${title}" />`
  );
  html = replaceTag(
    html,
    /<meta property="twitter:description" content="[^"]*"\s*\/?>/i,
    `<meta property="twitter:description" content="${description}" />`
  );
  html = replaceTag(
    html,
    /<meta property="twitter:url" content="[^"]*"\s*\/?>/i,
    `<meta property="twitter:url" content="${esc(canonical)}" />`
  );
  html = replaceTag(
    html,
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${esc(canonical)}" />`
  );

  const jsonLd = (page.structuredData || [])
    .map((data) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`)
    .join('\n    ');
  if (jsonLd) html = html.replace('</head>', `    ${jsonLd}\n  </head>`);

  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"><!--prerender-->${page.content}<!--/prerender--></div>`
  );

  return html;
}

const PRERENDER_STYLE =
  '<style>.prerender{max-width:52rem;margin:0 auto;padding:2rem 1.25rem;font-family:system-ui,-apple-system,"PingFang TC","Microsoft JhengHei",sans-serif;line-height:1.6}.prerender h1{font-size:1.6rem;margin:0 0 .5rem}.prerender h2{font-size:1.15rem;margin:1.5rem 0 .5rem}.prerender a{color:inherit}.prerender ul{padding-left:1.25rem}.prerender .muted{opacity:.75;font-size:.9rem}</style>';

function contentBlock(inner) {
  return `${PRERENDER_STYLE}<div class="prerender">${inner}</div>`;
}

function breadcrumb(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.route}`,
    })),
  };
}

const PROVIDER = {
  '@type': 'CollegeOrUniversity',
  name: 'Lingnan University',
  alternateName: '嶺南大學',
  sameAs: 'https://www.ln.edu.hk',
};

/* --------------------------------------------------------------- 頁面建構 */

function buildStaticPage(def, extraLinks = '') {
  const structuredData = [
    breadcrumb(
      def.route === '/'
        ? [{ name: 'LingUBible', route: '/' }]
        : [
            { name: 'LingUBible', route: '/' },
            { name: def.h1, route: def.route },
          ]
    ),
  ];

  // 首頁不再另外輸出 WebSite schema：index.html 本身已內建（含 SearchAction）

  return {
    ...def,
    structuredData,
    content: contentBlock(
      `<h1>${esc(def.h1)}</h1><p>${esc(def.body)}</p>${extraLinks}` +
        `<p class="muted"><a href="/">首頁</a> · <a href="/courses">所有課程</a> · <a href="/instructors">所有講師</a> · <a href="/planner">時間表規劃</a> · <a href="/calendar">學年行事曆</a> · <a href="/faq">常見問題</a></p>`
    ),
  };
}

function buildCoursePage(course, instructors) {
  const code = course.course_code;
  const route = `/courses/${encodeURIComponent(code)}`;
  const titleEn = clean(course.course_title) || code;
  const titleTc = clean(course.course_title_tc);
  const titleSc = clean(course.course_title_sc);
  const dept = clean(course.department);
  const reviews = Number(course.stats_review_count) || 0;
  const rating = num(course.stats_avg_rating);
  const difficulty = num(course.stats_avg_difficulty);
  const usefulness = num(course.stats_avg_usefulness);
  const workload = num(course.stats_avg_workload);
  const gpa = Number(course.stats_avg_gpa_count) > 0 ? num(course.stats_avg_gpa, 2) : null;
  const desc = clean(course.course_description);

  const altTitles = [titleTc, titleSc].filter((t) => t && t !== titleEn);
  const stats = reviews
    ? `目前有 ${reviews} 則學生評價${rating ? `，平均評分 ${rating}/5` : ''}${
        difficulty ? `、難度 ${difficulty}/5` : ''
      }${gpa ? `、平均 GPA ${gpa}` : ''}。`
    : '目前尚未有學生評價，歡迎修過的同學成為第一個分享心得的人。';

  const metaDescription = truncate(
    `${code} ${titleEn}${titleTc ? `（${titleTc}）` : ''} — 嶺南大學${dept ? ` ${dept} ` : ''}課程評價。${stats}` +
      `查看課程難度、實用程度、工作量、成績分佈與任教講師評分。`,
    180
  );

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: `${code} ${titleEn}`,
      alternateName: altTitles.length ? altTitles : undefined,
      description: truncate(desc || metaDescription, 500),
      courseCode: code,
      url: `${SITE_URL}${route}`,
      inLanguage: ['en', 'zh-Hant', 'zh-Hans'],
      provider: PROVIDER,
      ...(reviews > 0 && rating
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: rating,
              reviewCount: reviews,
              bestRating: '5',
              worstRating: '1',
            },
          }
        : {}),
    },
    breadcrumb([
      { name: 'LingUBible', route: '/' },
      { name: '所有課程', route: '/courses' },
      { name: `${code} ${titleEn}`, route },
    ]),
  ];

  const rows = [
    dept && `<li>學系／Department：${esc(dept)}</li>`,
    course.credits && `<li>學分／Credits：${esc(course.credits)}</li>`,
    rating && `<li>平均評分：${rating} / 5（${reviews} 則評價）</li>`,
    difficulty && `<li>課程難度：${difficulty} / 5</li>`,
    usefulness && `<li>實用程度：${usefulness} / 5</li>`,
    workload && `<li>工作量：${workload} / 5</li>`,
    gpa && `<li>平均 GPA：${gpa}</li>`,
  ]
    .filter(Boolean)
    .join('');

  const instructorLinks = instructors.length
    ? `<h2>任教講師</h2><ul>${instructors
        .map((n) => `<li><a href="/instructors/${encodeURIComponent(n)}">${esc(n)}</a></li>`)
        .join('')}</ul>`
    : '';

  return {
    route,
    priority: reviews > 0 ? '0.8' : '0.6',
    changefreq: 'weekly',
    lastmod: lastmod(course),
    title: `${code} ${titleEn}${titleTc ? `（${titleTc}）` : ''}｜嶺南大學課程評價 - LingUBible`,
    description: metaDescription,
    keywords: [code, titleEn, titleTc, titleSc, dept, '嶺南大學課程評價', 'Lingnan course review', BASE_KEYWORDS]
      .filter(Boolean)
      .join(','),
    structuredData,
    content: contentBlock(
      `<p class="muted"><a href="/">LingUBible</a> › <a href="/courses">所有課程</a></p>` +
        `<h1>${esc(code)} ${esc(titleEn)}</h1>` +
        (altTitles.length ? `<p>${esc(altTitles.join('　'))}</p>` : '') +
        (desc ? `<p>${esc(truncate(desc, 600))}</p>` : '') +
        (rows ? `<h2>課程數據</h2><ul>${rows}</ul>` : '') +
        `<p>${esc(stats)}</p>` +
        instructorLinks +
        `<p class="muted"><a href="/courses">瀏覽全部課程</a> · <a href="/instructors">瀏覽全部講師</a></p>`
    ),
  };
}

function buildInstructorPage(instructor, courses) {
  const name = instructor.name;
  const route = `/instructors/${encodeURIComponent(name)}`;
  const nameTc = clean(instructor.name_tc);
  const nameSc = clean(instructor.name_sc);
  const honorific = clean(instructor.title);
  const dept = clean(instructor.department);
  const reviews = Number(instructor.stats_review_count) || 0;
  const teaching = num(instructor.stats_teaching_score);
  const fairness = num(instructor.stats_grading_fairness);
  const gpa = Number(instructor.stats_avg_gpa_count) > 0 ? num(instructor.stats_avg_gpa, 2) : null;

  const altNames = [nameTc, nameSc].filter((n) => n && n !== name);
  const stats = reviews
    ? `目前有 ${reviews} 則學生評價${teaching ? `，教學評分 ${teaching}/5` : ''}${
        fairness ? `、評分公平度 ${fairness}/5` : ''
      }${gpa ? `、平均 GPA ${gpa}` : ''}。`
    : '目前尚未有學生評價，歡迎上過堂的同學分享心得。';

  const metaDescription = truncate(
    `${honorific ? `${honorific} ` : ''}${name}${nameTc ? `（${nameTc}）` : ''} — 嶺南大學${
      dept ? ` ${dept} ` : ''
    }講師評價。${stats}查看任教課程、教學評分與學生評論。`,
    180
  );

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name,
      alternateName: altNames.length ? altNames : undefined,
      jobTitle: honorific || 'Lecturer',
      url: `${SITE_URL}${route}`,
      worksFor: PROVIDER,
      ...(dept ? { affiliation: { '@type': 'Organization', name: dept } } : {}),
    },
    breadcrumb([
      { name: 'LingUBible', route: '/' },
      { name: '所有講師', route: '/instructors' },
      { name, route },
    ]),
  ];

  const rows = [
    dept && `<li>學系／Department：${esc(dept)}</li>`,
    teaching && `<li>教學評分：${teaching} / 5（${reviews} 則評價）</li>`,
    fairness && `<li>評分公平度：${fairness} / 5</li>`,
    gpa && `<li>學生平均 GPA：${gpa}</li>`,
  ]
    .filter(Boolean)
    .join('');

  const courseLinks = courses.length
    ? `<h2>任教課程</h2><ul>${courses
        .map((c) => `<li><a href="/courses/${encodeURIComponent(c)}">${esc(c)}</a></li>`)
        .join('')}</ul>`
    : '';

  return {
    route,
    priority: reviews > 0 ? '0.7' : '0.5',
    changefreq: 'weekly',
    lastmod: lastmod(instructor),
    title: `${name}${nameTc ? `（${nameTc}）` : ''}｜嶺南大學講師評價與教學評分 - LingUBible`,
    description: metaDescription,
    keywords: [name, nameTc, nameSc, dept, '嶺南大學講師評價', 'Lingnan lecturer review', BASE_KEYWORDS]
      .filter(Boolean)
      .join(','),
    structuredData,
    content: contentBlock(
      `<p class="muted"><a href="/">LingUBible</a> › <a href="/instructors">所有講師</a></p>` +
        `<h1>${esc(honorific ? `${honorific} ${name}` : name)}</h1>` +
        (altNames.length ? `<p>${esc(altNames.join('　'))}</p>` : '') +
        `<p>${esc(stats)}</p>` +
        (rows ? `<h2>講師數據</h2><ul>${rows}</ul>` : '') +
        courseLinks +
        `<p class="muted"><a href="/instructors">瀏覽全部講師</a> · <a href="/courses">瀏覽全部課程</a></p>`
    ),
  };
}

/* ------------------------------------------------------------- 檔案輸出 */

async function writePage(templates, page) {
  // 首頁同時是 PWA 入口與 SPA fallback，保留完整的 index.html（含啟動畫面連結）
  const html = buildHtml(page.route === '/' ? templates.full : templates.slim, page);
  const dir = page.route === '/' ? OUT_DIR : path.join(OUT_DIR, decodeURIComponent(page.route).replace(/^\//, ''));

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), html, 'utf8');

  if (EMIT_FLAT_HTML && page.route !== '/') {
    await writeFile(`${dir}.html`, html, 'utf8');
  }
}

function sitemapXml(pages) {
  const urls = pages
    .map((p) => {
      // route 已在建構時經 encodeURIComponent 處理，這裡只需做 XML 逸出
      const loc = `${SITE_URL}${p.route}`;
      return [
        '  <url>',
        `    <loc>${esc(loc)}</loc>`,
        `    <lastmod>${p.lastmod || TODAY}</lastmod>`,
        `    <changefreq>${p.changefreq}</changefreq>`,
        `    <priority>${p.priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function sitemapIndexXml(names) {
  const entries = names
    .map(
      (n) =>
        `  <sitemap>\n    <loc>${SITE_URL}/${n}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </sitemap>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;
}

/* ------------------------------------------------------------------ main */

async function main() {
  const rawTemplate = resetRoot(await readFile(path.join(OUT_DIR, 'index.html'), 'utf8'));
  if (!rawTemplate.includes('<div id="root"></div>')) {
    throw new Error(
      `${OUT_DIR}/index.html 找不到空的 <div id="root"></div>，無法安全預渲染。請先重新執行 vite build。`
    );
  }
  const templates = { full: rawTemplate, slim: stripSplashLinks(rawTemplate) };

  let courses = [];
  let instructors = [];
  let teaching = [];

  try {
    [courses, instructors, teaching] = await Promise.all([
      fetchAll('courses'),
      fetchAll('instructors'),
      fetchAll('teaching_records'),
    ]);
    console.log(
      `📥 取得 ${courses.length} 門課程、${instructors.length} 位講師、${teaching.length} 筆授課紀錄`
    );
  } catch (err) {
    console.warn(`⚠️  無法取得 Appwrite 資料，只產生靜態頁 sitemap：${err.message}`);
  }

  // 課程 ↔ 講師 關聯（提供爬蟲可直接跟隨的內部連結）
  const instructorNames = new Set(instructors.map((i) => i.name));
  const courseCodes = new Set(courses.map((c) => c.course_code));
  const byCourse = new Map();
  const byInstructor = new Map();

  for (const rec of teaching) {
    const { course_code: code, instructor_name: name } = rec;
    if (!courseCodes.has(code) || !instructorNames.has(name)) continue;
    if (!byCourse.has(code)) byCourse.set(code, new Set());
    if (!byInstructor.has(name)) byInstructor.set(name, new Set());
    byCourse.get(code).add(name);
    byInstructor.get(name).add(code);
  }

  const sorted = (set) => [...(set || [])].sort();

  // 同名講師／重複課程代碼會對應到同一個網址，只保留一份，避免 sitemap 出現重複 <loc>
  const dedupeByRoute = (pages) => [...new Map(pages.map((p) => [p.route, p])).values()];

  const coursePages = dedupeByRoute(
    courses
      .filter((c) => c.course_code && !/[/\\]/.test(c.course_code))
      .sort((a, b) => a.course_code.localeCompare(b.course_code))
      .map((c) => buildCoursePage(c, sorted(byCourse.get(c.course_code))))
  );

  const instructorPages = dedupeByRoute(
    instructors
      .filter((i) => i.name && !/[/\\]/.test(i.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((i) => buildInstructorPage(i, sorted(byInstructor.get(i.name))))
  );

  // /courses 與 /instructors 列出全部連結，讓爬蟲在未執行 JS 時也能發現子頁
  const courseIndexLinks = coursePages.length
    ? `<h2>課程一覽（${coursePages.length}）</h2><ul>${coursePages
        .map((p) => `<li><a href="${p.route}">${esc(decodeURIComponent(p.route.split('/').pop()))}</a></li>`)
        .join('')}</ul>`
    : '';
  const instructorIndexLinks = instructorPages.length
    ? `<h2>講師一覽（${instructorPages.length}）</h2><ul>${instructorPages
        .map((p) => `<li><a href="${p.route}">${esc(decodeURIComponent(p.route.split('/').pop()))}</a></li>`)
        .join('')}</ul>`
    : '';

  const staticPages = STATIC_PAGES.map((def) =>
    buildStaticPage(
      def,
      def.route === '/courses' ? courseIndexLinks : def.route === '/instructors' ? instructorIndexLinks : ''
    )
  );

  const allPages = [...staticPages, ...coursePages, ...instructorPages];
  for (const page of allPages) await writePage(templates, page);

  await writeFile(path.join(OUT_DIR, 'sitemap-pages.xml'), sitemapXml(staticPages), 'utf8');
  if (coursePages.length) {
    await writeFile(path.join(OUT_DIR, 'sitemap-courses.xml'), sitemapXml(coursePages), 'utf8');
  }
  if (instructorPages.length) {
    await writeFile(path.join(OUT_DIR, 'sitemap-instructors.xml'), sitemapXml(instructorPages), 'utf8');
  }

  const children = [
    'sitemap-pages.xml',
    coursePages.length && 'sitemap-courses.xml',
    instructorPages.length && 'sitemap-instructors.xml',
  ].filter(Boolean);
  await writeFile(path.join(OUT_DIR, 'sitemap.xml'), sitemapIndexXml(children), 'utf8');

  console.log(
    `✅ 已產生 ${allPages.length} 個預渲染頁面（靜態 ${staticPages.length}、課程 ${coursePages.length}、講師 ${instructorPages.length}）`
  );
  console.log(`✅ sitemap 索引：${SITE_URL}/sitemap.xml（${children.join(', ')}）`);
}

main().catch((err) => {
  console.error('❌ generate-seo 失敗：', err);
  process.exit(1);
});
