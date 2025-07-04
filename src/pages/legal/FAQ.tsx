import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { HelpCircle, Flag, Bug, Trash2, UserPlus, Shield, Star, BookOpen, MessageSquare, Search, Settings, Globe, Clock, Award, Lock, Eye, DollarSign, Users, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
          // 使用多種方法確保在所有設備上都能正常工作
          try {
            element.scrollIntoView({ 
              behavior: 'smooth',
              block: 'center'
            });
          } catch (error) {
            // 如果 smooth 滾動失敗，使用立即滾動作為後備
            element.scrollIntoView({ block: 'center' });
          }
        }, 100);
      }
    }
  }, [location.hash]);

  // 處理頁面初次載入時的錨點跳轉
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        // 手機設備需要更長的延遲以確保所有內容都已渲染
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const delay = isMobile ? 800 : 300;
        
        setTimeout(() => {
          try {
            element.scrollIntoView({ 
              behavior: 'smooth',
              block: 'center'
            });
          } catch (error) {
            // 如果 smooth 滾動失敗，使用立即滾動作為後備
            element.scrollIntoView({ block: 'center' });
          }
          
          // 額外的後備方案：使用 window.scrollTo
          setTimeout(() => {
            const rect = element.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const targetY = rect.top + scrollTop - (window.innerHeight / 2) + (rect.height / 2);
            
            try {
              window.scrollTo({
                top: targetY,
                behavior: 'smooth'
              });
            } catch (error) {
              window.scrollTo(0, targetY);
            }
          }, 100);
        }, delay);
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
        <div className="space-y-8">
          {/* Account & Registration Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-foreground">
                {t('faq.section.account')}
              </h2>
            </div>
            
            {/* Account Creation */}
            <Card className="legal-page-card border-gray-400 dark:border-gray-600">
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
            <Card className="legal-page-card border-gray-400 dark:border-gray-600">
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
            <Card className="legal-page-card border-gray-400 dark:border-gray-600">
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

            {/* Password Safety */}
            <Card id="password-safety" className="legal-page-card border-gray-400 dark:border-gray-600">
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
          </div>

          <Separator />

          {/* Navigation & Usage Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Navigation className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-foreground">
                {t('faq.section.navigation')}
              </h2>
            </div>

            {/* Courses vs Instructors Pages */}
            <Card className="legal-page-card border-gray-400 dark:border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  {t('faq.coursesVsInstructorsQuestion')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {t('faq.coursesVsInstructorsAnswer')}
                </p>
              </CardContent>
            </Card>

            {/* How to Search Courses */}
            <Card className="legal-page-card border-gray-400 dark:border-gray-600">
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
          </div>

          <Separator />

          {/* Reviews & Ratings Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-6 w-6 text-yellow-600" />
              <h2 className="text-2xl font-semibold text-foreground">
                {t('faq.section.reviews')}
              </h2>
            </div>

            {/* How to Submit Reviews */}
            <Card className="legal-page-card border-gray-400 dark:border-gray-600">
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

            {/* Rating System */}
            <Card className="legal-page-card border-gray-400 dark:border-gray-600">
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
            <Card className="legal-page-card border-gray-400 dark:border-gray-600">
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

            {/* Review Submission Limits */}
            <Card className="legal-page-card border-gray-400 dark:border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  {t('faq.reviewLimitsQuestion')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {t('faq.reviewLimitsAnswer')}
                </p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Privacy & Security Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-cyan-600" />
              <h2 className="text-2xl font-semibold text-foreground">
                {t('faq.section.privacy')}
              </h2>
            </div>

            {/* Privacy Protection */}
            <Card className="legal-page-card border-gray-400 dark:border-gray-600">
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
          </div>

          <Separator />

          {/* General Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-semibold text-foreground">
                {t('faq.section.general')}
              </h2>
            </div>

            {/* Language Support */}
            <Card className="legal-page-card border-gray-400 dark:border-gray-600">
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
            <Card className="legal-page-card border-gray-400 dark:border-gray-600">
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

            {/* Website Free */}
            <Card className="legal-page-card border-gray-400 dark:border-gray-600">
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

          <Separator />

          {/* Support & Help Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="h-6 w-6 text-rose-600" />
              <h2 className="text-2xl font-semibold text-foreground">
                {t('faq.section.support')}
              </h2>
            </div>

            {/* Report Inappropriate Content */}
            <Card className="legal-page-card border-gray-400 dark:border-gray-600">
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
            <Card className="legal-page-card border-gray-400 dark:border-gray-600">
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
            <Card className="legal-page-card border-gray-400 dark:border-gray-600">
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
          </div>
        </div>
      </div>
    </div>
  );
} 