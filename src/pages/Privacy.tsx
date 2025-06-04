import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, Eye, Lock, Database, Clock, MapPin, Monitor } from 'lucide-react';

export default function Privacy() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              {t('privacy.title')}
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {t('privacy.subtitle')}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('privacy.lastUpdated')}: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {t('privacy.introduction.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('privacy.introduction.content1')}</p>
              <p>{t('privacy.introduction.content2')}</p>
              <p>{t('privacy.introduction.content3')}</p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                {t('privacy.collection.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Account Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {t('privacy.collection.account.title')}
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• {t('privacy.collection.account.email')}</li>
                  <li>• {t('privacy.collection.account.profile')}</li>
                  <li>• {t('privacy.collection.account.preferences')}</li>
                </ul>
              </div>

              <Separator />

              {/* Technical Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  {t('privacy.collection.technical.title')}
                </h3>
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t('privacy.collection.technical.session.title')}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('privacy.collection.technical.session.description')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>{t('privacy.collection.technical.session.purpose')}:</strong> {t('privacy.collection.technical.session.reason')}
                    </p>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t('privacy.collection.technical.ip.title')}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('privacy.collection.technical.ip.description')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>{t('privacy.collection.technical.ip.purpose')}:</strong> {t('privacy.collection.technical.ip.reason')}
                    </p>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      {t('privacy.collection.technical.userAgent.title')}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('privacy.collection.technical.userAgent.description')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>{t('privacy.collection.technical.userAgent.purpose')}:</strong> {t('privacy.collection.technical.userAgent.reason')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('privacy.usage.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• {t('privacy.usage.item1')}</li>
                <li>• {t('privacy.usage.item2')}</li>
                <li>• {t('privacy.usage.item3')}</li>
                <li>• {t('privacy.usage.item4')}</li>
                <li>• {t('privacy.usage.item5')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle>{t('privacy.security.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('privacy.security.content1')}</p>
              <p>{t('privacy.security.content2')}</p>
              <p>{t('privacy.security.content3')}</p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>{t('privacy.rights.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• {t('privacy.rights.access')}</li>
                <li>• {t('privacy.rights.correct')}</li>
                <li>• {t('privacy.rights.delete')}</li>
                <li>• {t('privacy.rights.export')}</li>
                <li>• {t('privacy.rights.restrict')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>{t('privacy.contact.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{t('privacy.contact.content')}</p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium">LingUBible Team</p>
                <p className="text-muted-foreground">privacy@lingubible.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 