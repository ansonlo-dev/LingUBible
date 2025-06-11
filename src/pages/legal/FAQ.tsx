import { useLanguage } from '@/contexts/LanguageContext';
import { HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FAQ() {
  const { t } = useLanguage();

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Header */}
        <div className="mb-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-1">
              {t('faq.title')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('faq.subtitle')}
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                {t('faq.questions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-8">
                <div>
                  <h4 className="font-medium text-foreground leading-relaxed mb-2">{t('faq.reportQuestion')}</h4>
                  <p 
                    className="text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: t('faq.reportAnswer') }}
                  />
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground leading-relaxed mb-2">{t('faq.technicalQuestion')}</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('faq.technicalAnswer')}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground leading-relaxed mb-2">{t('faq.deleteQuestion')}</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('faq.deleteAnswer')}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground leading-relaxed mb-2">{t('faq.accountQuestion')}</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('faq.accountAnswer')}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground leading-relaxed mb-2">{t('faq.whyAccountQuestion')}</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('faq.whyAccountAnswer')}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground leading-relaxed mb-2">{t('faq.privacyQuestion')}</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('faq.privacyAnswer')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 