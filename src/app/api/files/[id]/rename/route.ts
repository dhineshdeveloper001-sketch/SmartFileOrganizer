import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { categorizeFile } from '@/lib/categories';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const fileId = BigInt(id);

    const body = await req.json();
    const newName = body?.name?.trim();

    if (!newName) {
      return NextResponse.json(
        { message: 'File name cannot be empty' },
        { status: 400 }
      );
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    if (file.ownerId !== BigInt(user.id) && user.role !== 'ROLE_ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: You do not have permission to rename this file' },
        { status: 403 }
      );
    }

    const updatedCategory = categorizeFile(newName);

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: {
        originalFilename: newName,
        category: updatedCategory,
      },
    });

    return NextResponse.json({
      id: Number(updated.id),
      filename: updated.filename,
      originalFilename: updated.originalFilename,
      category: updated.category,
      size: Number(updated.size),
      uploadDate: updated.uploadDate.toISOString(),
    });
  } catch (error) {
    console.error('Rename file error:', error);
    return NextResponse.json(
      { message: 'Internal server error renaming file' },
      { status: 500 }
    );
  }
}
