import { useLanguage } from '@/hooks/useLanguage';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPageSEO, getPageTypeFromPath, generateHreflangUrls } from '@/utils/seo/helpers';
import { SEO_CONFIG, SupportedLanguage } from '@/utils/seo/config';

export function SEOTester() {
  const { language } = useLanguage();
  const location = useLocation();
  
  const pageType = getPageTypeFromPath(location.pathname);
  const seoData = getPageSEO(pageType, language as SupportedLanguage);
  const hreflangUrls = generateHreflangUrls(location.pathname);
  
  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto z-50">
      <Card className="bg-background/95 backdrop-blur-sm border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            🔍 SEO Debug
            <Badge variant="outline" className="text-xs">
              {pageType}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div>
            <strong>Title:</strong>
            <p className="text-muted-foreground break-words">{seoData.title}</p>
          </div>
          
          <div>
            <strong>Description:</strong>
            <p className="text-muted-foreground break-words">{seoData.description}</p>
          </div>
          
          <div>
            <strong>Keywords:</strong>
            <p className="text-muted-foreground break-words">{seoData.keywords}</p>
          </div>
          
          <div>
            <strong>Language:</strong>
            <Badge variant="secondary" className="text-xs">{language}</Badge>
          </div>
          
          <div>
            <strong>Hreflang URLs:</strong>
            <div className="space-y-1 mt-1">
              {Object.entries(hreflangUrls).map(([lang, url]) => (
                <div key={lang} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs w-12 justify-center">
                    {lang}
                  </Badge>
                  <span className="text-muted-foreground text-xs break-all">
                    {url}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <strong>Canonical:</strong>
            <p className="text-muted-foreground break-all">
              {SEO_CONFIG.BASE_URL}{location.pathname}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 