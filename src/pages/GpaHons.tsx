import { useLanguage } from '@/hooks/useLanguage';

const GpaHons = () => {
  const { t } = useLanguage();

  return (
    <div className="mx-auto px-3 lg:px-4 pt-3 pb-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1 md:flex-row md:flex-wrap md:items-baseline md:gap-5">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">{t('gpaHons.title')}</h1>
        </div>
        <p className="text-muted-foreground md:-translate-y-[3px]">{t('gpaHons.subtitle')}</p>
      </div>
    </div>
  );
};

export default GpaHons;
