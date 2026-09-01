import { POST as uploadMediaHandler } from '@/app/api/media/upload/route';
import { POST as signupHandler } from '@/app/api/auth/signup/route';

describe('Media Upload Validation API Unit Tests', () => {
  let token: string;

  beforeAll(async () => {
    const res = await signupHandler(new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'MediaTester', email: 'mediatester@example.com', password: 'password123' }),
    }));
    const data = await res.json();
    token = data.token;
  });

  it('should accept valid PNG image upload under 10MB', async () => {
    const formData = new FormData();
    const blob = new Blob(['valid image data'], { type: 'image/png' });
    formData.append('file', blob, 'test.png');

    const req = new Request('http://localhost:3000/api/media/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const res = await uploadMediaHandler(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.mediaType).toBe('IMAGE');
  });

  it('should reject unsupported file type server-side', async () => {
    const formData = new FormData();
    const blob = new Blob(['malicious script'], { type: 'application/x-msdownload' });
    formData.append('file', blob, 'malware.exe');

    const req = new Request('http://localhost:3000/api/media/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const res = await uploadMediaHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('Unsupported file type');
  });

  it('should reject file exceeding 10MB limit server-side', async () => {
    const formData = new FormData();
    const largeBlob = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'video/mp4' });
    formData.append('file', largeBlob, 'large_video.mp4');

    const req = new Request('http://localhost:3000/api/media/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const res = await uploadMediaHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('exceeds 10MB limit');
  });
});
