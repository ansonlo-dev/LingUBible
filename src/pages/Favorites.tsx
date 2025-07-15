import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Heart, BookOpen, User, AlertCircle } from 'lucide-react';
import { FavoritesService, UserFavorite } from '@/services/api/favoritesService';
import { CourseService } from '@/services/api/courseService';
import { getCurrentTermCode } from '@/utils/dateUtils';
import { PopularItemCard } from '@/components/features/reviews/PopularItemCard';
import { useFavorites } from '@/hooks/useFavorites';

interface FavoriteCourse {
  course_code: string;
  course_title: string;
  course_title_tc?: string;
  course_title_sc?: string;
  department: string;
  teachingLanguages: string[];
  average_rating: number;
  review_count: number;
  is_offered_in_current_term: boolean;
  average_workload?: number;
  average_difficulty?: number;
  average_usefulness?: number;
}

interface FavoriteInstructor {
  name: string;
  name_tc?: string;
  name_sc?: string;
  department: string;
  review_count: number;
  average_teaching_score: number;
  average_grading_fairness: number;
  average_gpa: number;
  is_teaching_in_current_term: boolean;
}

const Favorites = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [favoriteCourses, setFavoriteCourses] = useState<FavoriteCourse[]>([]);
  const [favoriteInstructors, setFavoriteInstructors] = useState<FavoriteInstructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [instructorsLoading, setInstructorsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');

  // 使用收藏hook來管理收藏狀態
  const { toggleFavorite, refresh: refreshFavorites } = useFavorites({ preload: true });

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      await Promise.all([loadFavoriteCourses(), loadFavoriteInstructors()]);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast({
        variant: 'destructive',
        title: t('favorites.loadError'),
        description: t('favorites.loadErrorDescription'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavoriteCourses = async () => {
    try {
      setCoursesLoading(true);
      const favorites = await FavoritesService.getUserFavorites('course');
      const coursePromises = favorites.map(async (favorite: UserFavorite) => {
        const courseData = await CourseService.getCourseByCode(favorite.item_id);
        if (courseData) {
          // 獲取課程統計數據
          const stats = await CourseService.getCourseDetailedStats(courseData.course_code);
          return {
            course_code: courseData.course_code,
            course_title: courseData.course_title,
            course_title_tc: courseData.course_title_tc,
            course_title_sc: courseData.course_title_sc,
            department: courseData.department,
            teachingLanguages: await CourseService.getCourseTeachingLanguages(courseData.course_code),
            average_rating: stats.averageRating || 0,
            review_count: stats.reviewCount || 0,
            is_offered_in_current_term: await CourseService.isCourseOfferedInTerm(courseData.course_code, getCurrentTermCode()),
            average_workload: stats.averageWorkload,
            average_difficulty: stats.averageDifficulty,
            average_usefulness: stats.averageUsefulness,
          };
        }
        return null;
      });

      const results = await Promise.all(coursePromises);
      setFavoriteCourses(results.filter(Boolean) as FavoriteCourse[]);
    } catch (error) {
      console.error('Error loading favorite courses:', error);
    } finally {
      setCoursesLoading(false);
    }
  };

  const loadFavoriteInstructors = async () => {
    try {
      setInstructorsLoading(true);
      const favorites = await FavoritesService.getUserFavorites('instructor');
      const instructorPromises = favorites.map(async (favorite: UserFavorite) => {
        const instructorData = await CourseService.getInstructorByName(favorite.item_id);
        if (instructorData) {
          // 獲取講師統計數據
          const stats = await CourseService.getInstructorDetailedStatsOptimized(instructorData.name);
          
          // 獲取講師詳細統計包含GPA
          const allInstructorsWithStats = await CourseService.getAllInstructorsWithDetailedStats();
          const instructorWithGPA = allInstructorsWithStats.find(inst => inst.name === instructorData.name);
          
          return {
            name: instructorData.name,
            name_tc: instructorData.name_tc,
            name_sc: instructorData.name_sc,
            department: instructorData.department,
            review_count: stats.reviewCount || 0,
            average_teaching_score: stats.teachingScore || 0,
            average_grading_fairness: stats.gradingFairness || 0,
            average_gpa: instructorWithGPA?.averageGPA || 0,
            is_teaching_in_current_term: await CourseService.isInstructorTeachingInTerm(instructorData.name, getCurrentTermCode()),
          };
        }
        return null;
      });

      const results = await Promise.all(instructorPromises);
      setFavoriteInstructors(results.filter(Boolean) as FavoriteInstructor[]);
    } catch (error) {
      console.error('Error loading favorite instructors:', error);
    } finally {
      setInstructorsLoading(false);
    }
  };

  const handleRemoveFavorite = async (type: 'course' | 'instructor', itemId: string) => {
    try {
      // Optimistic UI update - remove from list immediately
      if (type === 'course') {
        setFavoriteCourses(prev => prev.filter(course => course.course_code !== itemId));
      } else {
        setFavoriteInstructors(prev => prev.filter(instructor => instructor.name !== itemId));
      }

      // Show success toast immediately
      toast({
        title: t('favorites.removed'),
        description: t(`favorites.${type}Removed`),
      });

      // Perform API call in background
      await toggleFavorite(type, itemId);
      
      // Refresh favorites cache in background
      await refreshFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
      
      // Revert optimistic update on error
      if (type === 'course') {
        await loadFavoriteCourses(); // Reload to restore the item
      } else {
        await loadFavoriteInstructors(); // Reload to restore the item
      }
      
      toast({
        variant: 'destructive',
        title: t('favorites.error'),
        description: t('favorites.errorDescription'),
      });
    }
  };

  const handleTeachingLanguageClick = (languages: string[]) => {
    // 導航到課程頁面並應用教學語言篩選器
    const searchParams = new URLSearchParams();
    languages.forEach(lang => searchParams.append('teachingLanguage', lang));
    navigate(`/courses?${searchParams.toString()}`);
  };



  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold">{t('favorites.title')}</h1>
        <p className="text-muted-foreground">{t('favorites.subtitle')}</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t('favorites.courses')}
              <Badge variant="destructive" className="ml-1 text-xs">
                {favoriteCourses.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="instructors" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('favorites.instructors')}
              <Badge variant="destructive" className="ml-1 text-xs">
                {favoriteInstructors.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses" className="mt-6">
            {coursesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : favoriteCourses.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('favorites.noCourses')}</h3>
                <p className="text-muted-foreground mb-4">{t('favorites.noCoursesDescription')}</p>
                <Button onClick={() => navigate('/courses')}>
                  {t('favorites.browseCourses')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteCourses.map((course) => (
                                  <PopularItemCard
                  key={course.course_code}
                  type="course"
                  code={course.course_code}
                  title={course.course_title}
                  titleTc={course.course_title_tc}
                  titleSc={course.course_title_sc}
                  department={course.department}
                  teachingLanguages={course.teachingLanguages}
                  currentTermTeachingLanguage={null}
                  rating={course.average_rating}
                  reviewCount={course.review_count}
                  isOfferedInCurrentTerm={course.is_offered_in_current_term}
                  averageWorkload={course.average_workload}
                  averageDifficulty={course.average_difficulty}
                  averageUsefulness={course.average_usefulness}
                  isFavorited={true}
                  onFavoriteToggle={() => handleRemoveFavorite('course', course.course_code)}
                  onTeachingLanguageClick={handleTeachingLanguageClick}
                />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Instructors Tab */}
          <TabsContent value="instructors" className="mt-6">
            {instructorsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : favoriteInstructors.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('favorites.noInstructors')}</h3>
                <p className="text-muted-foreground mb-4">{t('favorites.noInstructorsDescription')}</p>
                <Button onClick={() => navigate('/instructors')}>
                  {t('favorites.browseInstructors')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteInstructors.map((instructor) => (
                  <PopularItemCard
                    key={instructor.name}
                    type="instructor"
                    name={instructor.name}
                    nameTc={instructor.name_tc}
                    nameSc={instructor.name_sc}
                    department={instructor.department}
                    reviewCount={instructor.review_count}
                    teachingScore={instructor.average_teaching_score}
                    gradingFairness={instructor.average_grading_fairness}
                    averageGPA={instructor.average_gpa}
                    isTeachingInCurrentTerm={instructor.is_teaching_in_current_term}
                    isFavorited={true}
                    onFavoriteToggle={() => handleRemoveFavorite('instructor', instructor.name)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Favorites; 