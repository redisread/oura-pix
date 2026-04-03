'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { User, Settings, History, LogOut } from 'lucide-react';

interface UserMenuProps {
  onMenuClick?: () => void;
}

export default function UserMenu({ onMenuClick }: UserMenuProps) {
  const t = useTranslations('navigation');
  const tAuth = useTranslations('auth');
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onMenuClick?.();
  };

  const menuItems = [
    {
      href: '/profile',
      label: t('profile'),
      icon: User,
      onClick: onMenuClick,
    },
    {
      href: '/profile?tab=settings',
      label: t('accountSettings'),
      icon: Settings,
      onClick: onMenuClick,
    },
    {
      href: '/profile?tab=history',
      label: t('generationHistory'),
      icon: History,
      onClick: onMenuClick,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="User menu"
        >
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <span className="text-sm font-medium text-foreground truncate max-w-[100px]">
            {user?.name || user?.email}
          </span>
          <svg
            className="w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {menuItems.map((item) => (
          <DropdownMenuItem key={item.href} asChild onSelect={(e) => e.preventDefault()}>
            <Link
              href={item.href}
              onClick={item.onClick}
              className="flex items-center gap-2 cursor-pointer"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          <span>{tAuth('logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}