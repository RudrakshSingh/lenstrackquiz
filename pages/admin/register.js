import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Mail, Lock, Eye, EyeOff, User, Building, Phone } from 'lucide-react';
import { api } from '../../lib/api-client';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    organizationName: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.organizationName) {
      newErrors.organizationName = 'Organization name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('error', 'Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      // Register the organization and super admin user
      const response = await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        organizationName: formData.organizationName,
        phone: formData.phone,
      });

      // Check if registration returned a token (new flow)
      if (response && response.data && response.data.token) {
        // Registration API now returns token directly, use it
        if (typeof window !== 'undefined') {
          localStorage.setItem('lenstrack_token', response.data.token);
        }
        showToast('success', 'Registration successful! Redirecting...');
        // Refresh the page to initialize auth state
        router.push('/admin');
      } else {
        // Fallback: try to login after registration
        showToast('success', 'Registration successful! Logging you in...');
        await login(formData.email, formData.password);
        router.push('/admin');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 'RESOURCE_CONFLICT' || error.code === 'CONFLICT_ERROR') {
        setErrors({ email: 'An account with this email already exists' });
        showToast('error', 'An account with this email already exists');
      } else if (error.code === 'SERVER_ERROR' || error.code === 'INVALID_RESPONSE') {
        showToast('error', 'Server error occurred. Please check the server logs and try again.');
      } else {
        showToast('error', error.message || 'Registration failed. Please try again.');
      }
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
            <h2 className="mt-6 text-center text-3xl font-extrabold text-black">
              Create Admin Account
            </h2>
            <p className="mt-2 text-center text-sm text-black">
              Set up your organization and admin account
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="Organization Name"
                value={formData.organizationName}
                onChange={(value) => setFormData({ ...formData, organizationName: value })}
                placeholder="Enter your organization name"
                required
                error={errors.organizationName}
                icon={<Building className="h-5 w-5" />}
                disabled={loading}
              />
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                placeholder="Enter your full name"
                required
                error={errors.name}
                icon={<User className="h-5 w-5" />}
                disabled={loading}
              />
              <Input
                label="Email address"
                type="email"
                value={formData.email}
                onChange={(value) => setFormData({ ...formData, email: value })}
                placeholder="Enter your email"
                required
                error={errors.email}
                icon={<Mail className="h-5 w-5" />}
                disabled={loading}
              />
              <Input
                label="Phone (Optional)"
                type="tel"
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                placeholder="Enter your phone number"
                error={errors.phone}
                icon={<Phone className="h-5 w-5" />}
                disabled={loading}
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(value) => setFormData({ ...formData, password: value })}
                  placeholder="Enter your password"
                  required
                  error={errors.password}
                  icon={<Lock className="h-5 w-5" />}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-black"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
                  placeholder="Confirm your password"
                  required
                  error={errors.confirmPassword}
                  icon={<Lock className="h-5 w-5" />}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-black"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
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
                Create Account
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-black">
                Already have an account?{' '}
                <a
                  href="/admin/login"
                  className="font-medium text-primary hover:text-primary-hover"
                >
                  Sign in
                </a>
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
              <Building className="h-14 w-14 text-white" />
            </div>
          </div>
          <h3 className="text-4xl font-bold mb-4 text-white drop-shadow-lg">Welcome to Lenstrack</h3>
          <p className="text-xl mb-8 text-white opacity-95 leading-relaxed">
            Manage your optical stores, products, and customer recommendations all in one place
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

