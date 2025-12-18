export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const getFileSizeInMB = (bytes: number): number => {
  return parseFloat((bytes / (1024 * 1024)).toFixed(2));
};

export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

export const isImageFile = (mimetype: string): boolean => {
  return mimetype.startsWith('image/');
};

export const isPdfFile = (mimetype: string): boolean => {
  return mimetype === 'application/pdf';
};

export const isDocumentFile = (mimetype: string): boolean => {
  const documentMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ];
  return documentMimeTypes.includes(mimetype);
};

export const getFileIcon = (mimetype: string): string => {
  if (isImageFile(mimetype)) return '🖼️';
  if (isPdfFile(mimetype)) return '📄';
  if (mimetype.includes('word')) return '📝';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return '📽️';
  if (mimetype.includes('zip') || mimetype.includes('compressed')) return '📦';
  if (mimetype.includes('text')) return '📃';
  return '📎';
};

export const validateFileSize = (file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } => {
  const fileSizeMB = getFileSizeInMB(file.size);
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File size (${fileSizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }
  return { valid: true };
};

export const validateFileType = (
  file: File,
  allowedTypes: string[] = []
): { valid: boolean; error?: string } => {
  if (allowedTypes.length === 0) return { valid: true };

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }
  return { valid: true };
};

export const validateFile = (
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } => {
  const sizeValidation = validateFileSize(file, options.maxSizeMB);
  if (!sizeValidation.valid) return sizeValidation;

  const typeValidation = validateFileType(file, options.allowedTypes);
  if (!typeValidation.valid) return typeValidation;

  return { valid: true };
};

export const downloadFile = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

export const getFilePreviewUrl = (file: File): string | null => {
  if (isImageFile(file.type)) {
    return URL.createObjectURL(file);
  }
  return null;
};

export const revokeFilePreviewUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};
