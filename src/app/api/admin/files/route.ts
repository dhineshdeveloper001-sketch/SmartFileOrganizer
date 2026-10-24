import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const files = await prisma.file.findMany({
      include: {
        owner: {
          select: { username: true },
        },
      },
      orderBy: { uploadDate: 'desc' },
    });

    const response = files.map((f) => ({
      id: Number(f.id),
      filename: f.filename,
      originalFilename: f.originalFilename,
      category: f.category,
      size: Number(f.size),
      uploadDate: f.uploadDate.toISOString(),
      owner: f.owner?.username || 'Unknown',
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin get all files error:', error);
    return NextResponse.json(
      { message: 'Internal server error fetching all files' },
      { status: 500 }
    );
  }
}
