import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, hashPassword } from '@/lib/auth';
import { deleteStorageFile } from '@/lib/storage';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = BigInt(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { username, password, role } = body || {};

    const updateData: { username?: string; password?: string; role?: string } = {};

    if (username && username.trim() !== user.username) {
      const trimmed = username.trim();
      const existing = await prisma.user.findUnique({
        where: { username: trimmed },
      });
      if (existing) {
        return NextResponse.json(
          { message: 'Error: Username is already taken!' },
          { status: 400 }
        );
      }
      updateData.username = trimmed;
    }

    if (password && typeof password === 'string' && password.trim().length > 0) {
      updateData.password = await hashPassword(password.trim());
    }

    if (role && (role === 'ROLE_USER' || role === 'ROLE_ADMIN')) {
      updateData.role = role;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ message: 'User updated successfully!' });
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json(
      { message: 'Internal server error updating user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = BigInt(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { files: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Delete all physical files owned by this user
    for (const file of user.files) {
      try {
        await deleteStorageFile(file.filename);
      } catch (err) {
        console.warn('Could not delete storage file:', file.filename, err);
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      message: 'User and all associated files deleted successfully!',
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json(
      { message: 'Internal server error deleting user' },
      { status: 500 }
    );
  }
}
