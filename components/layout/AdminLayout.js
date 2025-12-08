import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { PageLoader } from '../ui/Spinner';
import dynamic from 'next/dynamic';

const AdminBackground = dynamic(() => import('../three/AdminBackground'), {
  ssr: false,
});

export default function AdminLayout({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 relative overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 lg:ml-64 transition-all duration-300 ease-out relative z-10 bg-gray-50">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

