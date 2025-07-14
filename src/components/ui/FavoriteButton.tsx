import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LanguageContext } from '@/contexts/LanguageContext';
import { useFavoriteStatus } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface FavoriteButtonProps {
  type: 'course' | 'instructor';
  itemId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  showText?: boolean;
  externalIsFavorited?: boolean;
  onToggle?: (newState: boolean) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  type,
  itemId,
  className,
  size = 'md',
  variant = 'ghost',
  showText = false,
  externalIsFavorited,
  onToggle
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const { isFavorited: hookIsFavorited, toggle, isLoading } = useFavoriteStatus(type, itemId);
  
  const isFavorited = externalIsFavorited !== undefined ? externalIsFavorited : hookIsFavorited;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        variant: 'destructive',
        title: t('favorites.loginRequired'),
        description: t('favorites.loginRequiredDescription'),
      });
      return;
    }

    try {
      let newFavoriteStatus: boolean;
      
      if (onToggle && externalIsFavorited !== undefined) {
        newFavoriteStatus = !externalIsFavorited;
        onToggle(newFavoriteStatus);
      } else {
        // Calculate new state immediately
        newFavoriteStatus = !isFavorited;
      }
      
      // Show toast immediately with optimistic update
      toast({
        title: newFavoriteStatus ? t('favorites.added') : t('favorites.removed'),
        description: newFavoriteStatus 
          ? t(`favorites.${type}Added`) 
          : t(`favorites.${type}Removed`),
      });

      // Perform the actual API call in background
      if (!(onToggle && externalIsFavorited !== undefined)) {
        await toggle();
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast({
        variant: 'destructive',
        title: t('favorites.error'),
        description: error.message || t('favorites.errorDescription'),
      });
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        // If showing text, use consistent height h-10 to match other buttons
        return showText ? 'h-10 w-10' : 'h-12 w-12';
      default:
        return 'h-10 w-10';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'lg':
        // Larger icon on mobile portrait, normal size on landscape and desktop
        return 'h-6 w-6 landscape:h-5 landscape:w-5 sm:h-5 sm:w-5';
      default:
        return 'h-4 w-4';
    }
  };

  return (
    <Button
      variant={variant}
      size={showText ? undefined : "icon"}
      className={cn(
        // Base size - always start with icon size
        getSizeClasses(),
        // Responsive expansion only when showText is true
        showText && [
          // Mobile portrait: maintain width from parent, expand height and add padding
          'h-auto px-3 py-2',
          // Landscape and desktop: auto width and height with padding
          'landscape:h-auto landscape:w-auto landscape:px-3 landscape:py-2',
          'sm:h-auto sm:w-auto sm:px-3 sm:py-2'
        ],
        'transition-all duration-200',
        'hover:bg-red-500/20 hover:border-red-500/50',
        className
      )}
      onClick={handleFavoriteClick}
      disabled={isLoading}
      title={isFavorited ? t('favorites.removeFromFavorites') : t('favorites.addToFavorites')}
    >
      <Heart
        className={cn(
          getIconSize(),
          'transition-all duration-200',
          showText && 'landscape:mr-2 sm:mr-2',
          isFavorited 
            ? 'fill-red-500 text-red-500' 
            : 'text-muted-foreground hover:fill-red-500 hover:text-red-500'
        )}
      />
      {showText && (
        <>
          {/* Mobile portrait: short text */}
          <span className="text-sm font-medium landscape:hidden sm:hidden">
            {t('favorites.favorites')}
          </span>
          {/* Landscape and desktop: full text */}
          <span className="text-sm font-medium hidden landscape:inline sm:inline">
            {isFavorited ? t('favorites.removeFromFavorites') : t('favorites.addToFavorites')}
          </span>
        </>
      )}
    </Button>
  );
}; 