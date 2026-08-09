import type { ComponentType } from 'react';
import TokenBNB from '@web3icons/react/icons/tokens/TokenBNB';
import TokenBTC from '@web3icons/react/icons/tokens/TokenBTC';
import TokenDOGE from '@web3icons/react/icons/tokens/TokenDOGE';
import TokenETH from '@web3icons/react/icons/tokens/TokenETH';
import TokenGRAM from '@web3icons/react/icons/tokens/TokenGRAM';
import TokenLTC from '@web3icons/react/icons/tokens/TokenLTC';
import TokenSOL from '@web3icons/react/icons/tokens/TokenSOL';
import TokenTRX from '@web3icons/react/icons/tokens/TokenTRX';
import TokenUSDT from '@web3icons/react/icons/tokens/TokenUSDT';
import TokenXRP from '@web3icons/react/icons/tokens/TokenXRP';
import TokenZEC from '@web3icons/react/icons/tokens/TokenZEC';

/**
 * 幣種官方圖示（@web3icons/react）。
 *
 * 兩個刻意的選擇：
 * 1. 逐檔深層 import 而不是從套件根目錄具名 import —— 根目錄 index 會 re-export
 *    近兩千個圖示，雖然標了 sideEffects: false 搖得掉，但打包時要多掃一大包。
 * 2. 整個模組由 DonationDialog 以 React.lazy 載入（vite.config.ts 也把 @web3icons
 *    切成獨立分塊），圖示只有在使用者真的打開捐款彈窗時才下載。
 *
 * variant="background" 是「品牌色底 + 白色標誌」的方形版本，外層套
 * overflow-hidden rounded-full 就成了圓形徽章。
 */

/** 以代號（而非 id）為鍵：USDT 的 ERC20 與 TRC20 兩列共用同一個圖示。 */
const TOKEN_ICONS: Record<string, ComponentType<any>> = {
  BTC: TokenBTC,
  ETH: TokenETH,
  USDT: TokenUSDT,
  SOL: TokenSOL,
  TRX: TokenTRX,
  GRAM: TokenGRAM,
  BNB: TokenBNB,
  DOGE: TokenDOGE,
  XRP: TokenXRP,
  LTC: TokenLTC,
  ZEC: TokenZEC,
};

export default function CryptoIcon({
  ticker,
  className,
}: {
  ticker: string;
  className?: string;
}) {
  const Icon = TOKEN_ICONS[ticker];
  // 沒有對應圖示時什麼都不畫，讓外層那個「品牌色圓底 + 字符」的備援顯示出來
  if (!Icon) return null;
  return <Icon variant="background" size="100%" className={className} aria-hidden="true" />;
}
