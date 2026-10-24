export const FILE_CATEGORIES = [
  'Images',
  'Videos',
  'Documents',
  'PDF',
  'Audio',
  'Archives',
  'Code',
  'Others',
] as const;

export type FileCategory = (typeof FILE_CATEGORIES)[number];

const EXTENSION_CATEGORY_MAP: Record<string, FileCategory> = {
  // Images
  jpg: 'Images',
  jpeg: 'Images',
  png: 'Images',
  gif: 'Images',
  bmp: 'Images',
  webp: 'Images',
  svg: 'Images',
  ico: 'Images',
  tiff: 'Images',
  tif: 'Images',
  heic: 'Images',
  heif: 'Images',

  // Videos
  mp4: 'Videos',
  avi: 'Videos',
  mkv: 'Videos',
  mov: 'Videos',
  wmv: 'Videos',
  webm: 'Videos',
  flv: 'Videos',
  m4v: 'Videos',
  mpg: 'Videos',
  mpeg: 'Videos',
  '3gp': 'Videos',

  // Documents
  doc: 'Documents',
  docx: 'Documents',
  txt: 'Documents',
  xls: 'Documents',
  xlsx: 'Documents',
  ppt: 'Documents',
  pptx: 'Documents',
  csv: 'Documents',
  rtf: 'Documents',
  odt: 'Documents',
  ods: 'Documents',
  odp: 'Documents',
  md: 'Documents',

  // PDF
  pdf: 'PDF',

  // Audio
  mp3: 'Audio',
  wav: 'Audio',
  aac: 'Audio',
  ogg: 'Audio',
  flac: 'Audio',
  m4a: 'Audio',
  wma: 'Audio',
  opus: 'Audio',

  // Archives
  zip: 'Archives',
  rar: 'Archives',
  '7z': 'Archives',
  tar: 'Archives',
  gz: 'Archives',
  bz2: 'Archives',
  xz: 'Archives',
  iso: 'Archives',
  tgz: 'Archives',

  // Code
  html: 'Code',
  css: 'Code',
  js: 'Code',
  jsx: 'Code',
  ts: 'Code',
  tsx: 'Code',
  json: 'Code',
  xml: 'Code',
  java: 'Code',
  py: 'Code',
  cpp: 'Code',
  c: 'Code',
  h: 'Code',
  hpp: 'Code',
  cs: 'Code',
  go: 'Code',
  rs: 'Code',
  php: 'Code',
  rb: 'Code',
  sql: 'Code',
  sh: 'Code',
  bat: 'Code',
  yaml: 'Code',
  yml: 'Code',
};

const MIME_CATEGORY_PREFIXES: Record<string, FileCategory> = {
  'image/': 'Images',
  'video/': 'Videos',
  'audio/': 'Audio',
};

export function getFileExtension(filename: string): string {
  if (!filename || filename.lastIndexOf('.') === -1) {
    return '';
  }
  return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
}

export function sanitizeFilename(filename: string): string {
  // Strip path traversal attempts and special characters
  return filename.replace(/^.*[\\/]/, '').replace(/[^a-zA-Z0-9._\- ()[\]]/g, '_');
}

export function categorizeFile(filename: string, mimeType?: string): FileCategory {
  const ext = getFileExtension(filename);

  if (ext === 'pdf') {
    return 'PDF';
  }

  if (ext && EXTENSION_CATEGORY_MAP[ext]) {
    return EXTENSION_CATEGORY_MAP[ext];
  }

  if (mimeType) {
    const lowerMime = mimeType.toLowerCase();
    if (lowerMime === 'application/pdf') return 'PDF';
    for (const [prefix, category] of Object.entries(MIME_CATEGORY_PREFIXES)) {
      if (lowerMime.startsWith(prefix)) {
        return category;
      }
    }
  }

  return 'Others';
}
