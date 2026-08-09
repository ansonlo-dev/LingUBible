import { QRCodeSVG } from 'qrcode.react';

/**
 * 加密貨幣地址的 QR 碼。
 *
 * 刻意獨立成一個 default export 的模組：DonationDialog 用 React.lazy 載入它，
 * qrcode.react 才不會被算進首屏的 vendor 分塊（vite.config.ts 裡也有對應的
 * manualChunks 規則）。
 *
 * 底色永遠是白的、模組永遠是黑的，不跟著主題走 —— 深色模式下把 QR 反相會讓
 * 一部分相機掃不出來，四周的白邊（quiet zone）也是掃描成功率的必要條件。
 */
// 192px / 最長地址的 37 個模組 ≈ 5.2px 一格，手機相機掃得動；再小就開始不穩。
export default function CryptoQrCode({ value, size = 192 }: { value: string; size?: number }) {
  return (
    <div className="rounded-lg bg-white p-3 shadow-sm">
      <QRCodeSVG
        value={value}
        size={size}
        bgColor="#ffffff"
        fgColor="#000000"
        // 地址字串長、又常被印在螢幕上拍照，容錯等級拉到 M 比較保險
        level="M"
        marginSize={2}
      />
    </div>
  );
}
