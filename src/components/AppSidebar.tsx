
import { Home, BookOpen, Users, Star, TrendingUp, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={item.current}>
                    <a href={item.href}>
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
      
      <SidebarFooter>
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
      </SidebarFooter>
    </Sidebar>
  );
}
