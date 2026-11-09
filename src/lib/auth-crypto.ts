export interface PasswordCheck {
  minLen: boolean
  hasDigit: boolean
  hasSpecial: boolean
  valid: boolean
}

/**
 * Валидация пароля:
 * 1. Не менее 8 символов
 * 2. Минимум 1 цифра
 * 3. Минимум 1 специальный символ (!@#$%^&*...)
 */
export function validatePassword(password: string): PasswordCheck {
  const minLen = password.length >= 8
  const hasDigit = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)
  return {
    minLen,
    hasDigit,
    hasSpecial,
    valid: minLen && hasDigit && hasSpecial,
  }
}

export function generateSalt(): string {
  return crypto.randomUUID()
}

/**
 * Хэширование пароля через Web Crypto API (SHA-256 с солью)
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder()
  const data = enc.encode(`${salt}:${password}`)
  const hashBuf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
