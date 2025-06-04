import { useState, useEffect } from 'react';
import { CourseCard } from '@/components/CourseCard';
import { LecturerCard } from '@/components/LecturerCard';
import { StatsCard } from '@/components/StatsCard';
import { RollingText } from '@/components/RollingText';
import { FloatingGlare } from '@/components/FloatingGlare';
import { FloatingCircles } from '@/components/FloatingCircles';
import { BookOpen, Users, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

const Index = () => {
  const { t } = useLanguage();
  const [isMobile, setIsMobile] = useState(false);

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

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <FloatingCircles zIndex={0} />
      {/* 在桌面版顯示 FloatingGlare，手機版跳過以減少重疊 */}
      {!isMobile && <FloatingGlare count={3} className="fixed inset-0 top-16 z-0" />}
      <div className="container mx-auto px-4 py-8 space-y-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center py-12 animate-fade-in relative overflow-visible">
          {/* 在桌面版才顯示額外的 FloatingCircles */}
          {!isMobile && <FloatingCircles zIndex={0} className="absolute inset-0 w-full h-full" />}
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {t('hero.title')} <span className="gradient-text">LingUBible</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            <span className="inline md:block">
              {t('hero.subtitle').split('. ')[0]}
            </span>
            <span className="inline md:block md:ml-0 ml-1">
              {t('hero.subtitle').split('. ')[1]}
            </span>
          </p>
          
          {/* Rolling Text Animation */}
          <div className="text-lg mb-8 max-w-2xl mx-auto flex items-center justify-center gap-0">
            <span className="text-foreground">{t('hero.comeHereTo')}</span>
            <RollingText 
              texts={actionTexts} 
              interval={2000}
            />
          </div>
          
          <Button size="lg" className="gradient-primary hover:opacity-90 text-white font-medium px-8" asChild>
            <Link to="/register">
              {t('hero.getStarted')}
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up relative z-20">
          <StatsCard
            title={t('stats.totalCourses')}
            value="1,247"
            change={`+12% ${t('stats.thisMonth')}`}
            icon={BookOpen}
            trend="up"
          />
          <StatsCard
            title={t('stats.lecturers')}
            value="342"
            change={`+5% ${t('stats.thisMonth')}`}
            icon={Users}
            trend="up"
          />
          <StatsCard
            title={t('stats.reviews')}
            value="8,943"
            change={`+23% ${t('stats.thisMonth')}`}
            icon={Star}
            trend="up"
          />
          <StatsCard
            title={t('stats.activeStudents')}
            value="2,156"
            change={`+8% ${t('stats.thisMonth')}`}
            icon={TrendingUp}
            trend="up"
          />
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="courses" className="space-y-6 relative z-20">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t('tabs.popularCourses')}
            </TabsTrigger>
            <TabsTrigger value="lecturers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('tabs.topLecturers')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t('tabs.popularCourses')}</h2>
              <Button variant="outline">{t('button.viewAll')}</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <div key={course.code} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CourseCard {...course} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="lecturers" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t('tabs.topLecturers')}</h2>
              <Button variant="outline">{t('button.viewAll')}</Button>
            </div>
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
    </div>
  );
};

export default Index;
