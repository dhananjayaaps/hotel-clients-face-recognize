import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  error?: string;
}

export default function LoginForm({ onSubmit, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
      <h1 className="text-3xl font-bold text-center mb-6">Login to NexStay</h1>
      {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" loading={loading}>
          Login
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        Don't have an account?{' '}
        <a href="/signup" className="text-blue-600 hover:underline">
          Sign up
        </a>
      </div>
    </div>
  );
}