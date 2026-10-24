import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getFile } from '@/lib/storage';

export async function GET(
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

    try {
      const { buffer, contentType } = await getFile(file.filename);

      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': contentType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalFilename)}"; filename*=UTF-8''${encodeURIComponent(file.originalFilename)}`,
          'Content-Length': buffer.length.toString(),
        },
      });
    } catch {
      return NextResponse.json(
        { message: 'File not found on server storage. It may have been deleted.' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Admin download error:', error);
    return NextResponse.json(
      { message: 'Internal server error downloading file' },
      { status: 500 }
    );
  }
}
