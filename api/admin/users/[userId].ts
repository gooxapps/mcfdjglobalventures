import {
  parseJsonBody,
  verifySuperAdminRequest,
  type ApiRequest,
  type ApiResponse,
} from '../../_lib/supabaseAdmin';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const verified = await verifySuperAdminRequest(req);
    if (!verified.ok) {
      return res.status(verified.status).json({ error: verified.error });
    }
    const { adminClient, caller } = verified;

    const rawId = req.query?.userId;
    const userId = Array.isArray(rawId) ? rawId[0] || '' : rawId || '';

    if (!/^[0-9a-f-]{36}$/i.test(userId)) {
      return res.status(400).json({ error: 'Invalid administrator user ID.' });
    }

    const body = parseJsonBody(req);
    const { role, is_active } = body;

    if (userId === caller.id && is_active === false) {
      return res.status(400).json({
        error: 'You cannot deactivate your own active session.',
      });
    }

    const updates: Record<string, unknown> = {};
    if (
      typeof role === 'string' &&
      ['super_admin', 'store_manager', 'content_manager'].includes(role)
    ) {
      updates.role = role;
    }
    if (typeof is_active === 'boolean') {
      updates.is_active = is_active;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid administrator updates provided.' });
    }

    const { error } = await adminClient
      .from('admin_roles')
      .update(updates)
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    await adminClient.from('activity_logs').insert({
      admin_id: caller.id,
      admin_email: caller.email || '',
      action: 'admin_updated',
      entity_type: 'admin_roles',
      entity_id: userId,
      description: `Updated administrator ${userId} permissions.`,
    });

    return res.status(200).json({ updated: true });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unable to update administrator.',
    });
  }
}
