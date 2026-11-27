import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, MessageSquare, User, Scale } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  // برای اینکه در صفحات لاگین و چت نمایش داده نشود
  const hideOnRoutes = ['/auth', '/chat'];
  if (hideOnRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  const navItems = [
    { label: 'خانه', icon: Home, path: '/' },
    { label: 'وکلا', icon: Users, path: '/lawyers' },
    { label: 'پیام نگار', icon: MessageSquare, path: '/messages' },
    { label: 'پنل کاربری', icon: User, path: profile ? '/dashboard' : '/auth' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-900/95 backdrop-blur-xl border-t border-surface-800 z-40 pb-safe">
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                          (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 transition-colors ${
                isActive ? 'text-primary-400' : 'text-surface-500 hover:text-surface-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-primary-400/20' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}