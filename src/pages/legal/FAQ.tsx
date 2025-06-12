import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { HelpCircle, Flag, Bug, Trash2, UserPlus, Shield, Star, BookOpen, MessageSquare, Search, Settings, Globe, Clock, Award, Lock, Eye, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FAQ() {
  const { t } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    // 處理錨點跳轉
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        // 延遲滾動以確保頁面完全載入
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
          });
        }, 100);
      }
    }
  }, [location.hash]);

  // 處理頁面初次載入時的錨點跳轉
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        // 更長的延遲以確保所有內容都已渲染
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
          });
        }, 300);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {t('faq.title')}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t('faq.subtitle')}
            </p>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-6">
          {/* Account & Registration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                {t('faq.accountQuestion')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('faq.accountAnswer')}
              </p>
            </CardContent>
          </Card>

          {/* Why Account Required */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                {t('faq.whyAccountQuestion')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('faq.whyAccountAnswer')}
              </p>
            </CardContent>
          </Card>

          {/* Signup Required to View Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                {t('faq.signupRequiredQuestion')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('faq.signupRequiredAnswer')}
              </p>
            </CardContent>
          </Card>

          {/* How to Submit Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                {t('faq.reviewQuestion')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('faq.reviewAnswer')}
              </p>
            </CardContent>
          </Card>

          {/* How to Search Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-purple-600" />
                {t('faq.searchQuestion')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('faq.searchAnswer')}
              </p>
            </CardContent>
          </Card>

          {/* Rating System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-600" />
                {t('faq.ratingQuestion')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('faq.ratingAnswer')}
              </p>
            </CardContent>
          </Card>

          {/* Anonymous Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                {t('faq.anonymousQuestion')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('faq.anonymousAnswer')}
              </p>
            </CardContent>
          </Card>

          {/* Privacy Protection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-600" />
                {t('faq.privacyQuestion')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('faq.privacyAnswer')}
              </p>
            </CardContent>
          </Card>

          {/* Password Safety */}
          <Card id="password-safety">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                {t('faq.passwordSafetyQuestion')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p 
                className="text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: t('faq.passwordSafetyAnswer') }}
              />
            </CardContent>
          </Card>

          {/* Language Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-600" />
                {t('faq.languageQuestion')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('faq.languageAnswer')}
              </p>
            </CardContent>
          </Card>

          {/* Update Frequency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-teal-600" />
                {t('faq.updateQuestion')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('faq.updateAnswer')}
              </p>
            </CardContent>
          </Card>

          {/* Report Inappropriate Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-600" />
                {t('faq.reportQuestion')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p 
                className="text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: t('faq.reportAnswer') }}
              />
            </CardContent>
          </Card>

          {/* Technical Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-rose-600" />
                {t('faq.technicalQuestion')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('faq.technicalAnswer')}
              </p>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-gray-600" />
                {t('faq.deleteQuestion')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('faq.deleteAnswer')}
              </p>
            </CardContent>
          </Card>

          {/* Website Free */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                {t('faq.websiteFreeQuestion')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('faq.websiteFreeAnswer')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 