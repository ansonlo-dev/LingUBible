/**
 * 捐款方式設定。
 *
 * 全站唯一的資料來源：footer、側邊欄、評論送出後的感謝彈窗都讀這裡。要新增／
 * 停用一種方式，改這個檔案就好，UI 不用動。
 *
 * 地址留空的項目會被 DonationDialog 自動略過，所以還沒開好的錢包可以先留空字串
 * 佔位，不會在畫面上出現半殘的一列。
 */

export const KOFI_USERNAME = 'lingubible';
export const KOFI_URL = `https://ko-fi.com/${KOFI_USERNAME}`;

export interface CryptoDonationMethod {
  /** 對應 locale 的 `donate.crypto.<id>.name`，同時也是 React key。 */
  id: string;
  /** 幣種顯示名稱（不進 i18n：BTC、Ethereum 這類專有名詞三語一致）。 */
  name: string;
  /** 網路標籤，例如 TRC20；同一幣種有多條鏈時用來區分。留空則不顯示標籤。 */
  network?: string;
  /** 錢包地址。留空 = 尚未提供，該列不會渲染。 */
  address: string;
  /** 圓形徽章上的字符（Unicode 幣別符號，避免為了幾個圖示多打包 SVG）。 */
  glyph: string;
  /**
   * 徽章底色。刻意寫死十六進位而不是走 Tailwind 色階：這些是幣種的品牌色，
   * 跟主題無關，深淺色模式下都用同一個顏色（白字在這幾個色上對比皆足夠）。
   */
  color: string;
}

export const CRYPTO_DONATION_METHODS: CryptoDonationMethod[] = [
  {
    id: 'btc',
    name: 'Bitcoin',
    address: '',
    glyph: '₿',
    color: '#F7931A',
  },
  {
    id: 'eth',
    name: 'Ethereum',
    network: 'ERC20',
    address: '',
    glyph: 'Ξ',
    color: '#627EEA',
  },
  {
    id: 'usdt-trc20',
    name: 'USDT',
    network: 'TRC20',
    address: '',
    glyph: '₮',
    color: '#26A17B',
  },
  {
    id: 'usdt-erc20',
    name: 'USDT',
    network: 'ERC20',
    address: '',
    glyph: '₮',
    color: '#26A17B',
  },
  {
    id: 'sol',
    name: 'Solana',
    address: '',
    glyph: '◎',
    color: '#9945FF',
  },
  {
    id: 'ton',
    name: 'TON',
    address: '',
    glyph: '◈',
    color: '#0098EA',
  },
];

/** 只有填了地址的幣種才會出現在彈窗裡。 */
export const getAvailableCryptoMethods = (): CryptoDonationMethod[] =>
  CRYPTO_DONATION_METHODS.filter((method) => method.address.trim().length > 0);
