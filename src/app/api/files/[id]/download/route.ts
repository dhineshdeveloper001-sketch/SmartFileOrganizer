import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getFile } from '@/lib/storage';

export async function GET(
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

    if (file.ownerId !== BigInt(user.id) && user.role !== 'ROLE_ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: You do not have permission to download this file' },
        { status: 403 }
      );
    }

    // 1. Check if file is stored in database (persistent across all serverless instances)
    const dbFileData = await prisma.fileData.findUnique({
      where: { fileId },
    });

    if (dbFileData) {
      return new Response(new Uint8Array(dbFileData.data), {
        headers: {
          'Content-Type': dbFileData.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalFilename)}"; filename*=UTF-8''${encodeURIComponent(file.originalFilename)}`,
          'Content-Length': dbFileData.data.length.toString(),
        },
      });
    }

    // 2. Fallback to S3 or local storage
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
    console.error('Download error:', error);
    return NextResponse.json(
      { message: 'Internal server error downloading file' },
      { status: 500 }
    );
  }
}
