import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-3">
          {/* Links */}
          <div className="flex justify-center space-x-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-bold">
              About
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-bold">
              FAQ
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-bold">
              Contact
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-bold">
              GitHub
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-bold">
              Privacy
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-bold">
              Disclaimer
            </a>
          </div>
          
          {/* Built with love */}
          <div className="text-center text-sm text-muted-foreground">
            Built with open-source tools by{' '}
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
          <div className="text-center text-xs text-muted-foreground">
            {t('footer.disclaimer')}
          </div>
          
          {/* Horizontal ruler */}
          <hr className="border-t border-border" />
          
          {/* Copyright */}
          <div className="text-center text-xs text-muted-foreground">
            {t('footer.copyright')}
          </div>
        </div>
      </div>
    </footer>
  );
}
