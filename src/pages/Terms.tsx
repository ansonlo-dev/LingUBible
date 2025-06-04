import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Users, Shield, AlertTriangle, Scale, Gavel } from 'lucide-react';

export default function Terms() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              {t('terms.title')}
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {t('terms.subtitle')}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('terms.lastUpdated')}: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                {t('terms.introduction.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('terms.introduction.content1')}</p>
              <p>{t('terms.introduction.content2')}</p>
              <p>{t('terms.introduction.content3')}</p>
            </CardContent>
          </Card>

          {/* Acceptance of Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                {t('terms.acceptance.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('terms.acceptance.content1')}</p>
              <p>{t('terms.acceptance.content2')}</p>
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <p className="text-sm font-medium">
                  {t('terms.acceptance.important')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('terms.accounts.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li>• {t('terms.accounts.eligibility')}</li>
                <li>• {t('terms.accounts.accuracy')}</li>
                <li>• {t('terms.accounts.security')}</li>
                <li>• {t('terms.accounts.responsibility')}</li>
                <li>• {t('terms.accounts.termination')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Conduct */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('terms.conduct.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('terms.conduct.intro')}</p>
              
              <div>
                <h3 className="font-semibold mb-3 text-green-600 dark:text-green-400">
                  {t('terms.conduct.allowed.title')}
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• {t('terms.conduct.allowed.honest')}</li>
                  <li>• {t('terms.conduct.allowed.respectful')}</li>
                  <li>• {t('terms.conduct.allowed.constructive')}</li>
                  <li>• {t('terms.conduct.allowed.relevant')}</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3 text-red-600 dark:text-red-400">
                  {t('terms.conduct.prohibited.title')}
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• {t('terms.conduct.prohibited.harassment')}</li>
                  <li>• {t('terms.conduct.prohibited.false')}</li>
                  <li>• {t('terms.conduct.prohibited.spam')}</li>
                  <li>• {t('terms.conduct.prohibited.illegal')}</li>
                  <li>• {t('terms.conduct.prohibited.impersonation')}</li>
                  <li>• {t('terms.conduct.prohibited.privacy')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Content and Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>{t('terms.content.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('terms.content.ownership')}</p>
              <p>{t('terms.content.license')}</p>
              <p>{t('terms.content.moderation')}</p>
              <p>{t('terms.content.removal')}</p>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle>{t('terms.intellectual.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('terms.intellectual.platform')}</p>
              <p>{t('terms.intellectual.respect')}</p>
              <p>{t('terms.intellectual.dmca')}</p>
            </CardContent>
          </Card>

          {/* Disclaimers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {t('terms.disclaimers.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  {t('terms.disclaimers.important')}
                </p>
                <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <li>• {t('terms.disclaimers.accuracy')}</li>
                  <li>• {t('terms.disclaimers.availability')}</li>
                  <li>• {t('terms.disclaimers.decisions')}</li>
                  <li>• {t('terms.disclaimers.affiliation')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle>{t('terms.liability.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('terms.liability.content1')}</p>
              <p>{t('terms.liability.content2')}</p>
              <p>{t('terms.liability.content3')}</p>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle>{t('terms.termination.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('terms.termination.user')}</p>
              <p>{t('terms.termination.platform')}</p>
              <p>{t('terms.termination.effect')}</p>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>{t('terms.changes.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t('terms.changes.content1')}</p>
              <p>{t('terms.changes.content2')}</p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>{t('terms.contact.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{t('terms.contact.content')}</p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium">LingUBible Team</p>
                <p className="text-muted-foreground">legal@lingubible.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 