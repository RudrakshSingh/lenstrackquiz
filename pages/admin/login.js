import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      showToast('success', 'Login successful!');
      router.push('/admin');
    } catch (error) {
      showToast('error', error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Lenstrack Admin
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Sign in to your account
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/admin/register"
                  className="font-medium text-primary hover:text-primary-hover"
                >
                  Create one
                </Link>
              </p>
            </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Enter your email"
                required
                icon={<Mail className="h-5 w-5" />}
                disabled={loading}
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter your password"
                  required
                  icon={<Lock className="h-5 w-5" />}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                Sign in
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/admin/register"
                  className="font-medium text-primary hover:text-primary-hover transition-colors"
                >
                  Create one
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Visual (hidden on mobile) */}
      <div className="hidden lg:block lg:w-2/5 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-12 flex items-center justify-center relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="text-white text-center relative z-10">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-white bg-opacity-30 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <h3 className="text-4xl font-bold mb-4 text-white drop-shadow-lg">Welcome to Lenstrack</h3>
          <p className="text-xl mb-8 text-white opacity-95 leading-relaxed">
            Manage your optical stores, products, and customer recommendations
          </p>
          <div className="space-y-4 text-left max-w-sm mx-auto">
            <div className="flex items-start bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white bg-opacity-30 flex items-center justify-center mr-4 mt-0.5 shadow-md">
                <span className="text-white text-base font-bold">✓</span>
              </div>
              <p className="text-base text-white font-medium">Multi-store management</p>
            </div>
            <div className="flex items-start bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white bg-opacity-30 flex items-center justify-center mr-4 mt-0.5 shadow-md">
                <span className="text-white text-base font-bold">✓</span>
              </div>
              <p className="text-base text-white font-medium">Advanced analytics & reports</p>
            </div>
            <div className="flex items-start bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white bg-opacity-30 flex items-center justify-center mr-4 mt-0.5 shadow-md">
                <span className="text-white text-base font-bold">✓</span>
              </div>
              <p className="text-base text-white font-medium">Role-based access control</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

