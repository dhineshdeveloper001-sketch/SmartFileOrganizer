import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body || {};

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json(
        { message: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();

    if (!process.env.DATABASE_URL) {
      console.error('Registration failed: DATABASE_URL is not set in environment variables.');
      return NextResponse.json(
        { 
          message: 'Database configuration missing: DATABASE_URL is not set in environment variables.',
          error: 'Please add DATABASE_URL to your Vercel Project Settings -> Environment Variables.'
        },
        { status: 500 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Error: Username is already taken!' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.create({
      data: {
        username: trimmedUsername,
        password: hashedPassword,
        role: 'ROLE_USER',
      },
    });

    return NextResponse.json({
      message: 'User registered successfully!',
    });
  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        message: 'Internal server error during registration',
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
