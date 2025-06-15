import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
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
import { 
  CourseService, 
  Instructor, 
  InstructorTeachingCourse 
} from '@/services/api/courseService';

interface InstructorWithStats extends Instructor {
  courseCount: number;
  reviewCount: number;
  averageRating: number;
}

const InstructorsList = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [instructors, setInstructors] = useState<InstructorWithStats[]>([]);
  const [filteredInstructors, setFilteredInstructors] = useState<InstructorWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInstructors = async () => {
      try {
        setLoading(true);
        setError(null);

        // 獲取所有講師
        const response = await CourseService.getAllInstructors();
        
        // 為每個講師獲取統計信息
        const instructorsWithStats = await Promise.all(
          response.map(async (instructor) => {
            try {
              const [teachingCourses, reviews] = await Promise.all([
                CourseService.getInstructorTeachingCourses(instructor.name),
                CourseService.getInstructorReviews(instructor.name)
              ]);

              const averageRating = reviews.length > 0 
                ? reviews.reduce((sum, r) => sum + r.instructorDetail.teaching, 0) / reviews.length
                : 0;

              return {
                ...instructor,
                courseCount: teachingCourses.length,
                reviewCount: reviews.length,
                averageRating
              };
            } catch (error) {
              console.error(`Error loading stats for instructor ${instructor.name}:`, error);
              return {
                ...instructor,
                courseCount: 0,
                reviewCount: 0,
                averageRating: 0
              };
            }
          })
        );

        // 按評分和評論數排序
        instructorsWithStats.sort((a, b) => {
          if (b.averageRating !== a.averageRating) {
            return b.averageRating - a.averageRating;
          }
          return b.reviewCount - a.reviewCount;
        });

        setInstructors(instructorsWithStats);
        setFilteredInstructors(instructorsWithStats);
      } catch (err) {
        console.error('Error loading instructors:', err);
        setError(t('instructor.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadInstructors();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredInstructors(instructors);
    } else {
      const filtered = instructors.filter(instructor =>
        instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInstructors(filtered);
    }
  }, [searchTerm, instructors]);

  const handleInstructorClick = (instructorName: string) => {
    navigate(`/instructors/${encodeURIComponent(instructorName)}`);
  };

  const renderRatingStars = (rating: number) => {
    if (rating === 0) return <span className="text-muted-foreground text-sm">{t('instructor.noRating')}</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">{t('instructor.loadingData')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <CardTitle className="text-xl">{t('instructor.loadFailed')}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
{t('instructor.reload')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* 頁面標題 */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">{t('instructor.list')}</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('instructor.listSubtitle')}
        </p>
      </div>

      {/* 搜尋欄 */}
      <Card className="course-card">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('instructor.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm && (
            <p className="text-sm text-muted-foreground mt-2">
{t('instructor.foundCount', { count: filteredInstructors.length })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 教師列表 */}
      {filteredInstructors.length === 0 ? (
        <Card className="course-card">
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? t('instructor.noResults') : t('instructor.noData')}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm ? t('instructor.noResultsDesc') : t('instructor.noDataDesc')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstructors.map((instructor) => (
            <Card 
              key={instructor.$id} 
              className="course-card cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              onClick={() => handleInstructorClick(instructor.name)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{instructor.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {instructor.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* 聯絡信息 */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{instructor.email}</span>
                </div>

                {/* 統計信息 */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                      <BookOpen className="h-3 w-3" />
                      <span>{t('instructor.courses')}</span>
                    </div>
                    <div className="text-lg font-bold text-primary">{instructor.courseCount}</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                      <Users className="h-3 w-3" />
                      <span>{t('instructor.reviews')}</span>
                    </div>
                    <div className="text-lg font-bold text-primary">{instructor.reviewCount}</div>
                  </div>
                </div>

                {/* 評分 */}
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">{t('instructor.rating')}</div>
                  {renderRatingStars(instructor.averageRating)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorsList; 