import { useState, useEffect } from 'react';
import { CourseCard } from "@/components/features/reviews/CourseCard";
import { StatsCard } from "@/components/features/reviews/StatsCard";
import { PopularItemCard } from "@/components/features/reviews/PopularItemCard";
import { RollingText } from "@/components/features/animations/RollingText";
import { FloatingGlare } from "@/components/features/animations/FloatingGlare";
import { FloatingCircles } from "@/components/features/animations/FloatingCircles";

import { BookOpen, Users, Star, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WingedButton } from '@/components/ui/winged-button';
import { HeavenTransition } from '@/components/ui/heaven-transition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRegisteredUsers } from '@/hooks/useRegisteredUsers';
import { Link, useNavigate } from 'react-router-dom';
import { CourseService } from '@/services/api/courseService';
import { CourseWithStats, InstructorWithStats } from '@/services/api/courseService';

const Index = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [showHeavenTransition, setShowHeavenTransition] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<{ x: number; y: number } | undefined>();
  const { stats: registeredUsersStats, loading: registeredUsersLoading } = useRegisteredUsers();

  // 熱門內容狀態
  const [popularCourses, setPopularCourses] = useState<CourseWithStats[]>([]);
  const [popularInstructors, setPopularInstructors] = useState<InstructorWithStats[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 載入熱門內容
  useEffect(() => {
    const loadPopularContent = async () => {
      try {
        setPopularLoading(true);
        setPopularError(null);

        const [courses, instructors] = await Promise.all([
                  CourseService.getPopularCourses(),
        CourseService.getPopularInstructors()
        ]);

        setPopularCourses(courses);
        setPopularInstructors(instructors);
      } catch (error) {
        console.error('Error loading popular content:', error);
        setPopularError('載入熱門內容時發生錯誤');
      } finally {
        setPopularLoading(false);
      }
    };

    loadPopularContent();
  }, []);

  // Get the actions as an array directly from the translation
  const actions = t('hero.actions');
  const actionTexts = Array.isArray(actions) ? actions : [actions];

  // Handle heaven transition to register page or navigate to courses
  const handleGetStartedClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    
    // 如果用戶已登入，導航到課程頁面
    if (user) {
      navigate('/courses');
      return;
    }
    
    // 獲取按鈕位置
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    
    setButtonPosition({ x: centerX, y: centerY });
    setShowHeavenTransition(true);
  };

  const handleTransitionComplete = () => {
    console.log('Transition complete, navigating to register');
    setShowHeavenTransition(false);
    setButtonPosition(undefined);
    navigate('/register');
  };

  return (
    <>
      {/* 全頁面浮動效果 - 固定定位覆蓋整個視窗，放在最外層 */}
      <FloatingCircles zIndex={-1} className="fixed inset-0 w-full h-full" style={{ zIndex: -1 }} />
      {/* 在桌面版顯示 FloatingGlare，手機版跳過以減少重疊 */}
      {!isMobile && <FloatingGlare count={4} className="fixed inset-0 w-full h-full" style={{ zIndex: -2 }} />}
      
      <div className="bg-background relative overflow-x-hidden min-h-screen">
      <div className="container mx-auto px-4 py-6 pb-4 space-y-6 relative z-10">
        {/* Hero Section */}
        <div className="text-center py-8 md:py-12 animate-fade-in relative overflow-visible z-30">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="neon-glow-text">{t('hero.title')}</span>{' '}
            <span className="red-neon-glow-text">LingUBible</span>
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-muted-foreground mb-3">
            {t('hero.regBible')}
          </h2>
          <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            {/* 桌面版：一行顯示 */}
            <span className="hidden md:block">
              {t('hero.subtitleDesktop')}
            </span>
            {/* 手機版：英文兩行，中文一行 */}
            <span className="block md:hidden">
              {language === 'en' ? (
                <>
                  <span className="block">{t('hero.subtitleMobileLine1')}</span>
                  <span className="block">{t('hero.subtitleMobileLine2')}</span>
                </>
              ) : (
                <span className="block">{t('hero.subtitleMobileLine1')}</span>
              )}
            </span>
          </p>
          
          {/* Rolling Text Animation */}
          <div className="text-lg mb-6 max-w-2xl mx-auto flex items-center justify-center">
            <span className="text-foreground">{t('hero.comeHereTo')}</span>
            <span>&nbsp;</span>
            <RollingText 
              texts={actionTexts} 
              interval={2000}
            />
          </div>
          
          {/* SEO 增強：添加隱藏的關鍵字內容 */}
          <div className="sr-only">
            <h2>嶺南大學課程評價平台 - Reg科聖經</h2>
            <p>LingUBible 是專為嶺南大學學生設計的課程和講師評價平台。在這裡你可以查看真實的課程評價、講師評分，找到最適合的選修課和必修課。我們的平台幫助嶺大學生做出明智的選課決定，是你的選課神器和學習夥伴。</p>
            <p>功能包括：課程評論、教授評價、學生心得分享、選課指南、課程推薦等。無論你是新生還是高年級學生，Reg科聖經都能為你的學習之路提供寶貴的參考。</p>
          </div>
          
          <div className="relative z-50" style={{ zIndex: 9999 }}>
            <WingedButton 
              size="lg" 
              className="gradient-primary-shine hover:opacity-90 text-white font-bold px-8 relative z-50"
              onClick={handleGetStartedClick}
              style={{ zIndex: 9999 }}
            >
              {user ? t('hero.explore') : t('hero.getStarted')}
            </WingedButton>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <StatsCard
            icon={BookOpen}
            title={t('stats.courses')}
            value="100+"
          />
          <StatsCard
            icon={Users}
            title={t('stats.users')}
            value={registeredUsersLoading ? "..." : registeredUsersStats.totalRegisteredUsers.toString()}
            isLoading={registeredUsersLoading}
          />
          <StatsCard
            icon={Star}
            title={t('stats.reviews')}
            value="500+"
          />
        </div>

        {/* Featured Content Section */}
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-3xl font-bold text-center mb-8">{t('featured.title')}</h2>
          
          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger 
                value="courses" 
                className="hover:scale-105 hover:shadow-md transition-[transform,box-shadow] duration-200 data-[state=active]:shadow-lg"
              >
                {t('featured.courses')}
              </TabsTrigger>
              <TabsTrigger 
                value="instructors" 
                className="hover:scale-105 hover:shadow-md transition-[transform,box-shadow] duration-200 data-[state=active]:shadow-lg"
              >
                                  {t('featured.instructors')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-6">
              {popularLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">{t('common.loading')}</p>
                  </div>
                </div>
              ) : popularError ? (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('common.error')}</h3>
                  <p className="text-muted-foreground">{popularError}</p>
                </div>
              ) : popularCourses.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('featured.noPopularCourses')}</h3>
                  <p className="text-muted-foreground">{t('featured.noPopularCoursesDesc')}</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">{t('featured.popularCourses')}</h3>
                    <p className="text-muted-foreground">{t('featured.popularCoursesDesc')}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {popularCourses.map((course) => (
                      <PopularItemCard
                        key={course.$id}
                        type="course"
                        title={course.course_title}
                        code={course.course_code}
                        department={course.course_department}
                        language={course.course_language}
                        rating={course.averageRating}
                        reviewCount={course.reviewCount}
                        studentCount={course.studentCount}
                      />
                    ))}
                  </div>
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/courses')}
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {t('featured.viewAllCourses')}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="instructors" className="space-y-6">
              {popularLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">{t('common.loading')}</p>
                  </div>
                </div>
              ) : popularError ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('common.error')}</h3>
                  <p className="text-muted-foreground">{popularError}</p>
                </div>
              ) : popularInstructors.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('featured.noPopularInstructors')}</h3>
                  <p className="text-muted-foreground">{t('featured.noPopularInstructorsDesc')}</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">{t('featured.popularInstructors')}</h3>
                    <p className="text-muted-foreground">{t('featured.popularInstructorsDesc')}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {popularInstructors.map((instructor) => (
                      <PopularItemCard
                        key={instructor.$id}
                        type="instructor"
                        name={instructor.name}
                        email={instructor.email}
                        instructorType={instructor.type}
                        courseCount={instructor.courseCount}
                        reviewCount={instructor.reviewCount}
                        averageRating={instructor.averageRating}
                      />
                    ))}
                  </div>
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/instructors')}
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {t('featured.viewAllInstructors')}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Heaven Transition Effect */}
        {showHeavenTransition && (
          <HeavenTransition
            isActive={showHeavenTransition}
            onComplete={handleTransitionComplete}
            buttonPosition={buttonPosition}
          />
        )}
      </div>
      </div>
    </>
  );
};

export default Index;
