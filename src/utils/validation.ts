export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const NICKNAME_REGEX = /^[\p{L}\p{Nd}_-]*$/u;

const MIN_NICKNAME_LENGTH = 3;
const MAX_NICKNAME_LENGTH = 32;
const MIN_PASSWORD_LENGTH = 8;

export const VALIDATION_ERRORS = {
  required: 'Поле обязательно для заполнения',
  nickname: {
    tooShort: `Никнейм должен быть не короче ${MIN_NICKNAME_LENGTH} символов`,
    tooLong: `Никнейм должен быть не длиннее ${MAX_NICKNAME_LENGTH} символов`,
    invalidChars: 'Никнейм может содержать только буквы, цифры, _ и -',
  },
  identifier: {
    tooShort: `Никнейм или Email должен быть не короче ${MIN_NICKNAME_LENGTH} символов`,
    tooLong: `Никнейм должен быть не длиннее ${MAX_NICKNAME_LENGTH} символов`,
    invalidChars: 'Никнейм может содержать только буквы, цифры, _ и -',
  },
  email: {
    invalidFormat: 'Неверный формат почты',
  },
  password: {
    tooShort: `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`,
    missingUppercase: 'Пароль должен содержать хотя бы одну заглавную букву',
    missingLowercase: 'Пароль должен содержать хотя бы одну строчную букву',
    missingDigit: 'Пароль должен содержать хотя бы одну цифру',
    mismatch: 'Пароли не совпадают',
  },
} as const;

export function getPasswordChecks(value: string) {
  return {
    hasUppercase: /\p{Lu}/u.test(value),
    hasLowercase: /\p{Ll}/u.test(value),
    hasDigit: /\p{Nd}/u.test(value),
    hasMinLength: value.length >= MIN_PASSWORD_LENGTH,
  };
}

type NicknameValidationErrors = {
  tooShort: string;
  tooLong: string;
  invalidChars: string;
};

function validateNickname(
  value: string,
  errors: NicknameValidationErrors = VALIDATION_ERRORS.nickname,
): string {
  if (value.length === 0) return VALIDATION_ERRORS.required;
  if (value.length < MIN_NICKNAME_LENGTH) return errors.tooShort;
  if (value.length > MAX_NICKNAME_LENGTH) return errors.tooLong;
  if (!NICKNAME_REGEX.test(value)) return errors.invalidChars;

  return '';
}

function validateEmail(value: string): string {
  if (value.length === 0) return VALIDATION_ERRORS.required;
  if (!EMAIL_REGEX.test(value)) return VALIDATION_ERRORS.email.invalidFormat;

  return '';
}

function validatePassword(value: string): string {
  const checks = getPasswordChecks(value);

  if (value.length === 0) return VALIDATION_ERRORS.required;
  if (!checks.hasMinLength) return VALIDATION_ERRORS.password.tooShort;
  if (!checks.hasUppercase) return VALIDATION_ERRORS.password.missingUppercase;
  if (!checks.hasLowercase) return VALIDATION_ERRORS.password.missingLowercase;
  if (!checks.hasDigit) return VALIDATION_ERRORS.password.missingDigit;

  return '';
}

/** Light-grey informational hints shown on focus (not errors) */
export const FIELD_HINTS: Record<string, string> = {
  identifier: 'Введите никнейм или Email',
  nickname: 'От 3 до 32 символов: буквы, цифры, _ и -',
  email: 'Формат: name@example.com',
  password: 'Минимум 8 символов: заглавная буква, строчная буква и цифра',
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
      if (value.length === 0) return VALIDATION_ERRORS.required;

      if (value.includes('@')) {
        const emailError = validateEmail(value);
        if (emailError) return emailError;
      } else {
        const nicknameError = validateNickname(value, VALIDATION_ERRORS.identifier);
        if (nicknameError) return nicknameError;
      }
    }

    if (name === 'password') {
      const passwordError = validatePassword(value);
      if (passwordError) return passwordError;
    }
  }

  if (mode === 'register') {
    if (name === 'nickname') {
      const nicknameError = validateNickname(value);
      if (nicknameError) return nicknameError;
    }

    if (name === 'email') {
      const emailError = validateEmail(value);
      if (emailError) return emailError;
    }

    if (name === 'password') {
      const passwordError = validatePassword(value);
      if (passwordError) return passwordError;
    }

    if (name === 'passwordConfirm') {
      if (value.length === 0) return VALIDATION_ERRORS.required;
      if (value !== password) return VALIDATION_ERRORS.password.mismatch;
    }
  }

  if (mode === 'profile') {
    if (name === 'nickname') {
      const nicknameError = validateNickname(value);
      if (nicknameError) return nicknameError;
    }

    if (name === 'email') {
      const emailError = validateEmail(value);
      if (emailError) return emailError;
    }

    // Password is optional in profile — only validate if non-empty
    if (name === 'password' && value.length > 0) {
      const passwordError = validatePassword(value);
      if (passwordError) return passwordError;
    }

    if (name === 'passwordConfirm') {
      if ((password ?? '').length > 0 && value.length === 0) {
        return VALIDATION_ERRORS.required;
      }
      if ((password ?? '').length > 0 && value !== password) {
        return VALIDATION_ERRORS.password.mismatch;
      }
    }
  }

  return '';
}
