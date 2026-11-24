import { ensureInitialAdminFromEnv } from './_lib/auth';
import { getPool, getServerEnv, type ApiRequest, type ApiResponse } from './_lib/db';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if ((req.method || 'GET').toUpperCase() !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    databaseUrl,
    blobToken,
    jwtSecret,
    adminInitialEmail,
    adminInitialPassword,
    isProduction,
  } = getServerEnv();
  const pool = getPool();

  let databaseReachable = false;
  let adminExists = false;

  if (pool) {
    try {
      await ensureInitialAdminFromEnv();
      const { rows } = await pool.query<{ cnt: number }>(
        'SELECT count(*)::int AS cnt FROM public.admin_roles WHERE is_active = true'
      );
      databaseReachable = true;
      adminExists = (rows[0]?.cnt ?? 0) > 0;
    } catch {
      databaseReachable = false;
      adminExists = false;
    }
  }

  return res.status(200).json({
    databaseConfigured: Boolean(databaseUrl),
    databaseReachable,
    blobConfigured: Boolean(blobToken),
    jwtConfigured: Boolean(jwtSecret),
    envBootstrapConfigured: Boolean(adminInitialEmail && adminInitialPassword),
    adminExists,
    previewAllowed: !isProduction && !databaseUrl,
  });
}
