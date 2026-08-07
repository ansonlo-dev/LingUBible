/**
 * 「說明型」對話框（分享、Google Play 安裝步驟）共用的外框樣式。
 *
 * 抽成常數而不是各自寫一份，是因為這幾個彈窗會被使用者連著看到，字級、圓角或
 * 內距只要差一點就很明顯。要調整外觀改這裡即可，兩邊自然同步。
 *
 * 逐項說明：
 * - grid-cols-[minmax(0,1fr)]：DialogContent 是 display:grid，隱式軌道的最小值
 *   是內容的 min-content。<textarea>（分享訊息框）與長網址（Play 步驟）都會把
 *   軌道撐得比對話框寬，小螢幕上整塊內容就溢出右邊。鎖成 minmax(0,1fr) 才會
 *   真正跟著容器走。
 * - w-[calc(100vw-2rem)]：手機上左右各留 1rem，圓角才看得見（基礎樣式的 w-full
 *   會讓彈窗貼齊螢幕邊緣）。
 * - rounded-xl sm:rounded-xl：基礎樣式只有 sm:rounded-lg，手機上是直角；後者用來
 *   蓋掉 sm 斷點的 rounded-lg（同一個 media query 內，需由 twMerge 擇一）。
 * - bg-white / dark:bg-zinc-900：基礎樣式的 bg-background 會編成
 *   rgb(255, 255, 255 / 1)（逗號 + 斜線 alpha 混用，CSS 判為無效而整條丟棄），
 *   border-border 同樣失效退回 currentColor，結果對話框在淺色主題下完全透明。
 *   這裡直接指定不透明底色與框線，色值對齊 index.css 中 [role="alertdialog"]
 *   既有的對話框樣式。
 * - p-4 sm:p-6：四邊等距內距（基礎樣式固定 p-6，手機上太擠）。
 */
export const INFO_DIALOG_CONTENT_CLASS =
  'grid-cols-[minmax(0,1fr)] max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg gap-4 overflow-y-auto overflow-x-hidden rounded-xl border-gray-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900 sm:rounded-xl sm:p-6';
