import { Star, Users, MessageSquare, BookOpen, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { LecturerWithStats } from '@/types/course';

interface LecturerCardProps {
  lecturer: LecturerWithStats;
}

export function LecturerCard({ lecturer }: LecturerCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  // 防禦性編程：如果 lecturer 為 undefined 或 null，返回 null
  if (!lecturer) {
    console.warn('LecturerCard: lecturer prop is undefined or null');
    return null;
  }

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

  const getTitleDisplay = (title: string) => {
    switch (title) {
      case 'Prof':
        return '教授';
      case 'Dr':
        return '博士';
      case 'Mr':
        return '先生';
      case 'Ms':
        return '女士';
      case 'Ir':
        return '工程師';
      default:
        return title;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="lecturer-card group">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
              {getInitials(lecturer.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors duration-200 line-clamp-2">
              {getTitleDisplay(lecturer.title)} {lecturer.name}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-muted-foreground truncate">{lecturer.email}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">{lecturer.rating.toFixed(1)}</span>
              <span>({lecturer.reviewCount} {t('card.reviews')})</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4 text-gray-700 dark:text-muted-foreground" />
              <span>{lecturer.courseCount} {t('course.courses')}</span>
            </div>
          </div>
          
          <Badge variant="secondary" className="text-xs bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-200">
            <Users className="h-3 w-3 mr-1 text-white dark:text-gray-200" />
            {lecturer.department}
          </Badge>

          {/* 專長領域 */}
          <div className="flex flex-wrap gap-1">
            {lecturer.specialties.slice(0, 3).map((specialty, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-200">
                {specialty}
              </Badge>
            ))}
            {lecturer.specialties.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-200">
                +{lecturer.specialties.length - 3}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              className="flex-1 gradient-primary hover:opacity-90 text-white"
              onClick={() => {
                // TODO: 導航到講師評價頁面
                console.log('Navigate to lecturer reviews:', lecturer.$id);
              }}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              {t('button.review')}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 border-gray-300 hover:bg-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 text-foreground"
              onClick={() => {
                // TODO: 導航到講師詳情頁面
                console.log('Navigate to lecturer detail:', lecturer.$id);
              }}
            >
              {t('button.viewDetails')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
