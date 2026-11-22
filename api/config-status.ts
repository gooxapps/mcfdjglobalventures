import {
  getAdminSupabase,
  getServerEnv,
  type ApiRequest,
  type ApiResponse,
} from './_lib/supabaseAdmin';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { supabaseUrl, supabaseAnonKey, adminBootstrapSecret } = getServerEnv();
  const adminClient = getAdminSupabase();
  let adminExists = false;

  if (adminClient) {
    try {
      const { count } = await adminClient
        .from('admin_roles')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      adminExists = (count ?? 0) > 0;
    } catch {
      adminExists = false;
    }
  }

  return res.status(200).json({
    supabaseClientConfigured: Boolean(supabaseUrl && supabaseAnonKey),
    supabaseServiceConfigured: Boolean(adminClient),
    bootstrapSecretRequired: Boolean(adminBootstrapSecret),
    adminExists,
  });
}
