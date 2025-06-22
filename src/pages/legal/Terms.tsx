import { useLanguage } from '@/hooks/useLanguage';
import { Shield, Users, FileText, AlertTriangle, Scale, Mail, UserCheck, MessageSquareX, CheckCircle, ShieldCheck, Lock, UserX, ScrollText, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

export default function Terms() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {t('terms.title')}
            </h1>
            <div className="text-muted-foreground text-lg">
              {/* Mobile: single paragraph */}
              <p className="md:hidden">
                {t('terms.subtitle')}
              </p>
              {/* Desktop: two lines */}
              <div className="hidden md:block space-y-1">
                <p>{t('terms.subtitleLine1')}</p>
                <p>{t('terms.subtitleLine2')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {/* 1. User Conduct Guidelines */}
          <Card className="legal-page-card border-gray-400 dark:border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                {t('terms.conduct.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.conduct.content')}
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-muted-foreground">{t('terms.conduct.noSwearing')}</p>
                <p className="text-sm text-muted-foreground">{t('terms.conduct.noPersonalAttacks')}</p>
                <p className="text-sm text-muted-foreground">{t('terms.conduct.noSpam')}</p>
                <p className="text-sm text-muted-foreground">{t('terms.conduct.respectful')}</p>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {t('terms.conduct.violation')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 2. Content Policy */}
          <Card className="legal-page-card border-gray-400 dark:border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareX className="h-5 w-5 text-rose-600" />
                {t('terms.content.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.content.content')}
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-muted-foreground">{t('terms.content.noPolitics')}</p>
                <p className="text-sm text-muted-foreground">{t('terms.content.noReligion')}</p>
                <p className="text-sm text-muted-foreground">{t('terms.content.noUnrelated')}</p>
                <p className="text-sm text-muted-foreground">{t('terms.content.focus')}</p>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {t('terms.content.removal')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 3. Username Policy */}
          <Card className="legal-page-card border-gray-400 dark:border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-cyan-600" />
                {t('terms.username.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.username.content')}
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-muted-foreground">{t('terms.username.offensive')}</p>
                <p className="text-sm text-muted-foreground">{t('terms.username.discretion')}</p>
                <p className="text-sm text-muted-foreground">{t('terms.username.responsibility')}</p>
              </div>
            </CardContent>
          </Card>

          {/* 4. Content Moderation */}
          <Card className="legal-page-card border-gray-400 dark:border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                {t('terms.moderation.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.moderation.content')}
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-muted-foreground">{t('terms.moderation.removal')}</p>
                <p className="text-sm text-muted-foreground">{t('terms.moderation.standards')}</p>
                <p className="text-sm text-muted-foreground">{t('terms.moderation.discretion')}</p>
              </div>
            </CardContent>
          </Card>

          {/* 5. Privacy Protection */}
          <Card className="legal-page-card border-gray-400 dark:border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-indigo-600" />
                {t('terms.privacy.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.privacy.content')}
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-muted-foreground">{t('terms.privacy.anonymity')}</p>
                <p className="text-sm text-muted-foreground">{t('terms.privacy.noDisclosure')}</p>
                <p className="text-sm text-muted-foreground">{t('terms.privacy.dataCollection')}</p>
              </div>
              
              <div className="text-center">
                <Link 
                  to="/privacy" 
                  className="inline-flex items-center text-primary hover:underline"
                >
                  {t('privacy.title')} →
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 6. Terms Changes */}
          <Card className="legal-page-card border-gray-400 dark:border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-orange-600" />
                {t('terms.changes.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.changes.content')}
              </p>
            </CardContent>
          </Card>

          {/* 7. Contact Us */}
          <Card className="legal-page-card border-gray-400 dark:border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-pink-600" />
                {t('terms.contact.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.contact.content')}
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-4" />

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>{t('terms.lastUpdated')}</p>
        </div>
      </div>
    </div>
  );
} 