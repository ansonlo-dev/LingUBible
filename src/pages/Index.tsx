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

const Index = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [showHeavenTransition, setShowHeavenTransition] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<{ x: number; y: number } | undefined>();
  const { stats: registeredUsersStats, loading: registeredUsersLoading } = useRegisteredUsers();

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

  // Mock data
  const courses = [
    {
      title: t('course.introCS'),
      code: "CS101",
      lecturer: "Dr. Sarah Johnson",
      rating: 4.5,
      reviewCount: 24,
      studentCount: 156,
      department: t('department.computerScience'),
      difficulty: t('difficulty.medium')
    },
    {
      title: t('course.advancedMath'),
      code: "MATH301",
      lecturer: "Prof. Michael Chen",
      rating: 4.2,
      reviewCount: 18,
      studentCount: 89,
      department: t('department.mathematics'),
      difficulty: t('difficulty.hard')
    },
    {
      title: t('course.englishLit'),
      code: "ENG201",
      lecturer: "Dr. Emily Davis",
      rating: 4.8,
      reviewCount: 32,
      studentCount: 203,
      department: t('department.english'),
      difficulty: t('difficulty.easy')
    }
  ];

  const lecturers = [
    {
      name: "Sarah Johnson",
      department: t('department.computerScience'),
      title: t('card.prof'),
      rating: 4.6,
      reviewCount: 45,
      courseCount: 3,
      specialties: [t('specialty.programming'), t('specialty.dataStructures'), t('specialty.algorithms'), t('specialty.machineLearning')]
    },
    {
      name: "Michael Chen",
      department: t('department.mathematics'),
      title: t('card.prof'),
      rating: 4.3,
      reviewCount: 28,
      courseCount: 4,
      specialties: [t('specialty.calculus'), t('specialty.linearAlgebra'), t('specialty.statistics')]
    },
    {
      name: "Emily Davis",
      department: t('department.english'),
      title: t('card.prof'),
      rating: 4.7,
      reviewCount: 52,
      courseCount: 5,
      specialties: [t('specialty.literature'), t('specialty.creativeWriting'), t('specialty.poetry'), t('specialty.drama')]
    }
  ];

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
            <TabsList className="grid grid-cols-2 w-full sm:w-auto min-w-0">
              <TabsTrigger value="courses" className="flex items-center gap-2 min-w-0">
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{t('tabs.popularCourses')}</span>
              </TabsTrigger>
              <TabsTrigger value="lecturers" className="flex items-center gap-2 min-w-0">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{t('tabs.topLecturers')}</span>
              </TabsTrigger>
            </TabsList>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={() => navigate('/courses')}
            >
              {t('button.viewAll')}
            </Button>
          </div>

          <TabsContent value="courses" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <div key={course.code} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CourseCard {...course} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="lecturers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lecturers.map((lecturer, index) => (
                <div key={lecturer.name} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <LecturerCard {...lecturer} />
                </div>
              ))}
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
