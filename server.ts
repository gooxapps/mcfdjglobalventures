import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3000;

app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const adminBootstrapSecret = (process.env.ADMIN_BOOTSTRAP_SECRET || '').trim();

function getAdminSupabase() {
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function verifySuperAdminRequest(req: express.Request): Promise<
  | { ok: false; status: number; error: string }
  | { ok: true; adminClient: NonNullable<ReturnType<typeof getAdminSupabase>>; caller: { id: string; email?: string } }
> {
  const adminClient = getAdminSupabase();
  if (!adminClient) {
    return { ok: false, error: 'Server Supabase credentials are not configured.', status: 503 };
  }
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { ok: false, error: 'Missing bearer authorization token.', status: 401 };
  }
  const { data: userData, error: userErr } = await adminClient.auth.getUser(token);
  if (userErr || !userData.user) {
    return { ok: false, error: 'Invalid or expired session token.', status: 401 };
  }
  const { data: roleData, error: roleErr } = await adminClient
    .from('admin_roles')
    .select('role, is_active')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (roleErr || !roleData || !roleData.is_active || roleData.role !== 'super_admin') {
    return { ok: false, error: 'Super Administrator privileges required.', status: 403 };
  }
  return { ok: true, adminClient, caller: userData.user };
}

// Health & safe configuration status (never exposes secrets)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mcfdj-global-ventures' });
});

// Public browser-safe Supabase URL and anon key for runtime-injected Secrets
app.get('/api/public-config', (_req, res) => {
  res.json({
    supabaseUrl,
    supabaseAnonKey,
  });
});

app.get('/api/config-status', async (_req, res) => {
  const adminClient = getAdminSupabase();
  let adminExists = false;
  if (adminClient) {
    const { count } = await adminClient
      .from('admin_roles')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
    adminExists = (count ?? 0) > 0;
  }
  res.json({
    supabaseClientConfigured: Boolean(supabaseUrl && supabaseAnonKey),
    supabaseServiceConfigured: Boolean(adminClient),
    bootstrapSecretRequired: Boolean(adminBootstrapSecret),
    adminExists,
  });
});

// Controlled one-time server-side setup for the first Super Administrator
app.post('/api/admin/bootstrap', async (req, res) => {
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

    const { email, password, fullName, bootstrapSecret } = req.body ?? {};
    if (adminBootstrapSecret) {
      if (!bootstrapSecret || !timingSafeEqualStr(String(bootstrapSecret), adminBootstrapSecret)) {
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
    const cleanName = typeof fullName === 'string' && fullName.trim() ? fullName.trim() : 'Super Administrator';

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: cleanName },
    });

    if (createErr || !created.user) {
      return res.status(400).json({ error: createErr?.message || 'Could not create admin user.' });
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
});

// Super Admin: Create additional admin user
app.post('/api/admin/users', async (req, res) => {
  try {
    const verified = await verifySuperAdminRequest(req);
    if (!verified.ok) {
      return res.status(verified.status).json({ error: verified.error });
    }
    const { adminClient, caller } = verified;
    const { email, password, fullName, role } = req.body ?? {};

    if (
      typeof email !== 'string' ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ||
      typeof password !== 'string' ||
      password.length < 10
    ) {
      return res.status(400).json({ error: 'Valid email and password (min 10 chars) are required.' });
    }
    if (!['super_admin', 'store_manager', 'content_manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid administrator role selected.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = typeof fullName === 'string' && fullName.trim() ? fullName.trim() : cleanEmail;

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: cleanName },
    });

    if (createErr || !created.user) {
      return res.status(400).json({ error: createErr?.message || 'Could not create administrator.' });
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
});

// Super Admin: Update administrator role or active status
app.patch('/api/admin/users/:userId', async (req, res) => {
  try {
    const verified = await verifySuperAdminRequest(req);
    if (!verified.ok) {
      return res.status(verified.status).json({ error: verified.error });
    }
    const { adminClient, caller } = verified;
    const { userId } = req.params;
    const { role, is_active } = req.body ?? {};

    if (!/^[0-9a-f-]{36}$/i.test(userId)) {
      return res.status(400).json({ error: 'Invalid administrator user ID.' });
    }
    if (userId === caller.id && is_active === false) {
      return res.status(400).json({ error: 'You cannot deactivate your own active session.' });
    }

    const updates: Record<string, unknown> = {};
    if (role && ['super_admin', 'store_manager', 'content_manager'].includes(role)) {
      updates.role = role;
    }
    if (typeof is_active === 'boolean') {
      updates.is_active = is_active;
    }

    const { error } = await adminClient.from('admin_roles').update(updates).eq('user_id', userId);
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

    return res.json({ updated: true });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unable to update administrator.',
    });
  }
});

// Dynamic sitemap.xml pulling published products & active categories from Supabase when available
app.get('/sitemap.xml', async (req, res) => {
  const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
  const staticUrls = ['/', '/shop', '/collections', '/about', '/contact', '/privacy', '/terms', '/shipping'];
  const dynamicUrls: string[] = [];

  try {
    if (supabaseUrl && supabaseAnonKey) {
      const publicClient = createClient(supabaseUrl, supabaseAnonKey);
      const [{ data: products }, { data: categories }] = await Promise.all([
        publicClient
          .from('products')
          .select('slug')
          .eq('is_published', true)
          .eq('is_archived', false)
          .limit(500),
        publicClient.from('categories').select('slug').eq('is_active', true).limit(100),
      ]);
      categories?.forEach((c) => dynamicUrls.push(`/shop?category=${encodeURIComponent(c.slug)}`));
      products?.forEach((p) => dynamicUrls.push(`/product/${encodeURIComponent(p.slug)}`));
    }
  } catch {
    // Graceful fallback to static routes
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...dynamicUrls]
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>daily</changefreq>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MCFD J GLOBAL VENTURES server listening on port ${PORT}`);
  });
}

startServer();
