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

    const [totalUsers, totalFiles, storageAggregate] = await Promise.all([
      prisma.user.count(),
      prisma.file.count(),
      prisma.file.aggregate({
        _sum: { size: true },
      }),
    ]);

    const totalStorageUsed = Number(storageAggregate._sum.size || 0);

    return NextResponse.json({
      totalUsers,
      totalFiles,
      totalStorageUsed,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { message: 'Internal server error computing admin stats' },
      { status: 500 }
    );
  }
}
