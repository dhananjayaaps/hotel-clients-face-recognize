'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import LoginForm from '@/app/components/auth/LoginForm';

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');

  // Handle redirect when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      router.push(user?.role === 'admin' ? '/admin' : '/');
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  if (isAuthenticated) {
    return null; // or a loading spinner while redirect happens
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 p-4">
      <LoginForm onSubmit={handleLogin} error={error} />
    </div>
  );
}