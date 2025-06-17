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
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CourseService } from '@/services/api/courseService';
import { 
  Instructor
} from '@/services/api/courseService';
import { InstructorCardSkeleton } from '@/components/features/reviews/InstructorCardSkeleton';
import { useDebounce } from '@/hooks/useDebounce';

interface InstructorWithStats extends Instructor {
  courseCount: number;
  reviewCount: number;
  averageRating: number;
}

const InstructorsList = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<InstructorWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const loadInstructors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 獲取講師列表（使用緩存）
        const instructorsList = await CourseService.getAllInstructors();
        
        // 先顯示基本講師列表，統計信息設為預設值
        const instructorsWithDefaultStats: InstructorWithStats[] = instructorsList.map(instructor => ({
          ...instructor,
          courseCount: 0,
          reviewCount: 0,
          averageRating: 0
        }));
        
        setInstructors(instructorsWithDefaultStats);
        setLoading(false);
        
        // 分批載入前20個講師的統計信息
        const batchSize = 5;
        const maxInstructors = Math.min(20, instructorsList.length);
        
        for (let i = 0; i < maxInstructors; i += batchSize) {
          const batch = instructorsList.slice(i, i + batchSize);
          
          // 並行載入這一批講師的統計信息
          const batchStats = await Promise.all(
            batch.map(async (instructor) => {
              try {
                const stats = await CourseService.getInstructorStatsOptimized(instructor.name);
                return {
                  name: instructor.name,
                  stats
                };
              } catch (error) {
                console.error(`Error loading stats for instructor ${instructor.name}:`, error);
                return {
                  name: instructor.name,
                  stats: { courseCount: 0, reviewCount: 0, averageRating: 0 }
                };
              }
            })
          );
          
          // 更新講師列表中對應講師的統計信息
          setInstructors(prevInstructors => 
            prevInstructors.map(instructor => {
              const batchStat = batchStats.find(stat => stat.name === instructor.name);
              if (batchStat) {
                return {
                  ...instructor,
                  courseCount: batchStat.stats.courseCount,
                  reviewCount: batchStat.stats.reviewCount,
                  averageRating: batchStat.stats.averageRating
                };
              }
              return instructor;
            })
          );
          
          // 在批次之間添加小延遲，避免過度負載
          if (i + batchSize < maxInstructors) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
      } catch (error) {
        console.error('Error loading instructors:', error);
        setError(t('common.error'));
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
            <Users className="h-8 w-8" />
            {t('nav.lecturers')}
          </h1>
          
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-4 w-4" />
                <Input
                  placeholder={t('search.placeholder')}
                  value=""
                  disabled
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <InstructorCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('common.error')}</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <Users className="h-8 w-8" />
          {t('nav.lecturers')}
        </h1>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4" />
              <Input
                placeholder={t('search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('instructors.found', { count: filteredInstructors.length })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInstructors.map((instructor) => (
          <Card 
            key={instructor.$id} 
            className="course-card cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
            onClick={() => handleInstructorClick(instructor.name)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg font-semibold truncate">
                  {instructor.name}
                </span>
                <Badge variant="secondary" className="ml-2 shrink-0">
                  {instructor.type}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{instructor.email}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex flex-col items-center p-2 bg-muted rounded">
                    <BookOpen className="h-4 w-4 mb-1" />
                    <span className="font-medium">{instructor.courseCount}</span>
                    <span className="text-xs text-muted-foreground">{t('instructors.courses')}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-muted rounded">
                    <GraduationCap className="h-4 w-4 mb-1" />
                    <span className="font-medium">{instructor.reviewCount}</span>
                    <span className="text-xs text-muted-foreground">{t('instructors.reviews')}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-muted rounded">
                    <Star className="h-4 w-4 mb-1" />
                    <span className="font-medium">
                      {instructor.averageRating > 0 ? instructor.averageRating.toFixed(1) : 'N/A'}
                    </span>
                    <span className="text-xs text-muted-foreground">{t('instructors.rating')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInstructors.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('instructors.noResults')}</h3>
          <p className="text-muted-foreground">{t('instructors.tryDifferentSearch')}</p>
        </div>
      )}
    </div>
  );
};

export default InstructorsList; 