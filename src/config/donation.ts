/**
 * 捐款方式設定。
 *
 * 全站唯一的資料來源：footer、側邊欄、評論送出後的感謝彈窗都讀這裡。要新增／
 * 停用一種方式，改這個檔案就好，UI 不用動。
 *
 * 地址留空的項目會被 DonationDialog 自動略過，所以還沒開好的錢包可以先留空字串
 * 佔位，不會在畫面上出現半殘的一列。
 *
 * ⚠️ 這裡的地址全部經過校驗碼驗證（bech32 / EIP-55 / Base58Check / TON CRC16）。
 * 之後若要換地址，務必連校驗碼一起確認——貼錯一個字元，錢就真的回不來了。
 */

export const KOFI_USERNAME = 'lingubible';
export const KOFI_URL = `https://ko-fi.com/${KOFI_USERNAME}`;

export interface CryptoDonationMethod {
  /** React key，同時對應 locale 的 `donate.coin.<id>`（幣種的當地語言全名）。 */
  id: string;
  /** 代號（BTC、USDT…）。這是使用者實際辨識幣種的依據，永遠顯示。 */
  ticker: string;
  /** 網路標籤，例如 TRC20；同一代號有多條鏈時用來區分。留空則不顯示標籤。 */
  network?: string;
  /** 錢包地址。留空 = 尚未提供，該列不會渲染。 */
  address: string;
  /** 圓形徽章上的字符（Unicode 幣別符號，避免為了幾個圖示多打包 SVG）。 */
  glyph: string;
  /**
   * 徽章底色。刻意寫死十六進位而不是走 Tailwind 色階：這些是幣種的品牌色，
   * 跟主題無關，深淺色模式下都用同一個顏色。
   */
  color: string;
  /** 徽章字色。預設白字；黃／金色系的品牌色上白字對比不足，改用深色。 */
  fg?: string;
}

export const CRYPTO_DONATION_METHODS: CryptoDonationMethod[] = [
  {
    id: 'btc',
    ticker: 'BTC',
    address: 'bc1qj02ac5ev682x53fplwl3428p5r69mzagsjz4lk',
    glyph: '₿',
    color: '#F7931A',
  },
  {
    id: 'eth',
    ticker: 'ETH',
    address: '0x0357d369d45Effe1D3eD7b8aD12C2ecCe3F8184d',
    glyph: 'Ξ',
    color: '#627EEA',
  },
  {
    // 與 eth 同一個 EVM 帳戶：同一把私鑰在以太坊主網上收原生幣與 ERC20 代幣
    id: 'usdt-erc20',
    ticker: 'USDT',
    network: 'ERC20',
    address: '0x0357d369d45Effe1D3eD7b8aD12C2ecCe3F8184d',
    glyph: '₮',
    color: '#26A17B',
  },
  {
    // 與 trx 同一個 TRON 帳戶
    id: 'usdt-trc20',
    ticker: 'USDT',
    network: 'TRC20',
    address: 'THCM3Wjjwd6ReUathuKnyfjaDcvUwSJWUC',
    glyph: '₮',
    color: '#26A17B',
  },
  {
    id: 'sol',
    ticker: 'SOL',
    address: '9sA9FgqtGfpKZmBv2SSTvfAWkxHgqrMkXSeA1NNKsi5y',
    glyph: '◎',
    color: '#9945FF',
  },
  {
    id: 'trx',
    ticker: 'TRX',
    address: 'THCM3Wjjwd6ReUathuKnyfjaDcvUwSJWUC',
    glyph: 'T',
    color: '#EF0027',
  },
  {
    id: 'gram',
    ticker: 'GRAM',
    network: 'TON',
    address: 'UQCXzRzkqkXXkzq_pUm54dLPrdPW8CRG-KlVzjSubG0unyuD',
    glyph: '◈',
    color: '#0098EA',
  },
  {
    id: 'bnb',
    ticker: 'BNB',
    network: 'BEP20 / ERC20',
    address: '0x5a6A922F36707ba558Eaf0c14B6cc8B0a2728f03',
    glyph: '◆',
    color: '#F0B90B',
    fg: '#1B1B1B',
  },
  {
    id: 'doge',
    ticker: 'DOGE',
    address: 'DPmDppqWZ34UqJktXvHLauXQuuWrteL4C5',
    glyph: 'Ð',
    color: '#C2A633',
    fg: '#1B1B1B',
  },
  {
    id: 'xrp',
    ticker: 'XRP',
    address: 'rKQidLa6dUX7ucYgHUimtwe9vwLMWvNCEK',
    glyph: '✕',
    color: '#23292F',
  },
  {
    id: 'ltc',
    ticker: 'LTC',
    address: 'ltc1qfrfa9fgqyr89d5d9ee5cr3sptcmkwl94z00tfj',
    glyph: 'Ł',
    color: '#345D9D',
  },
  {
    id: 'zec',
    ticker: 'ZEC',
    address: 't1Rve5CMcqfBb2yaFDzRTVF9nBTwKPNaRY3',
    glyph: 'ⓩ',
    color: '#ECB244',
    fg: '#1B1B1B',
  },
];

/** 只有填了地址的幣種才會出現在彈窗裡。 */
export const getAvailableCryptoMethods = (): CryptoDonationMethod[] =>
  CRYPTO_DONATION_METHODS.filter((method) => method.address.trim().length > 0);
