export interface BackendConfigStatus {
  databaseConfigured: boolean;
  databaseReachable: boolean;
  blobConfigured: boolean;
  jwtConfigured: boolean;
  envBootstrapConfigured: boolean;
  adminExists: boolean;
}

let cachedStatus: BackendConfigStatus | null = null;
let statusPromise: Promise<BackendConfigStatus> | null = null;
let inMemoryAdminToken: string | null = null;

export function setAdminSessionToken(token: string | null): void {
  inMemoryAdminToken = token && token.trim() ? token.trim() : null;
  cachedStatus = null;
}

export function getAdminSessionToken(): string | null {
  return inMemoryAdminToken;
}

export async function fetchBackendStatus(force = false): Promise<BackendConfigStatus> {
  if (!force && cachedStatus) return cachedStatus;
  if (!force && statusPromise) return statusPromise;

  statusPromise = (async () => {
    try {
      const res = await fetch('/api/config-status', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = (await res.json()) as BackendConfigStatus;
        cachedStatus = data;
        return data;
      }
    } catch {
      // Fall through to unreachable status
    }
    const fallback: BackendConfigStatus = {
      databaseConfigured: false,
      databaseReachable: false,
      blobConfigured: false,
      jwtConfigured: false,
      envBootstrapConfigured: false,
      adminExists: false,
    };
    cachedStatus = fallback;
    return fallback;
  })();

  try {
    return await statusPromise;
  } finally {
    statusPromise = null;
  }
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');
  if (inMemoryAdminToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${inMemoryAdminToken}`);
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  const text = await res.text();
  let parsed: Record<string, unknown> = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      parsed = {};
    }
  }

  if (!res.ok) {
    const errMsg =
      typeof parsed.error === 'string' && parsed.error
        ? parsed.error
        : res.status >= 500
        ? `Server error (${res.status}). Verify your latest code is deployed to Vercel and your database variables are configured.`
        : `Request failed with status ${res.status}.`;
    throw new Error(errMsg);
  }

  return parsed as unknown as T;
}
