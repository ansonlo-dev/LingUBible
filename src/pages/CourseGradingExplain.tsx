import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Brain, Target, Scale, Crown } from 'lucide-react';

export default function CourseGradingExplain() {
  const { t } = useLanguage();

  const gradingLevels = [
    {
      name: 'Excellent',
      nameKey: 'card.excellent',
      threshold: t('grading.excellentRange'),
      color: 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white border-amber-700 shadow-md shadow-amber-400/30 hover:from-amber-700 hover:to-yellow-700 transition-all duration-200 shine-effect',
      borderColor: 'border-amber-600',
      descriptionKey: 'grading.excellentDesc'
    },
    {
      name: 'Good',
      nameKey: 'card.good', 
      threshold: t('grading.goodRange'),
      color: 'bg-green-500 text-white border-green-600 shadow-sm hover:bg-green-700 transition-all duration-200',
      borderColor: 'border-green-600',
      descriptionKey: 'grading.goodDesc'
    },
    {
      name: 'Average',
      nameKey: 'card.average',
      threshold: t('grading.averageRange'),
      color: 'bg-yellow-700 text-white border-yellow-800 shadow-sm hover:bg-yellow-900 transition-all duration-200',
      borderColor: 'border-yellow-700',
      descriptionKey: 'grading.averageDesc'
    },
    {
      name: 'Poor',
      nameKey: 'card.poor',
      threshold: t('grading.poorRange'),
      color: 'bg-orange-500 text-white border-orange-600 shadow-sm hover:bg-orange-700 transition-all duration-200',
      borderColor: 'border-orange-600',
      descriptionKey: 'grading.poorDesc'
    },
    {
      name: 'Terrible',
      nameKey: 'card.terrible',
      threshold: t('grading.terribleRange'),
      color: 'bg-red-600 text-white border-red-700 shadow-md shadow-red-400/30 hover:bg-red-800 transition-all duration-200',
      borderColor: 'border-red-600',
      descriptionKey: 'grading.terribleDesc'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {t('grading.title')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('grading.subtitle')}
          </p>
        </div>

        {/* Minimum Reviews Requirement */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('grading.minimumReviews')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-lg">
                <strong>{t('grading.atLeastFiveReviews')}</strong>
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">{t('grading.whyFiveReviews')}</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>{t('grading.reason1')}</li>
                  <li>{t('grading.reason2')}</li>
                  <li>{t('grading.reason3')}</li>
                  <li>{t('grading.reason4')}</li>
                </ul>
              </div>
              <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-12 md:gap-1 md:items-center">
                <div className="md:col-span-4">
                  <Badge className="bg-blue-400 text-white border-blue-500 hover:bg-blue-600 transition-all duration-200 text-xs">
                    {t('card.notEnoughReviews')}
                  </Badge>
                </div>
                <div className="md:col-span-8">
                  <span className="text-sm text-muted-foreground">
                    {t('grading.coursesWithReviews')}
                  </span>
                </div>
              </div>
              
              {/* No Reviews Badge */}
              <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-12 md:gap-1 md:items-center">
                <div className="md:col-span-4">
                  <Badge className="bg-gray-400 text-white border-gray-500 hover:bg-gray-600 transition-all duration-200 text-xs">
                    {t('card.noReviews')}
                  </Badge>
                </div>
                <div className="md:col-span-8">
                  <span className="text-sm text-muted-foreground">
                    {t('grading.noReviewsDesc')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grading Formula */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('grading.gradingFormula')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">{t('grading.overallScore')}</h4>
                <div className="text-center text-xl font-mono bg-background p-3 rounded border">
                  {t('grading.overallScore')}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Scale className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h5 className="font-semibold text-blue-600 dark:text-blue-400">{t('review.workload')}</h5>
                    </div>
                  <p className="text-xs text-muted-foreground">{t('grading.workloadLabel')}</p>
                </div>
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <h5 className="font-semibold text-amber-600 dark:text-amber-400">{t('review.difficulty')}</h5>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('grading.difficultyLabel')}</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h5 className="font-semibold text-green-600 dark:text-green-400">{t('review.usefulness')}</h5>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('grading.usefulnessLabel')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grading Levels */}
        <Card>
          <CardHeader>
            <CardTitle>{t('grading.qualityGrades')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {gradingLevels.map((level, index) => {
                return (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center py-2 px-3">
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={level.color}>
                          <div className="flex items-center gap-1">
                            {level.name === 'Excellent' && <Crown className="h-3 w-3 text-white flex-shrink-0" />}
                            {t(level.nameKey)}
                          </div>
                        </Badge>
                        <span className="font-mono text-sm ml-auto">{level.threshold}</span>
                      </div>
                      <div className="text-sm text-muted-foreground pl-1">
                        {t(level.descriptionKey)}
                      </div>
                    </div>
                    
                    {/* Desktop Layout */}
                    <div className="hidden md:contents">
                      <div className="col-span-3 flex justify-center items-center">
                        <Badge className={level.color}>
                          <div className="flex items-center gap-1">
                            {level.name === 'Excellent' && <Crown className="h-3 w-3 text-white flex-shrink-0" />}
                            {t(level.nameKey)}
                          </div>
                        </Badge>
                      </div>
                      <div className="col-span-3">
                        <span className="font-mono text-sm">{level.threshold}</span>
                      </div>
                      <div className="col-span-6">
                        <span className="text-sm text-muted-foreground">{t(level.descriptionKey)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
} 