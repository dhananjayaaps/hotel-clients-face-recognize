import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface User {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
}

const users: User[] = [
  {
    id: '1',
    email: 'admin@nexstay.com',
    password: bcrypt.hashSync('admin123', 10),
    fullName: 'Admin User',
    role: 'admin',
  },
  {
    id: '2',
    email: 'guest@nexstay.com',
    password: bcrypt.hashSync('guest123', 10),
    fullName: 'Guest User',
    role: 'guest',
  },
];

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  try {
    const user = users.find(u => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );

    const { password: _, ...userData } = user;

    return NextResponse.json({
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}