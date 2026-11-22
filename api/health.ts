import type { ApiRequest, ApiResponse } from './_lib/supabaseAdmin';

export default function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return res.status(200).json({ status: 'ok', service: 'mcfdj-global-ventures' });
}
