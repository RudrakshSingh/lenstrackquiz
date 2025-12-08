import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Eye, EyeOff, Glasses } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
      showToast('error', error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-black relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20 animate-pulse" />
        
        <div className="w-full max-w-md relative z-10">
          {/* Logo - Interactive */}
          <div className="flex items-center gap-3 mb-8 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Glasses className="text-white" size={28} />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">
                LensTrack
              </h1>
              <p className="text-sm text-slate-600 dark:text-zinc-400">Optical Store Management</p>
            </div>
          </div>

          {/* Login Form */}
          <div className="mb-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-50 mb-2 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-base text-slate-600 dark:text-zinc-400">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <Input
                id="email"
                type="email"
                label="Email Address"
                placeholder="admin@lenstrack.com"
                value={email}
                onChange={(value) => setEmail(value)}
                required
                className="transition-all duration-300 focus-within:shadow-lg"
              />
            </div>

            <div className="relative transform transition-all duration-300 hover:scale-[1.02]">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(value) => setPassword(value)}
                required
                className="transition-all duration-300 focus-within:shadow-lg"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 transform hover:scale-110 active:scale-95"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <Button 
              type="submit" 
              fullWidth 
              loading={loading} 
              className="rounded-full h-12 text-base font-semibold shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              Sign In
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Don't have an account?{' '}
              <Link
                href="/admin/register"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline-offset-4 hover:underline transition-all duration-200 transform inline-block hover:scale-105"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 p-12 items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="max-w-lg text-white relative z-10">
          {/* Lenstrack Logo */}
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-extrabold mb-2 tracking-tight">
              Lenstrack<sup className="text-2xl align-super">®</sup>
            </h1>
          </div>
          
          <h2 className="text-4xl font-bold mb-6 leading-tight transform hover:scale-105 transition-transform duration-300">
            Intelligent Product Recommendations
          </h2>
          <p className="text-lg mb-10 text-blue-100 leading-relaxed">
            Streamline your optical store operations with AI-powered questionnaires
            and smart product recommendations.
          </p>
          <div className="space-y-5">
            <div className="flex items-start gap-4 group cursor-default transform hover:translate-x-2 transition-all duration-300">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm border-2 border-white/30 group-hover:bg-white/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <span className="text-white font-bold text-lg">✓</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1 text-lg group-hover:text-blue-100 transition-colors">5-Minute Customer Journey</h3>
                <p className="text-sm text-blue-100 leading-relaxed">
                  Complete assessment and recommendations in under 5 minutes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 group cursor-default transform hover:translate-x-2 transition-all duration-300" style={{ transitionDelay: '0.1s' }}>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm border-2 border-white/30 group-hover:bg-white/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <span className="text-white font-bold text-lg">✓</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1 text-lg group-hover:text-blue-100 transition-colors">Multi-Store Management</h3>
                <p className="text-sm text-blue-100 leading-relaxed">
                  Manage multiple stores with role-based access control
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 group cursor-default transform hover:translate-x-2 transition-all duration-300" style={{ transitionDelay: '0.2s' }}>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm border-2 border-white/30 group-hover:bg-white/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <span className="text-white font-bold text-lg">✓</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1 text-lg group-hover:text-blue-100 transition-colors">Comprehensive Analytics</h3>
                <p className="text-sm text-blue-100 leading-relaxed">
                  Track performance, conversion rates, and customer insights
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

