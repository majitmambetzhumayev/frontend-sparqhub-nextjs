// src/lib/csrf.ts
import Cookies from 'js-cookie';

/**
 * Get the Django CSRF token from the non‑HttpOnly cookie.
 */
export function getCsrfToken(): string | undefined {
  return Cookies.get('csrftoken');
}
