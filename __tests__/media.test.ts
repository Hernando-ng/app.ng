import { POST as uploadMediaHandler } from '@/app/api/media/upload/route';
import { POST as signupHandler } from '@/app/api/auth/signup/route';

describe('Media Messages API Unit Tests', () => {
  let token: string;

  beforeAll(async () => {
    const res = await signupHandler(new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Uploader', email: 'uploader@example.com', password: 'password123' }),
    }));
    const data = await res.json();
    token = data.token;
  });

  it('should upload an image file and return media metadata', async () => {
    const formData = new FormData();
    const blob = new Blob(['dummy image content'], { type: 'image/png' });
    formData.append('file', blob, 'avatar.png');

    const req = new Request('http://localhost:3000/api/media/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const res = await uploadMediaHandler(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.mediaType).toBe('IMAGE');
    expect(data.fileName).toBe('avatar.png');
    expect(data.mediaUrl).toContain('blob.app.ng');
  });

  it('should upload an audio voice note file and return AUDIO type', async () => {
    const formData = new FormData();
    const blob = new Blob(['voice recording content'], { type: 'audio/webm' });
    formData.append('file', blob, 'voicenote.webm');

    const req = new Request('http://localhost:3000/api/media/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const res = await uploadMediaHandler(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.mediaType).toBe('AUDIO');
    expect(data.fileName).toBe('voicenote.webm');
  });
});
