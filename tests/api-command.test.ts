import { describe, expect, it } from 'vitest';
import { GET, POST } from '../api/command';

const post = (body: string) => POST(new Request('http://x/api/command', { method: 'POST', body }));

describe('/api/command (M1 stub)', () => {
  it('GET returns health without exposing secrets', async () => {
    const r = GET();
    const j = await r.json();
    expect(j.ok).toBe(true);
    expect(JSON.stringify(j)).not.toMatch(/sk-|key"/i);
  });
  it('POST validates input', async () => {
    expect((await post('nope')).status).toBe(400);
    expect((await post('{}')).status).toBe(400);
    expect((await post(JSON.stringify({ command: 'x'.repeat(501) }))).status).toBe(413);
  });
  it('POST returns deterministic fallback', async () => {
    const r = await post(JSON.stringify({ command: 'scan the kestrel' }));
    expect(r.status).toBe(200);
    expect((await r.json()).mode).toBe('deterministic-fallback');
  });
});
