
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-4">
          {/* Copyright */}
          <div className="text-center text-sm text-muted-foreground">
            {t('footer.copyright')}
          </div>
          
          {/* Links */}
          <div className="flex justify-center space-x-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Disclaimer
            </a>
          </div>
          
          {/* Built with love */}
          <div className="text-center text-sm text-muted-foreground">
            {t('footer.builtWith')}
          </div>
          
          {/* Disclaimer */}
          <div className="text-center text-xs text-muted-foreground">
            {t('footer.disclaimer')}
          </div>
        </div>
      </div>
    </footer>
  );
}
