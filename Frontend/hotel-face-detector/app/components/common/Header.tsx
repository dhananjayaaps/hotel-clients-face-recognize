'use client';

import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import Button from '@/app/components/ui/Button';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600 flex items-center">
          <span className="mr-1">Nex</span>
          <span className="bg-blue-600 text-white px-2 py-1 rounded">Stay</span>
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <Link href="/rooms" className="hover:text-blue-600">Rooms</Link>
          <Link href="/about" className="hover:text-blue-600">About</Link>
          <Link href="/contact" className="hover:text-blue-600">Contact</Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <Link href="/admin" className="hover:text-blue-600">
                  Admin
                </Link>
              )}
              <Link href="/dashboard" className="hover:text-blue-600">
                Dashboard
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;