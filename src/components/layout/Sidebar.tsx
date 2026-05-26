'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  FileBadge,
  Settings,
  Hotel,
} from 'lucide-react';
import { cn } from '@/lib/utils/format';

const NAV_ITEMS = [
  { href: '/', label: "Today's Overview", icon: LayoutDashboard },
  { href: '/calendar', label: 'Pricing Calendar', icon: CalendarDays },
  { href: '/recommendations', label: 'Recommendations', icon: FileBadge },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
          <Hotel className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900">PulsePrices</h1>
          <p className="text-xs text-gray-500">AI Hotel Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Menu
        </p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive ? 'text-blue-600' : 'text-gray-400')} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4">
        <p className="text-center text-xs text-gray-400">
          All prices in IDR
        </p>
      </div>
    </aside>
  );
}
