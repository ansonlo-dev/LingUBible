
import { Heart, Github } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Copyright */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Copyleft, {currentYear} © LingUBible
            </p>
            <p className="text-sm text-muted-foreground">
              All rights reserved to the contributors
            </p>
          </div>

          {/* Links */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-4 text-sm">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                About
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                FAQ
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Contact
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <Github className="h-3 w-3" />
                GitHub
              </a>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Disclaimer
              </a>
            </div>
          </div>

          {/* Built with love */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Built with <Heart className="h-3 w-3 text-red-500 fill-current" /> by{' '}
              <a 
                href="https://ansonlo.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ansonlo.dev
              </a>
            </p>
            <p className="text-xs text-muted-foreground">
              The website is not affiliated with Lingnan University
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
