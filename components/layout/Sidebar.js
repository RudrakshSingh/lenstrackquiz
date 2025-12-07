import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  HelpCircle,
  BarChart3,
  FileText,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/stores', label: 'Stores', icon: Store },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/questions', label: 'Questions', icon: HelpCircle },
  { href: '/admin/sessions', label: 'Sessions', icon: FileText },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

export default function Sidebar() {
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href) => {
    if (href === '/admin') {
      return router.pathname === '/admin' || router.pathname === '/admin/index';
    }
    return router.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-md bg-white shadow-md"
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40 transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:z-auto',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full w-64">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200 px-4 bg-gradient-to-r from-primary to-primary-hover">
            <h1 className="text-xl font-bold text-white">Lenstrack</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={clsx(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 relative group',
                    active
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                  )}
                >
                  <Icon className={clsx('mr-3 h-5 w-5 transition-transform duration-200', active ? 'scale-110' : 'group-hover:scale-110')} />
                  <span className="relative">
                    {item.label}
                    {active && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-indigo-600 rounded-full animate-scale-in" />
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold mr-3">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role?.replace('_', ' ') || 'Role'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        {isMobileOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </aside>
    </>
  );
}

