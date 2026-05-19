export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PASS_REGEX = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
export const LATIN_ONLY_REGEX = /^[a-zA-Z0-9_]*$/; 

/** Light-grey informational hints shown on focus (not errors) */
export const FIELD_HINTS: Record<string, string> = {
  identifier:      'Введите никнейм или Email',
  nickname:        'Минимум 2 символа',
  email:           'Формат: name@example.com',
  password:        '8+ символов латиницей: хотя бы одна большая и одна маленькая буква',
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
    if (name === 'identifier') {
      if (value.length < 2) return 'Никнейм слишком короткий';
      if (!LATIN_ONLY_REGEX.test(value)) return 'Только латинские буквы и цифры';
    } 
    if (name === 'password') {
      if (!PASS_REGEX.test(value)) return '8+ символов: мин. по 1 большой и маленькой букве';
      if (!LATIN_ONLY_REGEX.test(value)) return 'Пароль должен быть на латинице';
    } 
      
  }

  if (mode === 'register') {
    if (name === 'nickname') { 
      if ( value.length < 2) return 'Никнейм слишком короткий';
      if (!LATIN_ONLY_REGEX.test(value)) return 'Только латинские буквы и цифры';
    }
    if (name === 'email') {
      if (!EMAIL_REGEX.test(value)) return 'Неверный формат почты';
    } 
    if (name === 'password') {
      if (!PASS_REGEX.test(value)) return '8+ символов: мин. по 1 большой и маленькой букве';
      if (!LATIN_ONLY_REGEX.test(value)) return 'Пароль должен быть на латинице';
    } 
    if (name === 'passwordConfirm') {
      if (value !== password) return 'Пароли не совпадают';
      if (!LATIN_ONLY_REGEX.test(value)) return 'Пароль должен быть на латинице';
    }
  }

  if (mode === 'profile') {
    if (name === 'nickname') { 
      if ( value.length < 2) return 'Никнейм слишком короткий';
      if (!LATIN_ONLY_REGEX.test(value)) return 'Только латинские буквы и цифры';
    }
    if (name === 'email' && !EMAIL_REGEX.test(value)) return 'Неверный формат почты';
    // Password is optional in profile — only validate if non-empty
    if (name === 'password' && value.length > 0 ) {
      if (!PASS_REGEX.test(value)) {
        return '8+ символов: мин. по 1 большой и маленькой букве';
      }
      if (!LATIN_ONLY_REGEX.test(value)) return 'Пароль должен быть на латинице';
    } 
    
    if (name === 'passwordConfirm') {
      if((password ?? '').length > 0 && value !== password) {
        return 'Пароли не совпадают';
      }
      if (!LATIN_ONLY_REGEX.test(value)) return 'Пароль должен быть на латинице';
    }
  }

  return '';
}
