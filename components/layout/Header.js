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
    <header className="bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 h-16 flex items-center justify-between px-6 shadow-sm animate-fade-in">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50 animate-slide-in tracking-tight">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 hover:shadow-md border border-zinc-200 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-semibold text-sm shadow-md transition-transform duration-200 hover:scale-110">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-black dark:text-zinc-50">{user?.name || 'User'}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{user?.role?.replace('_', ' ') || 'Role'}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} icon={<LogOut className="h-4 w-4" />} className="hover-lift rounded-full">
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}

