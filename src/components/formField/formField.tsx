import { useState, useMemo } from 'react';
import { Eye, EyeOff, AlertCircle, Check, X, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import styles from './formField.module.scss';
import { FIELD_HINTS, getPasswordChecks } from '@/utils/validation';

interface FormFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  type?: 'text' | 'email' | 'password';
  /** Red border + error text below the field — only shown after blur (pass undefined until touched) */
  error?: string;
  /** Override the default hint from FIELD_HINTS (shown in tooltip bubble on focus, left of field) */
  hint?: string;
  showHint?: boolean;
  autoComplete?: string;
  /** Background colour of the parent container — used for floating label bg */
  bgColor?: string;
}

export function FormField({
  name,
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  error,
  hint,
  showHint = true,
  autoComplete,
  bgColor,
}: FormFieldProps) {
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPass ? 'text' : 'password') : type;
  const hasError = !!error;
  const showError = hasError && !focused;

  // Hint shown in the tooltip bubble on focus, regardless of current validation state.
  const resolvedHint = hint ?? FIELD_HINTS[name];
  const showHintBubble = showHint && focused && !!resolvedHint;

  const labelStyle = bgColor ? { backgroundColor: bgColor } : undefined;

  const isPasswordField = name === 'password';
  const passwordChecks = getPasswordChecks(value);

  const passwordStrength = useMemo(() => {
    if (!isPasswordField) return { score: 0, label: '', level: '' as const };
    const checks = [
      passwordChecks.hasUppercase,
      passwordChecks.hasLowercase,
      passwordChecks.hasDigit,
      passwordChecks.hasMinLength,
    ];
    const score = checks.filter(Boolean).length;
    if (score === 0) return { score, label: '', level: 'none' as const };
    if (score <= 1) return { score, label: 'Слабый', level: 'weak' as const };
    if (score <= 2) return { score, label: 'Слабый', level: 'weak' as const };
    if (score <= 3) return { score, label: 'Средний', level: 'medium' as const };
    return { score, label: 'Надёжный', level: 'strong' as const };
  }, [isPasswordField, passwordChecks]);

  const renderHint = () => {
    if (!isPasswordField) return resolvedHint;

    const items = [
      { valid: passwordChecks.hasMinLength, label: 'Минимум 8 символов' },
      { valid: passwordChecks.hasUppercase, label: 'Заглавная буква (A-Z)' },
      { valid: passwordChecks.hasLowercase, label: 'Строчная буква (a-z)' },
      { valid: passwordChecks.hasDigit, label: 'Цифра (0-9)' },
    ];

    const StrengthIcon = passwordStrength.level === 'strong'
      ? ShieldCheck
      : passwordStrength.level === 'medium'
        ? ShieldAlert
        : ShieldX;

    return (
      <div className={styles.formField__passwordChecks}>
        {/* Strength bar */}
        {value.length > 0 && (
          <div className={styles.formField__strengthSection}>
            <div className={styles.formField__strengthHeader}>
              <StrengthIcon size={14} />
              <span
                className={clsx(
                  styles.formField__strengthLabel,
                  styles[`formField__strengthLabel_${passwordStrength.level}`],
                )}
              >
                {passwordStrength.label}
              </span>
            </div>
            <div className={styles.formField__strengthTrack}>
              {[1, 2, 3, 4].map((segment) => (
                <motion.div
                  key={segment}
                  className={clsx(
                    styles.formField__strengthSegment,
                    segment <= passwordStrength.score &&
                      styles[`formField__strengthSegment_${passwordStrength.level}`],
                  )}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: segment <= passwordStrength.score ? 1 : 0 }}
                  transition={{ duration: 0.3, delay: segment * 0.05 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {value.length > 0 && <div className={styles.formField__checksDivider} />}

        {/* Check items */}
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
            className={clsx(
              styles.formField__passwordCheck,
              item.valid && styles.formField__passwordCheck_valid,
            )}
          >
            <span className={styles.formField__checkIcon}>
              {item.valid ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={2.5} />}
            </span>
            <span>{item.label}</span>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.formField}>
      {/* inputGroup is `position: relative` — hint bubble is positioned inside it
          so `top: 50%` centers exactly on the input height */}
      <div
        className={clsx(
          styles.formField__inputGroup,
          showError && styles.formField__inputGroup_error,
        )}
      >
        {/* Hint tooltip bubble — to the left, vertically centered on the input */}
        <AnimatePresence>
          {showHintBubble && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.formField__hintBubble}
            >
              {renderHint()}
            </motion.div>
          )}
        </AnimatePresence>

        <input
          id={name}
          className={styles.formField__input}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholder=" "
          autoComplete={autoComplete ?? (isPassword ? 'current-password' : 'off')}
        />
        <label
          htmlFor={name}
          className={styles.formField__label}
          style={labelStyle}
        >
          {label}
        </label>

        {isPassword && (
          <button
            type="button"
            className={styles.formField__eyeBtn}
            onClick={() => setShowPass((v) => !v)}
            tabIndex={-1}
          >
            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>

      {/* Error text below the field — only rendered after blur (caller controls `error` prop) */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={styles.formField__errorText}
          >
            <AlertCircle size={13} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
