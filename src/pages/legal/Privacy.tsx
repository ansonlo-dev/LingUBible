import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Database, Eye, Clock, Lock, UserCheck, Cookie, FileText, Mail, Server, Users, Timer, ShieldCheck, Scale, Zap, ScrollText, MessageCircle, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export default function Privacy() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {t('privacy.title')}
            </h1>
          </div>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {t('privacy.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.intro')}
            </p>
          </CardContent>
        </Card>

        {/* Privacy Sections */}
        <div className="space-y-6">
          {/* 1. Data Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-600" />
                {t('privacy.dataCollection.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {t('privacy.dataCollection.content')}
              </p>
              
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      {t('privacy.dataCollection.sessionTime')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      {t('privacy.dataCollection.ipAddress')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                      {t('privacy.dataCollection.userAgent')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold text-foreground mb-3">
                  {t('privacy.dataCollection.purpose')}
                </h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-muted-foreground">{t('privacy.dataCollection.security')}</p>
                  <p className="text-sm text-muted-foreground">{t('privacy.dataCollection.analytics')}</p>
                  <p className="text-sm text-muted-foreground">{t('privacy.dataCollection.technical')}</p>
                  <p className="text-sm text-muted-foreground">{t('privacy.dataCollection.compliance')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-red-600" />
                {t('privacy.dataSecurity.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {t('privacy.dataSecurity.content')}
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-muted-foreground">{t('privacy.dataSecurity.encryption')}</p>
                <p className="text-sm text-muted-foreground">{t('privacy.dataSecurity.accessControl')}</p>
                <p className="text-sm text-muted-foreground">{t('privacy.dataSecurity.monitoring')}</p>
                <p className="text-sm text-muted-foreground">{t('privacy.dataSecurity.updates')}</p>
              </div>
            </CardContent>
          </Card>

          {/* 3. Anonymity Protection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                {t('privacy.anonymity.title')}
                <Badge variant="secondary" className="ml-2 bg-gray-700 text-white hover:bg-gray-600">{t('privacy.important')}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {t('privacy.anonymity.content')}
              </p>
              
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {t('privacy.anonymity.strictConfidentiality')}
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {t('privacy.anonymity.noDisclosure')}
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {t('privacy.anonymity.internalAccess')}
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {t('privacy.anonymity.legalProtection')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-orange-600" />
                {t('privacy.dataRetention.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {t('privacy.dataRetention.content')}
              </p>
              
              <div className="bg-muted/50 rounded-lg p-2 space-y-1">
                <div className="flex items-center gap-3 px-2 py-1">
                  <span className="text-sm text-muted-foreground flex-1">{t('privacy.dataRetention.sessionData')}</span>
                  <Badge variant="outline">{t('privacy.days30')}</Badge>
                </div>
                
                <div className="flex items-center gap-3 px-2 py-1">
                  <span className="text-sm text-muted-foreground flex-1">{t('privacy.dataRetention.logData')}</span>
                  <Badge variant="outline">{t('privacy.days90')}</Badge>
                </div>
                
                <div className="flex items-center gap-3 px-2 py-1">
                  <span className="text-sm text-muted-foreground flex-1">{t('privacy.dataRetention.userContent')}</span>
                  <Badge variant="outline">{t('privacy.anytime')}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Cookie Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                {t('privacy.cookies.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacy.cookies.content')}
              </p>
            </CardContent>
          </Card>

          {/* 6. User Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-indigo-600" />
                {t('privacy.userRights.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {t('privacy.userRights.content')}
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-muted-foreground">{t('privacy.userRights.access')}</p>
                <p className="text-sm text-muted-foreground">{t('privacy.userRights.correction')}</p>
                <p className="text-sm text-muted-foreground">{t('privacy.userRights.deletion')}</p>
                <p className="text-sm text-muted-foreground">{t('privacy.userRights.portability')}</p>
              </div>
            </CardContent>
          </Card>

          {/* 7. Policy Changes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-teal-600" />
                {t('privacy.changes.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacy.changes.content')}
              </p>
            </CardContent>
          </Card>

          {/* 8. Contact Us */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-pink-600" />
                {t('privacy.contact.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacy.contact.content')}
              </p>
            </CardContent>
          </Card>

          {/* 9. reCAPTCHA Notice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600" />
                {t('privacy.recaptcha.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {t('privacy.recaptcha.content')}{' '}
                <a 
                  href="https://policies.google.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {t('privacy.recaptcha.privacyPolicy')}
                </a>{' '}
                {t('privacy.recaptcha.and')}{' '}
                <a 
                  href="https://policies.google.com/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {t('privacy.recaptcha.termsOfService')}
                </a>{' '}
                {t('privacy.recaptcha.apply')}
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-4" />

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>{t('privacy.lastUpdated')}</p>
        </div>
      </div>
    </div>
  );
} 