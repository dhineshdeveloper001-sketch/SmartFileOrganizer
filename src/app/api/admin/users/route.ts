import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, hashPassword } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { files: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    const response = users.map((u) => ({
      id: Number(u.id),
      username: u.username,
      role: u.role,
      totalFiles: u._count.files,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin get users error:', error);
    return NextResponse.json(
      { message: 'Internal server error fetching users' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { username, password, role = 'ROLE_USER' } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();

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
        role: role === 'ROLE_ADMIN' ? 'ROLE_ADMIN' : 'ROLE_USER',
      },
    });

    return NextResponse.json({ message: 'User created successfully!' });
  } catch (error) {
    console.error('Admin create user error:', error);
    return NextResponse.json(
      { message: 'Internal server error creating user' },
      { status: 500 }
    );
  }
}
