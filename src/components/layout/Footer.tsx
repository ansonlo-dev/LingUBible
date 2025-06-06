import { useLanguage } from '@/contexts/LanguageContext';
import { Github } from 'lucide-react';
import { UserStatsDisplay } from '@/components/user/UserStatsDisplay';
import { OpenStatusWidget } from '@/components/common/OpenStatusWidget';
import { Link } from 'react-router-dom';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-background">
      <div className="mx-auto px-4 py-3" style={{ marginLeft: '10px', marginRight: '10px' }}>
        <div className="border-t-2" style={{ borderTopColor: 'rgb(var(--border))' }}></div>
        <div className="pt-3">
          {/* Desktop Layout */}
        <div className="hidden md:block">
          {/* Single row layout with three sections */}
          <div className="flex justify-between items-center">
            {/* Left side - CC-BY-SA License and Social Icons */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src="https://licensebuttons.net/l/by-sa/4.0/80x15.png" 
                  alt="CC BY-SA 4.0" 
                  className="h-4"
                />
                <span className="text-xs text-gray-600 dark:text-muted-foreground">2025 LingUBible</span>
              </div>
              
              {/* Social Icons */}
              <div className="flex items-center space-x-2">
                <a 
                  href="https://github.com/ansonlo-dev/campus-comment-verse" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-muted-foreground hover:text-foreground transition-colors"
                  title="GitHub Repository"
                >
                  <Github className="h-4 w-4" />
                </a>
              </div>
              
              {/* User Stats */}
              <div className="border-l pl-4" style={{ borderLeftColor: 'rgb(var(--border))' }}>
                <UserStatsDisplay variant="compact" />
              </div>
            </div>
            
            {/* Center - Built with love */}
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-muted-foreground">
                {t('footer.builtWithTools')}{' '}
                <a 
                  href="https://ansonlo.dev/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground transition-colors"
                >
                  ansonlo.dev
                </a>{' '}
                💝
              </div>
              <div className="text-xs text-gray-500 dark:text-muted-foreground">
                {t('footer.disclaimer')}
              </div>
            </div>
            
            {/* Right side - Navigation Links and OpenStatus Badge */}
            <div className="flex items-center space-x-6 text-sm">
              <OpenStatusWidget slug="lingubible" href="https://lingubible.openstatus.dev/" />
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-muted-foreground text-xs rounded font-medium">
                {t('footer.beta')}
              </span>
              <span className="text-gray-600 dark:text-muted-foreground text-xs">
                {t('footer.version')}
              </span>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.contact')}
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.terms')}
              </Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.privacy')}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col space-y-1">
          {/* User Stats and OpenStatus Badge - Mobile */}
          <div className="flex justify-between items-center py-2">
            <UserStatsDisplay variant="compact" />
            <OpenStatusWidget slug="lingubible" href="https://lingubible.openstatus.dev/" />
          </div>
          
          {/* Links with BETA and Version on the left */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-muted-foreground text-xs rounded font-medium">
                {t('footer.beta')}
              </span>
              <span className="text-gray-600 dark:text-muted-foreground text-xs">
                {t('footer.version')}
              </span>
            </div>
            <div className="flex space-x-6">
              <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors font-bold">
                {t('footer.contact')}
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors font-bold">
                {t('footer.terms')}
              </Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors font-bold">
                {t('footer.privacy')}
              </Link>
            </div>
          </div>
          
          {/* Built with love */}
          <div className="text-center text-sm text-gray-600 dark:text-muted-foreground">
            {t('footer.builtWithTools')}{' '}
            <a 
              href="https://ansonlo.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              ansonlo.dev
            </a>{' '}
            💝
          </div>
          
          {/* Disclaimer */}
          <div className="text-center text-xs text-gray-500 dark:text-muted-foreground">
            {t('footer.disclaimer')}
          </div>
          
          {/* Horizontal ruler */}
          <hr className="border-t-2" style={{ borderTopColor: 'rgb(var(--border))' }} />
          
          {/* License and GitHub */}
          <div className="flex justify-center items-center space-x-4 pt-1">
            <div className="flex items-center space-x-2">
              <img 
                src="https://licensebuttons.net/l/by-sa/4.0/80x15.png" 
                alt="CC BY-SA 4.0" 
                className="h-4"
              />
              <span className="text-xs text-gray-600 dark:text-muted-foreground">2025 LingUBible</span>
            </div>
            <a 
              href="https://github.com/ansonlo-dev/campus-comment-verse" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-muted-foreground hover:text-foreground transition-colors"
              title="GitHub Repository"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
        </div>
      </div>
    </footer>
  );
}
