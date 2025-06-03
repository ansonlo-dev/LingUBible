import { Home, BookOpen, Users, Star, TrendingUp, Settings, Menu, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// 自定義 Home 圖示組件
const HomeIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
    />
  </svg>
);

interface AppSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

export function AppSidebar({ isCollapsed = false, onToggle, isMobileOpen = false, onMobileToggle }: AppSidebarProps) {
  const { t } = useLanguage();
  
  const navigation = [
    { name: t('nav.home'), href: '#', icon: HomeIcon, current: true },
    { name: t('nav.courses'), href: '#', icon: BookOpen, current: false },
    { name: t('nav.lecturers'), href: '#', icon: Users, current: false },
    { name: t('sidebar.myReviews'), href: '#', icon: Star, current: false },
    { name: t('sidebar.trending'), href: '#', icon: TrendingUp, current: false },
    { name: t('sidebar.settings'), href: '#', icon: Settings, current: false },
  ];

  return (
    <>
      {/* 側邊欄內容 - 直接使用 flex 佈局，不再包裝額外的 div */}
      <div className="flex flex-col h-full">
        {/* 導航選單 */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-md text-base font-bold transition-colors
                      ${isCollapsed ? 'justify-center' : ''}
                      ${item.current 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }
                    `}
                    onClick={() => onMobileToggle && onMobileToggle()}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="h-6 w-6 flex-shrink-0 text-current" />
                    {!isCollapsed && <span className="text-current font-bold whitespace-nowrap min-w-0 flex-1">{item.name}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
