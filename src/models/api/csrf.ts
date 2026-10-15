// Backend settings: csrf_cookie_name = "vekro_csrf" (readable, not httponly), csrf_header_name = "X-CSRF-Token".
export const CSRF_COOKIE = 'vekro_csrf'
export const CSRF_HEADER = 'X-CSRF-Token'

export function readCookie(name: string, cookieString: string = document.cookie): string | null {
  for (const part of cookieString.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

export function csrfToken(): string | null {
  return readCookie(CSRF_COOKIE)
}
