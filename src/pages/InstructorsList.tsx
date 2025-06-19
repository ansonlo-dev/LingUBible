import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Users, 
  Search,
  Loader2,
  AlertCircle,
  Mail,
  GraduationCap,
  BookOpen,
  Star,
  MessageSquare,
  TrendingUp,
  Award,
  Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CourseService } from '@/services/api/courseService';
import { 
  Instructor,
  InstructorWithDetailedStats
} from '@/services/api/courseService';
import { InstructorCardSkeleton } from '@/components/features/reviews/InstructorCardSkeleton';
import { useDebounce } from '@/hooks/useDebounce';

// Remove the local interface since we're using InstructorWithDetailedStats from the service

const InstructorsList = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<InstructorWithDetailedStats[]>([]);
  const [loading, setLoading] = useState(true);
  // Removed statsLoading since we load everything at once now
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const loadInstructors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 載入所有講師的詳細統計信息
        const instructorsWithDetailedStats = await CourseService.getAllInstructorsWithDetailedStats();
        setInstructors(instructorsWithDetailedStats);
        
      } catch (error) {
        console.error('Error loading instructors:', error);
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    loadInstructors();
  }, [t]);

  // 過濾講師
  const filteredInstructors = instructors.filter(instructor =>
    instructor.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    instructor.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const handleInstructorClick = (instructorName: string) => {
    navigate(`/instructors/${encodeURIComponent(instructorName)}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 頂部區域組件，與課程頁面保持一致
  const HeaderSection = () => (
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        {t('pages.instructors.title')}
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        {t('pages.instructors.subtitle')}
      </p>
    </div>
  );

  // Removed old StatBox components since we're using inline stat boxes now

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* 頁面標題 - 使用與課程頁面相同的樣式 */}
          <HeaderSection />

          {/* 搜尋區域骨架 */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('search.placeholder')}
                disabled
                className="pl-10 h-12 text-base bg-white dark:bg-card border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>

          {/* 載入指示器 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.loading')}
            </div>
          </div>

          {/* 講師卡片骨架 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {Array.from({ length: 8 }).map((_, index) => (
              <InstructorCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* 頁面標題 */}
          <HeaderSection />

          <div className="flex justify-center items-center min-h-[400px]">
            <Card className="max-w-md">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('pages.instructors.loadFailed')}</h3>
                <p className="text-muted-foreground">
                  {t('pages.instructors.loadFailedDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* 頁面標題 */}
        <HeaderSection />

        {/* 搜尋區域 */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('search.placeholder')}
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 h-12 text-base bg-white dark:bg-card border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Removed loading stats indicator since we load everything at once */}

        {/* 講師統計 */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {searchTerm ? (
              t('pages.instructors.foundCount', { count: filteredInstructors.length })
            ) : (
              t('pages.instructors.totalCount', { count: instructors.length })
            )}
          </p>
        </div>

        {/* 講師列表 */}
        {filteredInstructors.length === 0 ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <Card className="max-w-md">
              <CardContent className="p-6 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('pages.instructors.noResults')}</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? t('pages.instructors.tryOtherKeywords') : t('pages.instructors.noInstructorsAvailable')}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {filteredInstructors.map((instructor) => (
              <Card 
                key={instructor.$id} 
                className="course-card group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] overflow-hidden relative"
                onClick={() => handleInstructorClick(instructor.name)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-200 line-clamp-2 mb-1">
                        {instructor.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-muted-foreground">
                        <Mail className="h-3 w-3 shrink-0 text-blue-500" />
                        <span className="truncate">{instructor.email}</span>
                      </div>
                      {/* Review count display */}
                      <div className="flex items-center gap-1 mt-1">
                        <MessageSquare className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {instructor.reviewCount} {instructor.reviewCount === 1 ? t('card.review') : t('card.reviews')}
                        </span>
                      </div>
                    </div>
                    
                    {/* 2個水平統計框 - 教學評分和評分公平性 */}
                    <div className="flex gap-1.5 shrink-0">
                      <div className="flex flex-col items-center px-1.5 py-1.5 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800/30 text-purple-600 dark:text-purple-400 rounded-md border text-xs">
                        <Award className="h-3 w-3 mb-0.5" />
                        <span className="font-bold text-xs">{instructor.teachingScore > 0 ? instructor.teachingScore.toFixed(1) : 'N/A'}</span>
                        <span className="text-xs font-medium leading-tight">{t('card.teaching')}</span>
                      </div>
                      <div className="flex flex-col items-center px-1.5 py-1.5 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400 rounded-md border text-xs">
                        <Scale className="h-3 w-3 mb-0.5" />
                        <span className="font-bold text-xs">{instructor.gradingFairness > 0 ? instructor.gradingFairness.toFixed(1) : 'N/A'}</span>
                        <span className="text-xs font-medium leading-tight">{t('card.grading')}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorsList; 