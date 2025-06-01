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

const navigation = [
  { name: 'Dashboard', href: '#', icon: Home, current: true },
  { name: 'Courses', href: '#', icon: BookOpen, current: false },
  { name: 'Lecturers', href: '#', icon: Users, current: false },
  { name: 'My Reviews', href: '#', icon: Star, current: false },
  { name: 'Trending', href: '#', icon: TrendingUp, current: false },
  { name: 'Settings', href: '#', icon: Settings, current: false },
];

export function AppSidebar() {
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
