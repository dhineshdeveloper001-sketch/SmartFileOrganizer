import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { deleteStorageFile } from '@/lib/storage';

export async function DELETE(
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

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    // Must be owner or admin
    if (file.ownerId !== BigInt(user.id) && user.role !== 'ROLE_ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: You do not have permission to delete this file' },
        { status: 403 }
      );
    }

    await deleteStorageFile(file.filename);
    await prisma.file.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { message: 'Internal server error deleting file' },
      { status: 500 }
    );
  }
}
