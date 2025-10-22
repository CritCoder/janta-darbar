import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  User,
  Zap,
  Target
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from './UI/sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  // Base navigation for all users
  const baseNavigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'officer', 'citizen'] },
  ];

  // Admin-specific navigation
  const adminNavigation = [
    { name: '⚡ Quick Create', href: '/admin/quick-create', icon: Zap, roles: ['admin'], badge: 'NEW' },
    { name: t('nav.grievances'), href: '/grievances', icon: FileText, roles: ['admin', 'officer'] },
    { name: t('nav.departments'), href: '/departments', icon: Building2, roles: ['admin'] },
    { name: t('nav.officers'), href: '/officers', icon: Users, roles: ['admin'] },
    { name: t('nav.analytics'), href: '/analytics', icon: BarChart3, roles: ['admin'] },
  ];

  // Officer-specific navigation
  const officerNavigation = [
    { name: '📋 My Assignments', href: '/officer/assignments', icon: Target, roles: ['officer'] },
  ];

  // Common navigation
  const commonNavigation = [
    { name: t('nav.settings'), href: '/settings', icon: Settings, roles: ['admin', 'officer', 'citizen'] },
  ];

  // Combine navigation based on user role
  const userRole = user?.role || 'citizen';
  const allNavigation = [
    ...baseNavigation,
    ...(userRole === 'admin' ? adminNavigation : []),
    ...(userRole === 'officer' ? [...officerNavigation, ...adminNavigation.filter(n => n.roles.includes('officer'))] : []),
    ...commonNavigation
  ];

  // Filter navigation based on user role
  const navigation = allNavigation.filter(item => item.roles.includes(userRole));

  const handleLogout = () => {
    logout();
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <div className="size-4 font-bold">ज</div>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">जनता दरबार</span>
            <span className="truncate text-xs">Government Portal</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.href}>
                        <Icon className="size-4" />
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <User className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.name || 'User'}</span>
                <span className="truncate text-xs">{user?.phone || ''}</span>
                {user?.role && (
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'officer' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                )}
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="size-4" />
              <span>{t('nav.logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
