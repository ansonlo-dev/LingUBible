import { Home, BookOpen, Users, Star, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '#', icon: Home, current: true },
  { name: 'Courses', href: '#', icon: BookOpen, current: false },
  { name: 'Lecturers', href: '#', icon: Users, current: false },
  { name: 'My Reviews', href: '#', icon: Star, current: false },
  { name: 'Settings', href: '#', icon: Settings, current: false },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 transform bg-background border-r transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-4 md:hidden">
          <span className="font-semibold text-lg">Menu</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                item.current 
                  ? "bg-primary text-white hover:bg-primary/90" 
                  : "text-muted-foreground hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </a>
          ))}
        </nav>
        
        <div className="p-4">
          <div className="glass-card rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2">Quick Stats</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Reviews Written:</span>
                <span className="font-medium text-primary">12</span>
              </div>
              <div className="flex justify-between">
                <span>Helpful Votes:</span>
                <span className="font-medium text-primary">45</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
