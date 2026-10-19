/**
 * POST /api/command — stub (Milestone 2).
 *
 * Future milestones: this server-side function will call the configured AI
 * provider (OpenRouter by default) with OPENROUTER_API_KEY read from the
 * server environment, validate the structured response against a schema, and
 * return *proposed* actions (the same zod ProposedAction schema the offline
 * interpreter emits) + narrative. The browser engine stays authoritative.
 *
 * Today it never contacts an AI provider and needs no secrets: it returns a
 * deterministic fallback so the client contract can be exercised.
 */

const MAX_COMMAND_CHARS = 500;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export function GET(): Response {
  return json({
    ok: true,
    service: 'starbridge-command',
    milestone: 2,
    aiConfigured: Boolean(process.env.OPENROUTER_API_KEY),
    mode: 'deterministic-fallback',
  });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, 400);
  }
  const command = (body as { command?: unknown })?.command;
  if (typeof command !== 'string' || !command.trim()) return json({ ok: false, error: 'Field "command" (string) is required' }, 400);
  if (command.length > MAX_COMMAND_CHARS) return json({ ok: false, error: `Command exceeds ${MAX_COMMAND_CHARS} characters` }, 413);

  return json({
    ok: true,
    mode: 'deterministic-fallback',
    proposal: null,
    narrative: null,
    note: 'AI interpretation is not enabled yet (Milestone 3). The client uses its local offline interpreter and deterministic engine.',
  });
}
