import { Star, Users, MessageSquare, GraduationCap, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';

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

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarFallback className="bg-gradient-primary text-white font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
              {title} {name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{department}</p>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                <span>({reviewCount} {t('card.reviews')})</span>
              </div>
              <div className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                <span>{courseCount} {t('card.courses')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <Award className="h-4 w-4" />
              {t('card.specialties')}
            </p>
            <div className="flex flex-wrap gap-1">
              {specialties.slice(0, 3).map((specialty) => (
                <Badge key={specialty} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {specialties.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{specialties.length - 3} {t('card.more')}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1 bg-gradient-primary hover:opacity-90">
              <MessageSquare className="h-4 w-4 mr-1" />
              {t('button.review')}
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              {t('button.viewProfile')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
