import Sidebar from './Sidebar';
import Header from './Header';
import PageContainer from './PageContainer';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Spinner from '../ui/Spinner';

export default function AdminLayout({ children, title = 'Admin' }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PageContainer>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <Header title={title} />
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </PageContainer>
  );
}

