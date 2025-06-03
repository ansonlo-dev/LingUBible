import { useLanguage } from '@/contexts/LanguageContext';
import { Github } from 'lucide-react';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-3">
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
              <div className="flex items-center space-x-2">
                <a 
                  href="https://github.com/ansonlo/campus-comment-verse" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a 
                  href="#" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Center - Built with and disclaimer */}
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
            
            {/* Right side - Navigation Links (Appwrite style) */}
            <div className="flex items-center space-x-6 text-sm">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-muted-foreground text-xs rounded font-medium">
                {t('footer.beta')}
              </span>
              <span className="text-gray-600 dark:text-muted-foreground text-xs">
                {t('footer.version')}
              </span>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.contact')}
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.terms')}
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.privacy')}
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col space-y-1">
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
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-bold">
                {t('footer.contact')}
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-bold">
                {t('footer.terms')}
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-bold">
                {t('footer.privacy')}
              </a>
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
          <hr className="border-t border-border" />
          
          {/* Copyright with CC-BY-SA badge and social icons */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <img 
                src="https://licensebuttons.net/l/by-sa/4.0/80x15.png" 
                alt="CC BY-SA 4.0" 
                className="h-4"
              />
              <span className="text-xs text-gray-600 dark:text-muted-foreground">2025 LingUBible</span>
            </div>
            <div className="flex items-center space-x-2">
              <a 
                href="https://github.com/ansonlo/campus-comment-verse" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
