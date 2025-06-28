import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export async function POST(req: NextRequest) {
  const data = await req.formData();
  
  // Extract form data
  const email = data.get('email') as string;
  const password = data.get('password') as string;
  const fullName = data.get('fullName') as string;
  const phone = data.get('phone') as string;
  const photos = data.getAll('photos') as File[];

  // In a real app, we would save the files and then store the paths in the database
  // For now, we'll just simulate user creation

  try {
    // Check if user exists
    // ...

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create user object
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      fullName,
      phone,
      role: 'guest',
    };

    // Generate token
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );

    // Save user to database (simulated)
    // users.push(newUser);

    return NextResponse.json({
      userId: newUser.id,
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}