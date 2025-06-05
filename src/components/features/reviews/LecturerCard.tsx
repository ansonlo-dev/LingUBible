import { Star, Users, MessageSquare, GraduationCap, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

interface LecturerCardProps {
  name: string;
  department: string;
  title: string;
  rating: number;
  reviewCount: number;
  courseCount: number;
  specialties: string[];
}

export function LecturerCard({
  name,
  department,
  title,
  rating,
  reviewCount,
  courseCount,
  specialties
}: LecturerCardProps) {
  const { t } = useLanguage();
  const initials = name.split(' ').map(n => n[0]).join('');
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

  return (
    <Card className="course-card group">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20 flex-shrink-0">
            <AvatarFallback className="gradient-primary text-white font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors duration-200 line-clamp-2">
              {title} {name}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-muted-foreground truncate">{department}</p>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                <span>({reviewCount} {t('card.reviews')})</span>
              </div>
              <div className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4 text-gray-700 dark:text-muted-foreground" />
                <span>{courseCount} {t('card.courses')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1 text-gray-700 dark:text-foreground">
              <Award className="h-4 w-4 text-gray-700 dark:text-muted-foreground" />
              {t('card.specialties')}
            </p>
            <div className="flex flex-wrap gap-1">
              {specialties.slice(0, 3).map((specialty) => (
                <Badge key={specialty} variant="secondary" className="text-xs bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-200">
                  {specialty}
                </Badge>
              ))}
              {specialties.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-200">
                  +{specialties.length - 3} {t('card.more')}
                </Badge>
              )}
            </div>
          </div>
          
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
              {t('button.viewProfile')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
