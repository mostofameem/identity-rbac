import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { config } from '../config/env';
import BrandPanel from './auth/BrandPanel';

interface RegistrationForm {
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

const InvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token] = useState(searchParams.get('token') || '');
  const [email, setEmail] = useState('');
  const [form, setForm] = useState<RegistrationForm>({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token');
      return;
    }

    // Decode token to get email (basic JWT decode)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setEmail(payload.email || 'Unknown');
    } catch (err) {
      setError('Invalid invitation token format');
    }
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(''); // Clear error when user types
  };

  const validateForm = (): boolean => {
    if (!form.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!form.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!form.acceptTerms) {
      setError('You must accept the Terms and Conditions to register');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call the registration API with the invitation token
      const response = await fetch(`${config.apiBaseUrl}/api/v1/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          password: form.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login', {
            state: {
              message: 'Account created successfully! Please login with your new credentials.',
              email: email
            }
          });
        }, 2000);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-soft border border-slate-200 sm:rounded-xl sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-50">
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">Registration successful!</h2>
              <p className="mt-2 text-sm text-slate-500">
                Your account has been created successfully. You will be redirected to the login page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      <BrandPanel />

      <div className="flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center lg:text-left">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Complete your account</h2>
          <p className="mt-2 text-sm text-slate-500">
            You've been invited to Event Management
          </p>
        </div>

        <div className="mt-8 sm:mx-auto lg:mx-0 w-full max-w-md">
          <div className="bg-white py-8 px-4 shadow-soft border border-slate-200 rounded-xl sm:px-8">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email (Read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    readOnly
                    className="appearance-none block w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 focus:outline-none sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
                    First name
                  </label>
                  <div className="mt-1">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={form.firstName}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg placeholder-slate-400 bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 sm:text-sm transition-shadow"
                      placeholder="Enter your first name"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
                    Last name
                  </label>
                  <div className="mt-1">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={form.lastName}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg placeholder-slate-400 bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 sm:text-sm transition-shadow"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={form.password}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg placeholder-slate-400 bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 sm:text-sm transition-shadow"
                    placeholder="Enter your password"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Password must be at least 6 characters long
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg placeholder-slate-400 bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 sm:text-sm transition-shadow"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={form.acceptTerms}
                    onChange={handleInputChange}
                    className="focus:ring-primary-500/30 h-4 w-4 text-primary-600 border-slate-300 rounded accent-primary-600"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="acceptTerms" className="text-slate-700">
                    I agree to the{' '}
                    <a href="#" className="text-primary-600 hover:text-primary-500">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-primary-600 hover:text-primary-500">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading || !token || !form.acceptTerms}
                  className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account…
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationPage;
