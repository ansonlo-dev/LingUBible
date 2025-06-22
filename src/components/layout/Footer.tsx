import { useLanguage } from '@/hooks/useLanguage';
import { Github, ExternalLink, RefreshCw } from 'lucide-react';
import { UserStatsDisplay } from '@/components/user/UserStatsDisplay';
import { OpenStatusWidget } from '@/components/common/OpenStatusWidget';
import { FooterKofiButton } from '@/components/common/KofiWidget';
import { Link } from 'react-router-dom';
import { getFormattedVersion, getVersionStatus } from '@/utils/version';
import { useLatestVersion } from '@/hooks/useVersion';

export function Footer() {
  const { t, language } = useLanguage();
  const localVersion = getFormattedVersion(t('footer.beta'));
  const localVersionStatus = getVersionStatus();
  
  // 嘗試從 GitHub 獲取最新版本，如果失敗則使用本地版本
  const { latestVersion, isLoading, error } = useLatestVersion();
  
  // 決定要顯示的版本資訊，並處理翻譯
  const formatVersionWithTranslation = (versionInfo: typeof latestVersion) => {
    if (!versionInfo) return localVersion;
    
    // 如果是 beta 版本，替換 "Beta" 為翻譯文字
    if (versionInfo.status === 'beta' && versionInfo.formattedVersion.startsWith('Beta ')) {
      return versionInfo.formattedVersion.replace('Beta ', `${t('footer.beta')} `);
    }
    
    return versionInfo.formattedVersion;
  };
  
  const version = formatVersionWithTranslation(latestVersion) || localVersion;
  const versionStatus = latestVersion?.status || localVersionStatus;
  const releaseUrl = latestVersion?.releaseUrl;

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
                <a 
                  href="https://github.com/ansonlo-dev/LingUBible/blob/main/LICENSE" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-gray-600 dark:text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title={t('footer.mitTooltip')}
                >
                  MIT
                </a>
                <span className="text-xs text-gray-600 dark:text-muted-foreground">2025 LingUBible</span>
              </div>
              
              {/* Social Icons */}
              <div className="flex items-center space-x-2">
                <a 
                  href="https://github.com/ansonlo-dev/LingUBible" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-muted-foreground hover:text-foreground transition-colors"
                  title={t('footer.githubTooltip')}
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
              <OpenStatusWidget slug="lingubible" href="https://lingubible.openstatus.dev/" />
              {releaseUrl ? (
                <a
                  href={releaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded font-medium transition-all hover:scale-105 ${
                    versionStatus === 'beta' 
                      ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50' 
                      : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                  }`}
                  title={t('footer.versionTooltip', { version })}
                >
                  {isLoading ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <ExternalLink className="h-3 w-3" />
                  )}
                  {version}
                </a>
              ) : (
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded font-medium ${
                  versionStatus === 'beta' 
                    ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' 
                    : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                }`}>
                  {isLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
                  {version}
                  {error && <span className="text-xs opacity-60" title={t('footer.versionError', { error })}>*</span>}
                </span>
              )}
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
                  <a 
                    href="https://github.com/ansonlo-dev/LingUBible/blob/main/LICENSE" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-gray-600 dark:text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title={t('footer.mitTooltip')}
                  >
                    MIT
                  </a>
                  <span className="text-xs text-gray-600 dark:text-muted-foreground">2025 LingUBible</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <a 
                    href="https://github.com/ansonlo-dev/LingUBible" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-muted-foreground hover:text-foreground transition-colors"
                    title={t('footer.githubTooltip')}
                  >
                    <Github className="h-4 w-4" />
                  </a>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <UserStatsDisplay variant="compact" />
                <FooterKofiButton />
                <OpenStatusWidget slug="lingubible" href="https://lingubible.openstatus.dev/" />
                {releaseUrl ? (
                  <a
                    href={releaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded font-medium transition-all hover:scale-105 ${
                      versionStatus === 'beta' 
                        ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50' 
                        : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                    }`}
                    title={t('footer.versionTooltip', { version })}
                  >
                    {isLoading ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <ExternalLink className="h-3 w-3" />
                    )}
                    {version}
                  </a>
                ) : (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded font-medium ${
                    versionStatus === 'beta' 
                      ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' 
                      : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                  }`}>
                    {isLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
                    {version}
                    {error && <span className="text-xs opacity-60" title={t('footer.versionError', { error })}>*</span>}
                  </span>
                )}
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
            <UserStatsDisplay variant="compact" />
            <div className="flex items-center space-x-2">
              <FooterKofiButton />
              <OpenStatusWidget slug="lingubible" href="https://lingubible.openstatus.dev/" />
            </div>
          </div>
          
          {/* Status badges row */}
          <div className="flex justify-center items-center space-x-3">
            {releaseUrl ? (
              <a
                href={releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded font-medium transition-all hover:scale-105 ${
                  versionStatus === 'beta' 
                    ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50' 
                    : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                }`}
                title={t('footer.versionTooltip', { version })}
              >
                {isLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <ExternalLink className="h-3 w-3" />
                )}
                {version}
              </a>
            ) : (
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded font-medium ${
                versionStatus === 'beta' 
                  ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' 
                  : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
              }`}>
                {isLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
                {version}
                {error && <span className="text-xs opacity-60" title={t('footer.versionError', { error })}>*</span>}
              </span>
            )}
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
              <a 
                href="https://github.com/ansonlo-dev/LingUBible/blob/main/LICENSE" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-gray-600 dark:text-muted-foreground bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full font-mono hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={t('footer.mitTooltip')}
              >
                MIT
              </a>
                             <span className="text-xs text-gray-600 dark:text-muted-foreground">
                 2025 LingUBible
               </span>
            </div>
            
            {/* GitHub link */}
            <a 
              href="https://github.com/ansonlo-dev/LingUBible" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 dark:text-muted-foreground hover:text-foreground transition-colors group"
              title={t('footer.githubTooltip')}
            >
              <Github className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">GitHub</span>
            </a>
          </div>
        </div>
        </div>
      </div>
    </footer>
  );
}
