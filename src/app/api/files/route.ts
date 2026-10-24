import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { categorizeFile, getFileExtension } from '@/lib/categories';
import { storeFile } from '@/lib/storage';

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE_BYTES) || 500 * 1024 * 1024;
const MAX_USER_STORAGE = Number(process.env.MAX_USER_STORAGE_BYTES) || 500 * 1024 * 1024;

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const files = await prisma.file.findMany({
      where: { ownerId: BigInt(user.id) },
      orderBy: { uploadDate: 'desc' },
    });

    const responseList = files.map((f) => ({
      id: Number(f.id),
      filename: f.filename,
      originalFilename: f.originalFilename,
      category: f.category,
      size: Number(f.size),
      uploadDate: f.uploadDate.toISOString(),
      owner: user.username,
    }));

    return NextResponse.json(responseList);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { message: 'Internal server error fetching files' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    // Accept 'file' or 'files'
    const uploadedFiles: File[] = [];
    const singleFile = formData.get('file');
    if (singleFile instanceof File) {
      uploadedFiles.push(singleFile);
    }
    const multiple = formData.getAll('files');
    for (const item of multiple) {
      if (item instanceof File) {
        uploadedFiles.push(item);
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Check user quota
    const currentFiles = await prisma.file.findMany({
      where: { ownerId: BigInt(user.id) },
      select: { size: true },
    });
    const currentTotalStorage = currentFiles.reduce(
      (acc, f) => acc + Number(f.size),
      0
    );

    const totalNewSize = uploadedFiles.reduce((acc, f) => acc + f.size, 0);
    if (currentTotalStorage + totalNewSize > MAX_USER_STORAGE) {
      return NextResponse.json(
        { message: 'Storage quota exceeded (500MB maximum)' },
        { status: 400 }
      );
    }

    const results = [];

    for (const file of uploadedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: `File "${file.name}" exceeds the 500MB size limit` },
          { status: 400 }
        );
      }

      const ext = getFileExtension(file.name);
      const storageKey = ext
        ? `${crypto.randomUUID()}.${ext}`
        : crypto.randomUUID();

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const category = categorizeFile(file.name, file.type);

      await storeFile(storageKey, buffer, file.type || 'application/octet-stream');

      const fileRecord = await prisma.file.create({
        data: {
          filename: storageKey,
          originalFilename: file.name,
          category,
          size: BigInt(file.size),
          ownerId: BigInt(user.id),
        },
      });

      results.push({
        id: Number(fileRecord.id),
        filename: fileRecord.filename,
        originalFilename: fileRecord.originalFilename,
        category: fileRecord.category,
        size: Number(fileRecord.size),
        uploadDate: fileRecord.uploadDate.toISOString(),
      });
    }

    if (results.length === 1) {
      return NextResponse.json(results[0]);
    }

    return NextResponse.json({
      message: 'Files uploaded successfully',
      files: results,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { message: 'Internal server error uploading file' },
      { status: 500 }
    );
  }
}
