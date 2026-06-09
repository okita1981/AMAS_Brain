import Anthropic from '@anthropic-ai/sdk';

// Server-side wrapper around Anthropic.messages.create that returns the
// concatenated text content of all text blocks (skipping tool blocks).
export async function callClaudeText(opts: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured on the server.');
  }
  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: opts.model || 'claude-sonnet-4-5',
    max_tokens: opts.maxTokens || 2048,
    system: opts.system,
    messages: [{ role: 'user', content: opts.user }],
    temperature: opts.temperature ?? 0.4,
  });
  return response.content
    .map((block: any) => (block.type === 'text' ? block.text : ''))
    .join('\n')
    .trim();
}

// Best-effort JSON parser: extracts the first {...} or [...] block and falls
// back to `fallback` if neither parse succeeds. Used to recover from LLMs that
// wrap their JSON in prose despite instructions.
export function parseJsonLoose<T = any>(text: string, fallback: T): T {
  if (!text) return fallback;
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  try {
    return JSON.parse(match ? match[0] : text) as T;
  } catch {
    return fallback;
  }
}
