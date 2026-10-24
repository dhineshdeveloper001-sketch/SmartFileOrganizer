import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { deleteStorageFile } from '@/lib/storage';

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
    const fileId = BigInt(id);

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    await deleteStorageFile(file.filename);
    await prisma.file.delete({
      where: { id: fileId },
    });

    return NextResponse.json({
      message: 'File deleted successfully globally!',
    });
  } catch (error) {
    console.error('Admin delete file error:', error);
    return NextResponse.json(
      { message: 'Internal server error deleting file' },
      { status: 500 }
    );
  }
}
