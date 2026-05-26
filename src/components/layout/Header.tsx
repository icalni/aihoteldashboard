'use client';

import { Bell, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const today = new Date();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-sm px-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="flex items-center gap-1.5 text-sm text-gray-500">
          <Calendar className="h-3.5 w-3.5" />
          {format(today, 'EEEE, dd MMMM yyyy')}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* User avatar placeholder */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-sm font-medium text-white">
            AD
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900">Admin</p>
            <p className="text-xs text-gray-500">Hotel Dashboard</p>
          </div>
        </div>
      </div>
    </header>
  );
}
