import { Image, Film, FileText, FileArchive, Music, File } from 'lucide-react';
import React from 'react';

export function getFileIcon(category: string, size: number = 24) {
  switch (category) {
    case 'Images':
      return React.createElement(Image, { size, className: 'text-primary' });
    case 'Videos':
      return React.createElement(Film, { size, className: 'text-danger' });
    case 'Documents':
      return React.createElement(FileText, { size, className: 'text-success' });
    case 'PDF':
      return React.createElement(FileText, { size, style: { color: '#ef4444' } });
    case 'Audio':
      return React.createElement(Music, { size, style: { color: '#8b5cf6' } });
    case 'Archives':
      return React.createElement(FileArchive, { size, style: { color: '#f59e0b' } });
    default:
      return React.createElement(File, { size, className: 'text-muted' });
  }
}
