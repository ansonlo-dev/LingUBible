import { useLanguage } from '@/hooks/useLanguage';
import { Github } from 'lucide-react';
import { OpenStatusWidget } from '@/components/common/OpenStatusWidget';
import { FooterKofiButton } from '@/components/common/KofiWidget';
import { Link } from 'react-router-dom';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';

export function Footer() {
  const { t, language } = useLanguage();

  return (
    <footer className="bg-background">
      <div className="mx-auto px-4 py-3" style={{ marginLeft: '10px', marginRight: '10px' }}>
        <div className="border-t-2" style={{ borderTopColor: 'rgb(var(--border))' }}></div>
        <div className="pt-3">
          {/* Desktop Layout - Full Width */}
        <div className="hidden xl:block">
          {/* Single row layout with three sections for large screens */}
          <div className="flex justify-between items-center">
            {/* Left side - CC-BY-SA License and Social Icons */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <ResponsiveTooltip content={t('footer.mitTooltip')}>
                  <a 
                    href="https://github.com/ansonlo-dev/LingUBible/blob/main/LICENSE" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-gray-600 dark:text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-help"
                  >
                    MIT
                  </a>
                </ResponsiveTooltip>
                <span className="text-xs text-gray-600 dark:text-muted-foreground">2026 LingUBible</span>
              </div>
              
              {/* Social Icons */}
              <div className="flex items-center space-x-2">
                <ResponsiveTooltip content={t('footer.githubTooltip')}>
                  <a 
                    href="https://github.com/ansonlo-dev/LingUBible" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-muted-foreground hover:text-foreground transition-colors cursor-help"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                </ResponsiveTooltip>
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
                  </a>
                  {(language === 'zh-TW' || language === 'zh-CN') && t('footer.developedBy')}
                </div>
              <div className="text-xs text-gray-500 dark:text-muted-foreground">
                {t('footer.disclaimer')}
              </div>
            </div>
            
            {/* Right side - Navigation Links and OpenStatus Badge */}
            <div className="flex items-center space-x-6 text-sm">
              <FooterKofiButton />
              <OpenStatusWidget slug="lingubible" href="https://status.lingubible.com/" />
              <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.faq')}
              </Link>
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

        {/* Medium Desktop Layout - Two Rows for better spacing */}
        <div className="hidden md:block xl:hidden">
          <div className="space-y-3">
            {/* First row - License, GitHub, User Stats */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <ResponsiveTooltip content={t('footer.mitTooltip')}>
                    <a 
                      href="https://github.com/ansonlo-dev/LingUBible/blob/main/LICENSE" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-gray-600 dark:text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-help"
                    >
                      MIT
                    </a>
                  </ResponsiveTooltip>
                  <span className="text-xs text-gray-600 dark:text-muted-foreground">2026 LingUBible</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <ResponsiveTooltip content={t('footer.githubTooltip')}>
                    <a 
                      href="https://github.com/ansonlo-dev/LingUBible" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 dark:text-muted-foreground hover:text-foreground transition-colors cursor-help"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                  </ResponsiveTooltip>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <FooterKofiButton />
                <OpenStatusWidget slug="lingubible" href="https://status.lingubible.com/" />
              </div>
            </div>
            
            {/* Second row - Built with love and Navigation */}
            <div className="flex justify-between items-center">
              <div className="text-left">
                <div className="text-sm text-gray-600 dark:text-muted-foreground">
                  {t('footer.builtWithTools')}{' '}
                  <a 
                    href="https://ansonlo.dev/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground transition-colors"
                  >
                    ansonlo.dev
                  </a>
                  {(language === 'zh-TW' || language === 'zh-CN') && t('footer.developedBy')}
                </div>
                <div className="text-xs text-gray-500 dark:text-muted-foreground">
                  {t('footer.disclaimer')}
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.faq')}
                </Link>
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
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col space-y-3">
          {/* User Stats and OpenStatus Badge - Mobile */}
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center space-x-2">
              <FooterKofiButton />
              <OpenStatusWidget slug="lingubible" href="https://status.lingubible.com/" />
            </div>
          </div>
          
          {/* Navigation Links - Mobile */}
          <div className="flex justify-center space-x-6 text-sm">
            <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              {t('footer.faq')}
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              {t('footer.contact')}
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              {t('footer.terms')}
            </Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              {t('footer.privacy')}
            </Link>
          </div>
          
          {/* Built with love */}
          <div className="text-center text-sm text-gray-600 dark:text-muted-foreground px-4">
            {t('footer.builtWithTools')}{' '}
            <a 
              href="https://ansonlo.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              ansonlo.dev
            </a>
            {(language === 'zh-TW' || language === 'zh-CN') && t('footer.developedBy')}
          </div>
          
          {/* Disclaimer */}
          <div className="text-center text-xs text-gray-500 dark:text-muted-foreground px-4 leading-relaxed">
            {t('footer.disclaimer')}
          </div>
          
          {/* Separator */}
          <div className="flex items-center justify-center py-2">
            <div className="flex-grow border-t" style={{ borderTopColor: 'rgb(var(--border))' }}></div>
            <div className="px-4">
              <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>
            <div className="flex-grow border-t" style={{ borderTopColor: 'rgb(var(--border))' }}></div>
          </div>
          
          {/* License and GitHub - Stacked vertically */}
          <div className="flex flex-col items-center space-y-3 pb-2">
            {/* License info */}
            <div className="flex items-center space-x-2">
              <ResponsiveTooltip content={t('footer.mitTooltip')}>
                <a 
                  href="https://github.com/ansonlo-dev/LingUBible/blob/main/LICENSE" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-gray-600 dark:text-muted-foreground bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full font-mono hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-help"
                >
                  MIT
                </a>
              </ResponsiveTooltip>
                             <span className="text-xs text-gray-600 dark:text-muted-foreground">
                 2026 LingUBible
               </span>
            </div>
            
            {/* GitHub link */}
            <ResponsiveTooltip content={t('footer.githubTooltip')}>
              <a 
                href="https://github.com/ansonlo-dev/LingUBible" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-600 dark:text-muted-foreground hover:text-foreground transition-colors group cursor-help"
              >
                <Github className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">GitHub</span>
              </a>
            </ResponsiveTooltip>
          </div>
        </div>
        </div>
      </div>
    </footer>
  );
}
