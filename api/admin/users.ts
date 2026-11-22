import {
  parseJsonBody,
  verifySuperAdminRequest,
  type ApiRequest,
  type ApiResponse,
} from '../_lib/supabaseAdmin';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const verified = await verifySuperAdminRequest(req);
    if (!verified.ok) {
      return res.status(verified.status).json({ error: verified.error });
    }
    const { adminClient, caller } = verified;
    const body = parseJsonBody(req);
    const { email, password, fullName, role } = body;

    if (
      typeof email !== 'string' ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ||
      typeof password !== 'string' ||
      password.length < 10
    ) {
      return res
        .status(400)
        .json({ error: 'Valid email and password (min 10 chars) are required.' });
    }
    if (
      typeof role !== 'string' ||
      !['super_admin', 'store_manager', 'content_manager'].includes(role)
    ) {
      return res.status(400).json({ error: 'Invalid administrator role selected.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName =
      typeof fullName === 'string' && fullName.trim() ? fullName.trim() : cleanEmail;

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: cleanName },
    });

    if (createErr || !created.user) {
      return res.status(400).json({
        error: createErr?.message || 'Could not create administrator.',
      });
    }

    await adminClient.from('profiles').upsert({
      id: created.user.id,
      email: cleanEmail,
      full_name: cleanName,
    });

    const { error: roleErr } = await adminClient.from('admin_roles').insert({
      user_id: created.user.id,
      role,
      is_active: true,
      created_by: caller.id,
    });

    if (roleErr) {
      return res.status(500).json({ error: roleErr.message });
    }

    await adminClient.from('activity_logs').insert({
      admin_id: caller.id,
      admin_email: caller.email || '',
      action: 'admin_created',
      entity_type: 'admin_roles',
      entity_id: created.user.id,
      description: `Created administrator ${cleanEmail} with role ${role}.`,
    });

    return res.status(201).json({ id: created.user.id, email: cleanEmail, role });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unable to create administrator.',
    });
  }
}
