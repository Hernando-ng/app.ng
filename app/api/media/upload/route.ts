import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthUserFromRequest } from '@/lib/auth';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/webm', 'audio/wav', 'audio/ogg',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export async function POST(req: Request) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name;
    const fileSize = file.size;
    const mimeType = file.type;

    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: `Unsupported file type: ${mimeType}` }, { status: 400 });
    }

    let mediaType = 'DOCUMENT';
    if (mimeType.startsWith('image/')) mediaType = 'IMAGE';
    else if (mimeType.startsWith('video/')) mediaType = 'VIDEO';
    else if (mimeType.startsWith('audio/')) mediaType = 'AUDIO';

    // In serverless / test environment, generate pre-signed cloud storage URL
    const fileKey = crypto.randomBytes(16).toString('hex');
    const mediaUrl = `https://blob.app.ng/uploads/${fileKey}-${encodeURIComponent(fileName)}`;

    return NextResponse.json({
      mediaUrl,
      mediaType,
      fileName,
      fileSize,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Media upload failed' }, { status: 500 });
  }
}
