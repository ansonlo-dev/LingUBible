import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Search, BookOpen, Users, ArrowLeft, RefreshCw } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const quickLinks = [
    {
      icon: Home,
      label: t('nav.home'),
      path: '/',
      description: t('404.quickLinks.homeDesc')
    },
    {
      icon: BookOpen,
      label: t('nav.courses'),
      path: '/courses',
      description: t('404.quickLinks.coursesDesc')
    },
    {
      icon: Users,
      label: t('nav.lecturers'),
      path: '/lecturers',
      description: t('404.quickLinks.lecturersDesc')
    },
    {
      icon: Search,
      label: t('search.search'),
      path: '/',
      description: t('404.quickLinks.searchDesc')
    }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-4xl w-full">
        {/* 主要 404 內容 */}
        <div className="text-center mb-12">
          {/* 404 數字 */}
          <div className="relative mb-8">
            <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60 select-none">
              404
            </h1>
            <div className="absolute inset-0 text-8xl md:text-9xl font-bold text-primary/10 blur-sm select-none">
              404
            </div>
          </div>

          {/* 錯誤信息 */}
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              {t('404.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('404.description')}
            </p>
            <div className="text-sm text-muted-foreground/80 font-mono bg-muted/50 rounded-lg px-4 py-2 inline-block">
              {t('404.path')}: <span className="text-destructive">{location.pathname}</span>
            </div>
          </div>

          {/* 主要操作按鈕 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button asChild size="lg" className="min-w-[160px]">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                {t('404.backToHome')}
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleRefresh}
              className="min-w-[160px]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('404.refresh')}
            </Button>
            <Button 
              variant="ghost" 
              size="lg" 
              onClick={() => window.history.back()}
              className="min-w-[160px]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('404.goBack')}
            </Button>
          </div>
        </div>

        {/* 快速連結 */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t('404.quickLinks.title')}
            </h3>
            <p className="text-muted-foreground">
              {t('404.quickLinks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => {
              const IconComponent = link.icon;
              return (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6">
                    <Link to={link.path} className="block">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {link.label}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {link.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 幫助信息 */}
        <div className="mt-12 text-center">
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-2">
                {t('404.help.title')}
              </h4>
              <p className="text-muted-foreground text-sm mb-4">
                {t('404.help.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center items-center text-sm text-muted-foreground">
                <span>{t('404.help.contact')}</span>
                <Link 
                  to="/contact" 
                  className="text-primary hover:underline font-medium"
                >
                  {t('footer.contact')}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
