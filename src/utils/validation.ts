export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PASS_REGEX = /^(?=.*[A-Z]).{8,}$/;

/** Light-grey informational hints shown on focus (not errors) */
export const FIELD_HINTS: Record<string, string> = {
  identifier:      'Введите никнейм или Email',
  nickname:        'Минимум 2 символа',
  email:           'Формат: name@example.com',
  password:        'Минимум 8 символов, 1 заглавная буква',
  passwordConfirm: 'Должен совпадать с паролем выше',
};

export type ValidationMode = 'login' | 'register' | 'profile';

/**
 * Returns an error string if validation fails, or '' if valid.
 * For 'profile' mode, password fields are optional — only validated when non-empty.
 */
export function validateField(
  name: string,
  value: string,
  context: { mode: ValidationMode; password?: string },
): string {
  const { mode, password } = context;

  if (mode === 'login') {
    if (name === 'identifier' && value.length < 2) return 'Никнейм слишком короткий';
    if (name === 'password' && !PASS_REGEX.test(value)) return 'Мин. 8 символов и 1 заглавная буква';
  }

  if (mode === 'register') {
    if (name === 'nickname' && value.length < 2) return 'Никнейм слишком короткий';
    if (name === 'email' && !EMAIL_REGEX.test(value)) return 'Неверный формат почты';
    if (name === 'password' && !PASS_REGEX.test(value)) return 'Мин. 8 символов и 1 заглавная буква';
    if (name === 'passwordConfirm' && value !== password) return 'Пароли не совпадают';
  }

  if (mode === 'profile') {
    if (name === 'nickname' && value.length < 2) return 'Никнейм слишком короткий';
    if (name === 'email' && !EMAIL_REGEX.test(value)) return 'Неверный формат почты';
    // Password is optional in profile — only validate if non-empty
    if (name === 'password' && value.length > 0 && !PASS_REGEX.test(value)) {
      return 'Мин. 8 символов и 1 заглавная буква';
    }
    if (name === 'passwordConfirm' && (password ?? '').length > 0 && value !== password) {
      return 'Пароли не совпадают';
    }
  }

  return '';
}
