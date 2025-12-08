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
  Tag,
  Sparkles,
  Eye,
  Calculator,
  Ticket,
  Network,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, category: 'main' },
  { href: '/admin/stores', label: 'Store Locations', icon: Store, category: 'main' },
  { href: '/admin/users', label: 'Team Members', icon: Users, category: 'main' },
  { href: '/admin/frame-brands', label: 'Brands & Sub-Brands', icon: Package, category: 'products' },
  { href: '/admin/products', label: 'Retail Products', icon: Package, category: 'products' },
  { href: '/admin/lens-brands', label: 'Lens Brands', icon: Network, category: 'products' },
  { href: '/admin/lenses', label: 'Lens Products', icon: Eye, category: 'products' },
  { href: '/admin/features', label: 'Product Features', icon: Sparkles, category: 'products' },
  { href: '/admin/benefits', label: 'Benefits', icon: TrendingUp, category: 'products' },
  { href: '/admin/questionnaire-builder', label: 'Customer Quiz', icon: HelpCircle, category: 'customer' },
  { href: '/admin/sessions', label: 'Customer Sessions', icon: FileText, category: 'customer' },
  { href: '/admin/offers', label: 'Promotions', icon: Tag, category: 'sales' },
  { href: '/admin/category-discounts', label: 'Category Pricing', icon: Tag, category: 'sales' },
  { href: '/admin/coupons', label: 'Discount Codes', icon: Ticket, category: 'sales' },
  { href: '/admin/offer-calculator', label: 'Price Calculator', icon: Calculator, category: 'sales' },
  { href: '/admin/reports', label: 'Analytics', icon: BarChart3, category: 'reports' },
  { href: '/admin/pos-orders', label: 'Order Management', icon: Package, category: 'orders' },
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
          className="p-2.5 rounded-lg bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <X className="h-5 w-5 text-black" /> : <Menu className="h-5 w-5 text-black" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40 transition-all duration-300 ease-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full w-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-black !text-black">LensTrack</h1>
                <p className="text-xs text-black !text-black">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto bg-white">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const prevItem = index > 0 ? menuItems[index - 1] : null;
              const showDivider = prevItem && prevItem.category !== item.category;
              
              return (
                <div key={item.href}>
                  {showDivider && (
                    <div className="h-px bg-gray-200 my-2 mx-4" />
                  )}
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 mb-1',
                      active
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-black hover:bg-gray-50 hover:text-black'
                    )}
                  >
                    <Icon className={clsx('h-5 w-5 flex-shrink-0', active ? 'text-blue-600' : 'text-black !text-black')} />
                    <span className="text-sm truncate text-black !text-black font-medium">{item.label}</span>
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black !text-black truncate">
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-xs text-black !text-black truncate">
                  {user?.email || 'admin@lenstrack.com'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('lenstrack_token');
                  window.location.href = '/admin/login';
                }
              }}
              className="w-full px-4 py-2 text-sm font-medium text-black !text-black hover:bg-gray-100 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

