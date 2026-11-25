import {
  authenticateAdminRequest,
  clearAdminSessionCookie,
  ensureInitialAdminFromEnv,
  hashPassword,
  setAdminSessionCookie,
  signAdminSessionToken,
  verifyPassword,
  verifySameOriginForMutation,
  writeActivityLog,
  type AdminRoleType,
} from './_lib/auth';
import {
  getPool,
  getQueryParam,
  getServerEnv,
  parseJsonBody,
  withTransaction,
  type ApiRequest,
  type ApiResponse,
} from './_lib/db';

function resolveAuthAction(req: ApiRequest): string {
  const fromQuery = getQueryParam(req, '__path');
  if (fromQuery) return fromQuery.replace(/^\/+|\/+$/g, '');
  const cleanUrl = (req.url || '').split('?')[0];
  return cleanUrl
    .replace(/^\/api\/(?:auth|admin)\/?/, '')
    .replace(/^\/+|\/+$/g, '');
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const action = resolveAuthAction(req);
  const method = (req.method || 'GET').toUpperCase();

  try {
    if (action === 'logout' && method === 'POST') {
      if (!verifySameOriginForMutation(req)) {
        return res.status(403).json({ error: 'Cross-origin request rejected.' });
      }
      clearAdminSessionCookie(req, res);
      return res.status(200).json({ ok: true });
    }

    if ((action === 'me' || action === 'session') && method === 'GET') {
      const pool = getPool();
      if (!pool) {
        return res.status(200).json({ authenticated: false, user: null });
      }
      await ensureInitialAdminFromEnv();
      const auth = await authenticateAdminRequest(req);
      if (!auth.ok) {
        return res.status(200).json({ authenticated: false, user: null });
      }
      return res.status(200).json({ authenticated: true, user: auth.caller });
    }

    if (action === 'bootstrap' && method === 'POST') {
      if (!verifySameOriginForMutation(req)) {
        return res.status(403).json({ error: 'Cross-origin request rejected.' });
      }
      const pool = getPool();
      if (!pool) {
        return res.status(503).json({
          error: 'DATABASE_URL must be configured on the server before bootstrapping.',
        });
      }

      const body = parseJsonBody(req);
      const { adminInitialEmail, adminInitialPassword } = getServerEnv();

      const result = await withTransaction(async (client) => {
        await client.query('SELECT pg_advisory_xact_lock(92837465)');
        const { rows } = await client.query<{ cnt: number }>(
          'SELECT count(*)::int AS cnt FROM public.admin_roles'
        );
        if ((rows[0]?.cnt ?? 0) > 0) {
          return { locked: true as const };
        }

        const rawEmail =
          typeof body.email === 'string' && body.email.trim()
            ? body.email.trim().toLowerCase()
            : adminInitialEmail;
        const rawPassword =
          typeof body.password === 'string' && body.password
            ? body.password
            : adminInitialPassword;
        const rawFullName =
          typeof body.fullName === 'string' && body.fullName.trim()
            ? body.fullName.trim()
            : 'Super Administrator';

        if (!rawEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rawEmail)) {
          return { error: 'Valid administrator email is required.', status: 400 as const };
        }
        if (!rawPassword || rawPassword.length < 8) {
          return {
            error: 'Administrator password must be at least 8 characters.',
            status: 400 as const,
          };
        }

        const passwordHash = await hashPassword(rawPassword);
        const profileRes = await client.query<{ id: string }>(
          `INSERT INTO public.profiles (email, password_hash, full_name)
           VALUES ($1, $2, $3)
           ON CONFLICT (email) DO UPDATE
             SET password_hash = EXCLUDED.password_hash,
                 full_name = EXCLUDED.full_name
           RETURNING id`,
          [rawEmail, passwordHash, rawFullName]
        );
        const userId = profileRes.rows[0].id;

        await client.query(
          `INSERT INTO public.admin_roles (user_id, role, is_active)
           VALUES ($1, 'super_admin', true)`,
          [userId]
        );

        await client.query(
          `INSERT INTO public.activity_logs (admin_id, admin_email, action, entity_type, entity_id, description)
           VALUES ($1, $2, 'admin_created', 'admin_roles', $3, $4)`,
          [
            userId,
            rawEmail,
            userId,
            `Initial Super Administrator (${rawEmail}) initialized via server bootstrap.`,
          ]
        );

        return {
          created: true as const,
          user: {
            id: userId,
            email: rawEmail,
            fullName: rawFullName,
            role: 'super_admin' as AdminRoleType,
          },
        };
      });

      if ('locked' in result) {
        return res.status(403).json({
          error: 'Administrator setup is locked because an administrator account already exists.',
        });
      }
      if ('error' in result && result.error) {
        return res.status(result.status ?? 400).json({ error: result.error });
      }
      if (!('user' in result) || !result.user) {
        return res.status(500).json({ error: 'Unable to initialize administrator.' });
      }

      const token = await signAdminSessionToken(result.user);
      setAdminSessionCookie(req, res, token);
      return res.status(201).json({
        message: 'Initial Super Administrator created successfully.',
        user: result.user,
        token,
      });
    }

    if (action === 'login' && method === 'POST') {
      if (!verifySameOriginForMutation(req)) {
        return res.status(403).json({ error: 'Cross-origin request rejected.' });
      }
      const pool = getPool();
      if (!pool) {
        return res.status(503).json({
          error: 'DATABASE_URL is not configured on the server.',
        });
      }

      await ensureInitialAdminFromEnv();

      const body = parseJsonBody(req);
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const { rows } = await pool.query<{
        id: string;
        email: string;
        password_hash: string;
        full_name: string;
        role: AdminRoleType;
        is_active: boolean;
      }>(
        `SELECT p.id, p.email, p.password_hash, p.full_name, ar.role, ar.is_active
         FROM public.profiles p
         INNER JOIN public.admin_roles ar ON ar.user_id = p.id
         WHERE LOWER(p.email) = $1
         LIMIT 1`,
        [email]
      );

      const user = rows[0];
      if (!user || !(await verifyPassword(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      if (!user.is_active) {
        return res.status(403).json({ error: 'This administrator account has been suspended.' });
      }

      const caller = {
        id: user.id,
        email: user.email,
        fullName: user.full_name || user.email,
        role: user.role,
      };
      const token = await signAdminSessionToken(caller);
      setAdminSessionCookie(req, res, token);

      await writeActivityLog({
        adminId: caller.id,
        adminEmail: caller.email,
        action: 'admin_login',
        entityType: 'profiles',
        entityId: caller.id,
        description: `Administrator ${caller.email} signed in.`,
      });

      return res.status(200).json({ user: caller, token });
    }

    if (action === 'change-password' && method === 'POST') {
      const auth = await authenticateAdminRequest(req);
      if (!auth.ok) {
        return res.status(auth.status).json({ error: auth.error });
      }
      const body = parseJsonBody(req);
      const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
      if (newPassword.length < 10) {
        return res.status(400).json({ error: 'Password must be at least 10 characters.' });
      }

      const pool = getPool();
      if (!pool) {
        return res.status(503).json({ error: 'Database not configured.' });
      }

      if (typeof body.currentPassword === 'string' && body.currentPassword.length > 0) {
        const cur = await pool.query<{ password_hash: string }>(
          `SELECT password_hash FROM public.profiles WHERE id = $1 LIMIT 1`,
          [auth.caller.id]
        );
        const okCur = await verifyPassword(body.currentPassword, cur.rows[0]?.password_hash || '');
        if (!okCur) {
          return res.status(400).json({ error: 'Current password is incorrect.' });
        }
      }

      const nextHash = await hashPassword(newPassword);
      await pool.query(`UPDATE public.profiles SET password_hash = $1 WHERE id = $2`, [
        nextHash,
        auth.caller.id,
      ]);

      await writeActivityLog({
        adminId: auth.caller.id,
        adminEmail: auth.caller.email,
        action: 'password_changed',
        entityType: 'profiles',
        entityId: auth.caller.id,
        description: `Administrator ${auth.caller.email} updated their password.`,
      });

      return res.status(200).json({ updated: true });
    }

    return res.status(404).json({ error: 'Authentication endpoint not found.' });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unexpected authentication server error.',
    });
  }
}
