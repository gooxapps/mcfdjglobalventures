import { getPool, type ApiRequest, type ApiResponse } from './_lib/db';

export default async function handler(_req: ApiRequest, res: ApiResponse) {
  const pool = getPool();
  let database: 'connected' | 'not_configured' | 'error' = 'not_configured';

  if (pool) {
    try {
      await pool.query('SELECT 1');
      database = 'connected';
    } catch {
      database = 'error';
    }
  }

  return res.status(200).json({
    status: 'ok',
    service: 'mcfdj-global-ventures',
    database,
    timestamp: new Date().toISOString(),
  });
}
