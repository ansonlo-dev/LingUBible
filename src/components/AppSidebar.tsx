import { Home, BookOpen, Users, Star, TrendingUp, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useLanguage } from '@/contexts/LanguageContext';

export function AppSidebar() {
  const { t } = useLanguage();
  
  const navigation = [
    { name: t('nav.home'), href: '#', icon: Home, current: true },
    { name: t('nav.courses'), href: '#', icon: BookOpen, current: false },
    { name: t('nav.lecturers'), href: '#', icon: Users, current: false },
    { name: t('sidebar.myReviews'), href: '#', icon: Star, current: false },
    { name: t('sidebar.trending'), href: '#', icon: TrendingUp, current: false },
    { name: t('sidebar.settings'), href: '#', icon: Settings, current: false },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={item.current} size="lg">
                    <a
                      href={item.href}
                      className="flex items-center gap-3 text-base font-semibold transition-all duration-200 [&>svg]:h-5 [&>svg]:w-5"
                    >
                      <item.icon />
                      <span>{item.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
