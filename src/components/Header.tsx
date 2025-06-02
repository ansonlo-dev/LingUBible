import { BookOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SearchDropdown } from './SearchDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/UserMenu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useScrollThrottle } from '@/hooks/useScrollThrottle';
import { FloatingCircles } from '@/components/FloatingCircles';
import { Link } from 'react-router-dom';

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const scrollY = useScrollThrottle();

  // Calculate header transparency based on scroll
  const opacity = Math.min(scrollY / 100, 1);
  const backdropBlur = Math.min(scrollY / 10, 10);

  // Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header 
        className="sticky top-0 z-50 w-full border-b header-transparent"
        style={{ 
          position: 'sticky',
          backgroundColor: `rgba(var(--background), ${opacity})`,
          backdropFilter: `blur(${backdropBlur}px)`,
          borderColor: `rgba(var(--border), ${opacity})`
        }}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden mr-2" />
          </div>

          {/* Desktop Search - Always visible */}
          <div className="flex-1 max-w-lg mx-4 hidden md:block">
            <SearchDropdown 
              isOpen={true}
              onClose={() => {}} // Desktop version is always open
            />
          </div>

          {/* Mobile Search Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher onLanguageChange={setLanguage} currentLanguage={language} />
            <ThemeToggle />
            {user ? (
              <UserMenu />
            ) : (
              <Button 
                asChild
                className="gradient-primary hover:opacity-90 text-white font-medium"
              >
                <Link to="/login">
                  {t('nav.signIn')}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search Dropdown - only show when opened */}
        {isSearchOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 px-4 py-4 bg-background/95 backdrop-blur-sm border-b">
            <SearchDropdown 
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
            />
          </div>
        )}
      </header>
    </>
  );
}
