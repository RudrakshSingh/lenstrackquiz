import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import { useRouter } from 'next/router';

export default function Header({ title }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm animate-fade-in">
      <h1 className="text-2xl font-semibold text-gray-900 animate-slide-in">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 hover:shadow-md">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold text-sm shadow-md transition-transform duration-200 hover:scale-110">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500">{user?.role?.replace('_', ' ') || 'Role'}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} icon={<LogOut className="h-4 w-4" />} className="hover-lift">
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}

