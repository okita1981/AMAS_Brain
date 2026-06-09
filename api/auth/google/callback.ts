import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodGuard } from '../../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'GET')) return;

  const { code } = req.query;
  console.log(`[OAuth] Google callback received with code: ${code}`);

  // In a real app, exchange code for tokens here.
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'google' }, '*');
              window.close();
            } else {
              window.location.href = '/connectors?success=true';
            }
          </script>
          <p>Google Ads 連携が完了しました。このウィンドウは自動的に閉じます。</p>
        </body>
      </html>
    `);
}
