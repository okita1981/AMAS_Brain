import type { VercelRequest, VercelResponse } from '@vercel/node';

// Restricts a handler to a single HTTP method. Returns true if the method
// matches and the handler should proceed; returns false after sending 405.
export function methodGuard(req: VercelRequest, res: VercelResponse, allowed: string | string[]): boolean {
  const allowedList = Array.isArray(allowed) ? allowed : [allowed];
  if (!req.method || !allowedList.includes(req.method.toUpperCase())) {
    res.setHeader('Allow', allowedList.join(', '));
    res.status(405).json({ error: `Method ${req.method} not allowed`, code: 'METHOD_NOT_ALLOWED' });
    return false;
  }
  return true;
}

// Reads the raw body of a Vercel Function request. Used by the Stripe webhook
// to verify the signature against the unparsed payload.
export async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req as any) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Wraps a handler so unhandled rejections produce JSON 500s instead of
// crashing the runtime with a stack trace HTML page.
export function withErrorHandler(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void> | void,
  label: string
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      await handler(req, res);
    } catch (error: any) {
      console.error(`[${label}] Unhandled error:`, error);
      if (!res.headersSent) {
        res.status(500).json({ error: error?.message || 'Internal server error' });
      }
    }
  };
}
