import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/useLanguage';

const GOOGLE_GROUP_URL = 'https://groups.google.com/g/lingubible';
const TESTING_OPT_IN_URL = 'https://play.google.com/apps/testing/com.lingubible.www.twa';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.lingubible.www.twa';

const GooglePlayIcon = ({ className }: { className?: string }) => (
  <svg viewBox="30 336.7 120.9 129.2" className={className} aria-hidden="true">
    <path fill="#FFD400" d="M119.2,421.2c15.3-8.4,27-14.8,28-15.3c3.2-1.7,6.5-6.2,0-9.7c-2.1-1.1-13.4-7.3-28-15.3l-20.1,20.2L119.2,421.2z"/>
    <path fill="#FF3333" d="M99.1,401.1l-64.2,64.7c1.5,0.2,3.2-0.2,5.2-1.3c4.2-2.3,48.8-26.7,79.1-43.3L99.1,401.1z"/>
    <path fill="#48FF48" d="M99.1,401.1l20.1-20.2c0,0-74.6-40.7-79.1-43.1c-1.7-1-3.6-1.3-5.3-1L99.1,401.1z"/>
    <path fill="#3BCCFF" d="M99.1,401.1l-64.3-64.3c-2.6,0.6-4.8,2.9-4.8,7.6c0,7.5,0,107.5,0,113.8c0,4.3,1.7,7.4,4.9,7.7L99.1,401.1z"/>
  </svg>
);

export const PlayStoreDownloadButton = ({ className = '' }: { className?: string }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const steps: { title: string; desc: string; url?: string }[] = [
    { title: t('playStore.step1Title'), desc: t('playStore.step1Desc'), url: GOOGLE_GROUP_URL },
    { title: t('playStore.step2Title'), desc: t('playStore.step2Desc'), url: TESTING_OPT_IN_URL },
    { title: t('playStore.step3Title'), desc: t('playStore.step3Desc'), url: PLAY_STORE_URL },
    { title: t('playStore.step4Title'), desc: t('playStore.step4Desc') },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`relative inline-flex items-center gap-2.5 rounded-lg bg-black text-white border border-gray-600 px-4 py-2 hover:bg-gray-900 hover:scale-105 transition-all duration-200 shadow-md ${className}`}
        aria-label={`${t('playStore.getItOn')} Google Play (${t('playStore.beta')})`}
      >
        <GooglePlayIcon className="h-7 w-7" />
        <span className="flex flex-col items-start leading-tight text-left">
          <span className="text-[10px] uppercase tracking-wider opacity-80">{t('playStore.getItOn')}</span>
          <span className="text-base font-semibold -mt-0.5">Google Play</span>
        </span>
        <span className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 shadow-md">
          {t('playStore.beta')}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GooglePlayIcon className="h-5 w-5" />
              {t('playStore.dialogTitle')}
            </DialogTitle>
            <DialogDescription className="text-left">
              {t('playStore.dialogIntro')}
            </DialogDescription>
          </DialogHeader>

          <ol className="space-y-4 mt-2">
            {steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                  {step.url && (
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1 break-all"
                    >
                      {step.url.replace('https://', '')}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <p className="text-xs text-muted-foreground border-t pt-3 mt-2">
            {t('playStore.feedback')}{' '}
            <a href="mailto:support@lingubible.com" className="text-primary hover:underline">
              support@lingubible.com
            </a>
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};
