import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, Github, MessageSquare, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Contact() {
  const { t } = useLanguage();

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Header */}
        <div className="mb-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-1">
              {t('contact.title')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('contact.subtitle')}
            </p>
          </div>
        </div>

        {/* Contact Methods - Full Width */}
        <div className="mb-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                {t('contact.methods')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{t('contact.email')}</p>
                    <a 
                      href="mailto:support@lingubible.com" 
                      className="text-sm text-primary hover:underline"
                    >
                      support@lingubible.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Github className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{t('contact.github')}</p>
                    <a 
                      href="https://github.com/ansonlo-dev/campus-comment-verse" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      github.com/ansonlo-dev/campus-comment-verse
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{t('contact.developer')}</p>
                    <a 
                      href="https://ansonlo.dev/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      ansonlo.dev
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section - Full Width */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                {t('contact.faq')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground leading-relaxed">{t('contact.faqReport')}</h4>
                  <p 
                    className="text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: t('contact.faqReportAnswer') }}
                  />
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground leading-relaxed">{t('contact.faqTechnical')}</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('contact.faqTechnicalAnswer')}
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