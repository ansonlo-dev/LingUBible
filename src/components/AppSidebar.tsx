import { Home, BookOpen, Users, Star, TrendingUp, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <a 
          href="/" 
          className="flex items-center gap-2 px-2 py-2 hover:opacity-80 transition-opacity"
          title="回到首頁"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-primary group-data-[collapsible=icon]:hidden">
            LingUBible
          </span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={item.current} 
                    size="lg"
                    tooltip={item.name}
                  >
                    <a
                      href={item.href}
                      className={`flex items-center gap-3 text-base transition-all duration-200 [&>svg]:h-5 [&>svg]:w-5 ${
                        item.current ? 'font-bold' : 'font-semibold'
                      }`}
                    >
                      <item.icon />
                      <span className={item.current ? 'font-bold' : 'font-semibold'}>
                        {item.name}
                      </span>
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
