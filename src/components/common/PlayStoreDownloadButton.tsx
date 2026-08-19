import { useLanguage } from '@/hooks/useLanguage';

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.lingubible.www.twa';

export const GooglePlayIcon = ({ className }: { className?: string }) => (
  <svg viewBox="30 336.7 120.9 129.2" className={className} aria-hidden="true">
    <path fill="#FFD400" d="M119.2,421.2c15.3-8.4,27-14.8,28-15.3c3.2-1.7,6.5-6.2,0-9.7c-2.1-1.1-13.4-7.3-28-15.3l-20.1,20.2L119.2,421.2z"/>
    <path fill="#FF3333" d="M99.1,401.1l-64.2,64.7c1.5,0.2,3.2-0.2,5.2-1.3c4.2-2.3,48.8-26.7,79.1-43.3L99.1,401.1z"/>
    <path fill="#48FF48" d="M99.1,401.1l20.1-20.2c0,0-74.6-40.7-79.1-43.1c-1.7-1-3.6-1.3-5.3-1L99.1,401.1z"/>
    <path fill="#3BCCFF" d="M99.1,401.1l-64.3-64.3c-2.6,0.6-4.8,2.9-4.8,7.6c0,7.5,0,107.5,0,113.8c0,4.3,1.7,7.4,4.9,7.7L99.1,401.1z"/>
  </svg>
);

// App 已正式上架，點擊直接前往 Play Store（不再有測試員邀請流程的彈窗）
export const PlayStoreDownloadButton = ({ className = '' }: { className?: string }) => {
  const { t } = useLanguage();

  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative inline-flex items-center gap-2.5 rounded-lg bg-black text-white border border-gray-600 px-4 py-2 hover:bg-gray-900 hover:scale-105 transition-all duration-200 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className}`}
      aria-label={`${t('playStore.getItOn')} Google Play (${t('playStore.new')})`}
    >
      <GooglePlayIcon className="h-7 w-7" />
      <span className="flex flex-col items-start leading-tight text-left">
        <span className="text-[10px] uppercase tracking-wider opacity-80">{t('playStore.getItOn')}</span>
        <span className="text-base font-semibold -mt-0.5">Google Play</span>
      </span>
      <span className="absolute -top-2 -right-2 rounded-full bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 shadow-md">
        {t('playStore.new')}
      </span>
    </a>
  );
};
