export function formatPrice(amount: number, currencySymbol = 'CAD $'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${currencySymbol}${safe.toLocaleString('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatShortDate(dateIso: string | null | undefined): string {
  if (!dateIso) return '—';
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateIso: string | null | undefined): string {
  if (!dateIso) return '—';
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function isSafeHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
