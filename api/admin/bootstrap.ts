import {
  getAdminSupabase,
  getServerEnv,
  parseJsonBody,
  timingSafeEqualStr,
  type ApiRequest,
  type ApiResponse,
} from '../_lib/supabaseAdmin';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const adminClient = getAdminSupabase();
    if (!adminClient) {
      return res.status(503).json({
        error:
          'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server environment variables to bootstrap the first administrator.',
      });
    }

    const { count, error: countError } = await adminClient
      .from('admin_roles')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      return res.status(500).json({ error: countError.message });
    }
    if ((count ?? 0) > 0) {
      return res.status(403).json({
        error: 'Administrator setup is locked because an administrator account already exists.',
      });
    }

    const body = parseJsonBody(req);
    const { email, password, fullName, bootstrapSecret } = body;
    const { adminBootstrapSecret } = getServerEnv();

    if (adminBootstrapSecret) {
      if (
        !bootstrapSecret ||
        !timingSafeEqualStr(String(bootstrapSecret), adminBootstrapSecret)
      ) {
        return res.status(403).json({ error: 'Invalid administrator bootstrap secret.' });
      }
    }

    if (
      typeof email !== 'string' ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ||
      typeof password !== 'string' ||
      password.length < 10
    ) {
      return res.status(400).json({
        error: 'Valid email and a strong password (minimum 10 characters) are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName =
      typeof fullName === 'string' && fullName.trim()
        ? fullName.trim()
        : 'Super Administrator';

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: cleanName },
    });

    if (createErr || !created.user) {
      return res.status(400).json({
        error: createErr?.message || 'Could not create admin user.',
      });
    }

    await adminClient.from('profiles').upsert({
      id: created.user.id,
      email: cleanEmail,
      full_name: cleanName,
    });

    const { error: roleErr } = await adminClient.from('admin_roles').insert({
      user_id: created.user.id,
      role: 'super_admin',
      is_active: true,
    });

    if (roleErr) {
      return res.status(500).json({ error: roleErr.message });
    }

    await adminClient.from('activity_logs').insert({
      admin_id: created.user.id,
      admin_email: cleanEmail,
      action: 'admin_created',
      entity_type: 'admin_roles',
      entity_id: created.user.id,
      description: `Initial Super Administrator (${cleanEmail}) initialized via server bootstrap.`,
    });

    return res.status(201).json({
      message: 'Super Administrator created successfully. You may now sign in.',
      email: cleanEmail,
    });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unexpected server error during setup.',
    });
  }
}
