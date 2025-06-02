import { Star, Users, MessageSquare, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface CourseCardProps {
  title: string;
  code: string;
  lecturer: string;
  rating: number;
  reviewCount: number;
  studentCount: number;
  department: string;
  difficulty: string;
}

export function CourseCard({
  title,
  code,
  lecturer,
  rating,
  reviewCount,
  studentCount,
  department,
  difficulty
}: CourseCardProps) {
  const { t } = useLanguage();
  
  const getDifficultyColor = (diff: string) => {
    const easyText = t('difficulty.easy');
    const mediumText = t('difficulty.medium');
    const hardText = t('difficulty.hard');
    
    switch (diff) {
      case easyText: return 'bg-green-100 text-green-800';
      case mediumText: return 'bg-yellow-100 text-yellow-800';
      case hardText: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground font-mono">{code}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('card.prof')} {lecturer}</p>
          </div>
          <Badge variant="outline" className={getDifficultyColor(difficulty)}>
            {difficulty}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
              <span>({reviewCount} {t('card.reviews')})</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{studentCount} {t('card.students')}</span>
            </div>
          </div>
          
          <Badge variant="secondary" className="text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            {department}
          </Badge>
          
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1 bg-gradient-primary hover:opacity-90">
              <MessageSquare className="h-4 w-4 mr-1" />
              {t('button.review')}
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              {t('button.viewDetails')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
