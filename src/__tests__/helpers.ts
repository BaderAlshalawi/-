/**
 * Base URL for API tests. When running Vitest, relative fetch('/api/...') has no host.
 * Set TEST_BASE_URL (e.g. http://localhost:3000) to run integration tests against a dev server.
 */
export const TEST_BASE_URL = process.env.TEST_BASE_URL || ''

export function apiUrl(path: string): string {
  if (TEST_BASE_URL) {
    return `${TEST_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
  }
  return path
}
