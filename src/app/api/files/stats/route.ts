import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const files = await prisma.file.findMany({
      where: { ownerId: BigInt(user.id) },
      select: { category: true, size: true },
    });

    const totalFiles = files.length;
    let totalStorageUsed = 0;
    const filesByCategory: Record<string, number> = {};
    const storageByCategory: Record<string, number> = {};

    for (const f of files) {
      const sizeNum = Number(f.size);
      totalStorageUsed += sizeNum;
      const cat = f.category || 'Others';

      filesByCategory[cat] = (filesByCategory[cat] || 0) + 1;
      storageByCategory[cat] = (storageByCategory[cat] || 0) + sizeNum;
    }

    return NextResponse.json({
      totalFiles,
      totalStorageUsed,
      filesByCategory,
      storageByCategory,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { message: 'Internal server error computing stats' },
      { status: 500 }
    );
  }
}
