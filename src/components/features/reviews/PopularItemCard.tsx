import { Star, Users, MessageSquare, BookOpen, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface PopularCourseCardProps {
  type: 'course';
  title: string;
  code: string;
  department: string;
  language: string;
  rating: number;
  reviewCount: number;
  studentCount: number;
}

interface PopularInstructorCardProps {
  type: 'instructor';
  name: string;
  email: string;
  instructorType: string;
  courseCount: number;
  reviewCount: number;
  averageRating: number;
}

type PopularItemCardProps = PopularCourseCardProps | PopularInstructorCardProps;

export const PopularItemCard = (props: PopularItemCardProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleClick = () => {
    if (props.type === 'course') {
      navigate(`/courses/${props.code}`);
    } else {
      navigate(`/instructors/${encodeURIComponent(props.name)}`);
    }
  };

  if (props.type === 'course') {
    return (
      <Card 
        className="course-card cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
        onClick={handleClick}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-primary">{props.code}</span>
              <span className="text-sm font-normal text-muted-foreground line-clamp-2">
                {props.title}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <Badge variant="outline">{props.department}</Badge>
              <Badge variant="secondary">{props.language === 'E' ? 'English' : '中文'}</Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex flex-col items-center p-2 bg-muted rounded">
                <Star className="h-4 w-4 mb-1 text-yellow-500" />
                <span className="font-medium">{props.rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">{t('common.rating')}</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-muted rounded">
                <MessageSquare className="h-4 w-4 mb-1" />
                <span className="font-medium">{props.reviewCount}</span>
                <span className="text-xs text-muted-foreground">{t('common.reviews')}</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-muted rounded">
                <Users className="h-4 w-4 mb-1" />
                <span className="font-medium">{props.studentCount}</span>
                <span className="text-xs text-muted-foreground">{t('common.students')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="course-card cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold truncate">{props.name}</span>
          <Badge variant="secondary" className="ml-2 shrink-0">
            {props.instructorType}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate">{props.email}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="flex flex-col items-center p-2 bg-muted rounded">
              <BookOpen className="h-4 w-4 mb-1" />
              <span className="font-medium">{props.courseCount}</span>
              <span className="text-xs text-muted-foreground">{t('instructors.courses')}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-muted rounded">
              <MessageSquare className="h-4 w-4 mb-1" />
              <span className="font-medium">{props.reviewCount}</span>
              <span className="text-xs text-muted-foreground">{t('instructors.reviews')}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-muted rounded">
              <Star className="h-4 w-4 mb-1 text-yellow-500" />
              <span className="font-medium">
                {props.averageRating > 0 ? props.averageRating.toFixed(1) : 'N/A'}
              </span>
              <span className="text-xs text-muted-foreground">{t('instructors.rating')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 