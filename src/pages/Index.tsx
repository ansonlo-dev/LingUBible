import { useState, useEffect } from 'react';
import { CourseCard } from "@/components/features/reviews/CourseCard";
import { LecturerCard } from "@/components/features/reviews/LecturerCard";
import { StatsCard } from "@/components/features/reviews/StatsCard";
import { RollingText } from "@/components/features/animations/RollingText";
import { FloatingGlare } from "@/components/features/animations/FloatingGlare";
import { FloatingCircles } from "@/components/features/animations/FloatingCircles";

import { BookOpen, Users, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WingedButton } from '@/components/ui/winged-button';
import { HeavenTransition } from '@/components/ui/heaven-transition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRegisteredUsers } from '@/hooks/useRegisteredUsers';
import { Link, useNavigate } from 'react-router-dom';
import { CourseService } from '@/services/api/courseService';
import type { UGCourse, LecturerWithStats } from '@/types/course';

const Index = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [showHeavenTransition, setShowHeavenTransition] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<{ x: number; y: number } | undefined>();
  const { stats: registeredUsersStats, loading: registeredUsersLoading } = useRegisteredUsers();
  const [courses, setCourses] = useState<UGCourse[]>([]);
  const [loading, setLoading] = useState(true);

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

  // 載入真實課程數據
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const allCourses = await CourseService.getAllCourses();
        // 只顯示前3個課程作為精選課程
        setCourses(allCourses.slice(0, 3));
      } catch (error) {
        console.error('Error loading courses:', error);
        // 如果載入失敗，使用備用的模擬數據
        setCourses([
          {
            $id: 'cs101',
            code: 'CS101',
            title: t('course.introCS'),
            description: '本課程為計算機科學的入門課程',
            credits: 3,
            department: t('department.computerScience'),
            offered: 'Yes' as const,
            prerequisites: [],
            isActive: true,
            $createdAt: '',
            $updatedAt: ''
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [t]);

  // 載入真實講師數據
  useEffect(() => {
    const loadLecturers = async () => {
      try {
        setLecturersLoading(true);
        const allLecturers = await CourseService.getAllLecturers();
        // 只顯示前3個講師作為頂級講師
        setLecturers(allLecturers.slice(0, 3));
      } catch (error) {
        console.error('Error loading lecturers:', error);
        // 如果載入失敗，設置為空數組
        setLecturers([]);
      } finally {
        setLecturersLoading(false);
      }
    };

    loadLecturers();
  }, []);

  const [lecturers, setLecturers] = useState<LecturerWithStats[]>([]);
  const [lecturersLoading, setLecturersLoading] = useState(true);

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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up relative z-20">
          <StatsCard
            title={t('stats.totalCourses')}
            value="1,247"
            change={`+12% ${t('stats.thisMonth')}`}
            icon={BookOpen}
            trend="up"
            animationDelay={0}
          />
          <StatsCard
            title={t('stats.lecturers')}
            value="342"
            change={`+5% ${t('stats.thisMonth')}`}
            icon={Users}
            trend="up"
            animationDelay={200}
          />
          <StatsCard
            title={t('stats.reviews')}
            value="8,943"
            change={`+23% ${t('stats.thisMonth')}`}
            icon={Star}
            trend="up"
            animationDelay={400}
          />
          <StatsCard
            title={t('stats.registeredStudents')}
            value={registeredUsersStats.totalRegisteredUsers.toLocaleString()}
            change={`+${registeredUsersStats.newUsersLast30Days} ${t('stats.newLast30Days')}`}
            icon={TrendingUp}
            trend="up"
            animationDelay={600}
            isLoading={registeredUsersLoading}
          />
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="courses" className="space-y-6 relative z-20" data-section="courses">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <TabsList className="grid grid-cols-2 w-full sm:w-auto min-w-0 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger 
                value="courses" 
                className="flex items-center gap-2 min-w-0 hover:scale-105 hover:shadow-md transition-[transform,box-shadow] duration-200 data-[state=active]:shadow-lg"
              >
                <BookOpen className="h-4 w-4 flex-shrink-0 transition-colors duration-200" />
                <span className="truncate">{t('tabs.popularCourses')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="lecturers" 
                className="flex items-center gap-2 min-w-0 hover:scale-105 hover:shadow-md transition-[transform,box-shadow] duration-200 data-[state=active]:shadow-lg"
              >
                <Users className="h-4 w-4 flex-shrink-0 transition-colors duration-200" />
                <span className="truncate">{t('tabs.topLecturers')}</span>
              </TabsTrigger>
            </TabsList>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto hover:border-red-500 dark:hover:border-red-500 transition-all duration-200"
              onClick={() => navigate('/courses')}
            >
              {t('button.viewAll')}
            </Button>
          </div>

          <TabsContent value="courses" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>
                  </div>
                ))
              ) : (
                                 courses.map((course, index) => (
                   <div key={course.$id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                     <CourseCard
                       title={course.title}
                       code={course.code}
                       rating={4.5}
                       reviewCount={24}
                       studentCount={156}
                       department={course.department}
                       offered={course.offered || 'Yes'}
                     />
                   </div>
                 ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="lecturers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lecturersLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>
                  </div>
                ))
              ) : (
                lecturers.map((lecturer, index) => (
                  <div key={lecturer.$id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <LecturerCard 
                      lecturer={lecturer}
                    />
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
        {/* Heaven Transition Effect */}
        <HeavenTransition 
          isActive={showHeavenTransition}
          onComplete={handleTransitionComplete}
          duration={1200}
          buttonPosition={buttonPosition}
        />
      </div>
    </>
  );
};

export default Index;
