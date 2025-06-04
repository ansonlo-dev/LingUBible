import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { SmartAvatar } from '@/components/ui/smart-avatar';
import { AvatarCustomizer } from '@/components/AvatarCustomizer';
import { useCustomAvatar } from '@/hooks/useCustomAvatar';
import { Palette, LogOut } from 'lucide-react';

export function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { customAvatar } = useCustomAvatar();
  const [isDark, setIsDark] = useState(false);

  // 監聽主題變化
  useEffect(() => {
    // 初始檢測
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();

    // 創建 MutationObserver 來監聽 class 變化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    // 開始觀察 html 元素的 class 屬性變化
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full p-0 hover:bg-secondary/80 transition-colors"
          title={user.email}
        >
          <SmartAvatar
            userId={user.$id}
            name={user.name}
            email={user.email}
            customAvatar={customAvatar}
            config={{
              showPersonalAvatar: true,
              showAnonymousAvatar: false,
              size: 'md',
              context: 'menu'
            }}
            className="border-2 border-primary/20"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="bg-background border shadow-lg backdrop-blur-none w-48"
        style={{ 
          backgroundColor: isDark ? '#000000' : '#ffffff',
          backdropFilter: 'none',
          borderColor: isDark ? 'rgb(63, 63, 70)' : 'rgb(229, 231, 235)'
        }}
      >
        <DropdownMenuLabel className="px-4 py-2 text-sm">
          {user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* 自定義頭像選項 */}
        <AvatarCustomizer>
          <DropdownMenuItem 
            className="px-4 py-2 text-sm cursor-pointer"
            onSelect={(e) => e.preventDefault()}
          >
            <Palette className="h-4 w-4 mr-2" />
            {t('avatar.customize')}
          </DropdownMenuItem>
        </AvatarCustomizer>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={async () => {
            await logout();
          }}
          className="px-4 py-2 text-sm"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t('auth.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
