import { Star, Users, MessageSquare, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    // 監聽主題變化
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  
  const getDifficultyColor = (diff: string) => {
    const easyText = t('difficulty.easy');
    const mediumText = t('difficulty.medium');
    const hardText = t('difficulty.hard');
    
    switch (diff) {
      case easyText: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case mediumText: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case hardText: return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <Card className="course-card group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors duration-200 line-clamp-2">
              {title}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-muted-foreground font-mono">{code}</p>
            <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1 truncate">{t('card.prof')} {lecturer}</p>
          </div>
          <Badge variant="outline" className={`${getDifficultyColor(difficulty)} flex-shrink-0`}>
            {difficulty}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
              <span>({reviewCount} {t('card.reviews')})</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-gray-700 dark:text-muted-foreground" />
              <span>{studentCount} {t('card.students')}</span>
            </div>
          </div>
          
          <Badge variant="secondary" className="text-xs bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-200">
            <BookOpen className="h-3 w-3 mr-1 text-white dark:text-gray-200" />
            {department}
          </Badge>
          
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1 gradient-primary hover:opacity-90 text-white">
              <MessageSquare className="h-4 w-4 mr-1" />
              {t('button.review')}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 border-gray-300 hover:bg-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 text-foreground"
            >
              {t('button.viewDetails')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
