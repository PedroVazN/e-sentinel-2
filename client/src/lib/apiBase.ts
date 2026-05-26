const configured = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');

/** Base da API. Local: `/api` (proxy Vite). Produção: URL completa do backend. */
export function getApiBaseUrl(): string {
  return configured || '/api';
}

/** URL absoluta para downloads/links diretos (ex: `/api/reports/stock`). */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const rel = path.replace(/^\/api\/?/, '').replace(/^\//, '');
  return rel ? `${base}/${rel}` : base;
}
