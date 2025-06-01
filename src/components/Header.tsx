import { BookOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AuthModal } from './AuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/UserMenu';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background" style={{ position: 'sticky' }}>
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">LingUBible</span>
          </div>

          <div className="flex-1 max-w-lg mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses, lecturers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher onLanguageChange={setLanguage} currentLanguage={language} />
            <ThemeToggle />
            {user ? (
              <UserMenu />
            ) : (
            <Button 
              onClick={() => setIsAuthModalOpen(true)}
              className="gradient-primary hover:opacity-90 text-white font-medium"
            >
              {t('nav.signIn')}
            </Button>
            )}
          </div>
        </div>
      </header>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}
