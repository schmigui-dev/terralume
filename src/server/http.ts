import type { ApiError, ApiErrorCode } from '#/shared/types/geo'

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
}

export function json(body: unknown, init: { status?: number; maxAge?: number } = {}): Response {
  const headers: Record<string, string> = {
    'content-type': 'application/json; charset=utf-8',
    ...SECURITY_HEADERS,
    'cache-control': init.maxAge ? `public, max-age=${init.maxAge}, stale-while-revalidate=${init.maxAge * 5}` : 'no-store',
  }
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers })
}

const STATUS: Record<ApiErrorCode, number> = {
  invalid_params: 400,
  upstream_unavailable: 503,
  upstream_invalid: 502,
  internal: 500,
}

export function apiError(code: ApiErrorCode, message: string): Response {
  const body: ApiError = { error: { code, message } }
  return json(body, { status: STATUS[code] })
}
