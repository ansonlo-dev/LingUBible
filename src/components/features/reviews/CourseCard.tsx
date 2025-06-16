import { Star, Users, MessageSquare, BookOpen, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { CachedCourseService } from '@/services/cache/cachedCourseService';

interface CourseCardProps {
  title: string;
  code: string;
  department: string;
  language: string;
  rating?: number;
  reviewCount?: number;
  studentCount?: number;
}

export function CourseCard({
  title,
  code,
  department,
  language,
  rating = 0,
  reviewCount = 0,
  studentCount = 0
}: CourseCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  
  const getLanguageColor = (lang: string) => {
    switch (lang) {
      case 'E':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'C':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getLanguageText = (lang: string) => {
    switch (lang) {
      case 'E':
        return 'English';
      case 'C':
        return '中文';
      default:
        return lang;
    }
  };

  const handleCardClick = () => {
    navigate(`/courses/${code}`);
  };

  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation(); // 防止觸發卡片點擊事件
    action();
  };

  // 懸停預載入處理
  const handleMouseEnter = () => {
    // 清除之前的定時器
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }
    
    // 延遲300ms後開始預載入，避免用戶快速掃過時觸發
    preloadTimeoutRef.current = setTimeout(() => {
      CachedCourseService.preloadCourseDetail(code);
    }, 300);
  };

  const handleMouseLeave = () => {
    // 用戶離開時取消預載入
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
      preloadTimeoutRef.current = null;
    }
  };

  // 清理定時器
  useEffect(() => {
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Card 
      className="course-card group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors duration-200 line-clamp-2">
              {title}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-muted-foreground font-mono">{code}</p>
          </div>
          <Badge variant="outline" className={`${getLanguageColor(language)} flex-shrink-0`}>
            <Globe className="h-3 w-3 mr-1" />
            {getLanguageText(language)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* 評分和統計信息 */}
          {(rating > 0 || reviewCount > 0) && (
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                <span>({reviewCount} {t('card.reviews')})</span>
              </div>
              {studentCount > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-700 dark:text-muted-foreground" />
                  <span>{studentCount} {t('card.students')}</span>
                </div>
              )}
            </div>
          )}
          
          {/* 學系標籤 */}
          <Badge variant="secondary" className="text-xs bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-200">
            <BookOpen className="h-3 w-3 mr-1 text-white dark:text-gray-200" />
            {department}
          </Badge>
          
          {/* 操作按鈕 */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button 
              size="sm" 
              className="flex-1 gradient-primary hover:opacity-90 text-white"
              onClick={(e) => handleButtonClick(e, () => navigate(`/write-review/${code}`))}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              撰寫評論
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 border-gray-300 hover:bg-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 text-foreground"
              onClick={(e) => handleButtonClick(e, () => navigate(`/courses/${code}`))}
            >
              {t('button.viewDetails')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
