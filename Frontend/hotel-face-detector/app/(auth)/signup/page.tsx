'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SignupForm from '@/app/components/auth/SignupForm';
import { authApi } from '@/app/api/auth';

export default function SignupPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    photos: File[];
  }) => {
    setIsLoading(true);
    setError('');
    
    try {
      await authApi.register(data);
      setSuccess(true);
      
      // Redirect to login after successful signup
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-center mb-6">Signup Successful!</h1>
          <p className="mb-6">Your account has been created successfully. Redirecting to login...</p>
          <div className="flex justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
      <SignupForm 
        onSubmit={handleSignup} 
        error={error} 
        isLoading={isLoading}
      />
    </div>
  );
}