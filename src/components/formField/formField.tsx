import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import styles from './formField.module.scss';
import { FIELD_HINTS } from '@/utils/validation';

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
  autoComplete,
  bgColor,
}: FormFieldProps) {
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPass ? 'text' : 'password') : type;
  const hasError = !!error;

  // Hint shown in the tooltip bubble on focus (only when no error)
  const resolvedHint = hint ?? FIELD_HINTS[name];
  const showHintBubble = focused && !hasError && !!resolvedHint;

  const labelStyle = bgColor ? { backgroundColor: bgColor } : undefined;

  return (
    <div className={styles.formField}>
      {/* inputGroup is `position: relative` — hint bubble is positioned inside it
          so `top: 50%` centers exactly on the input height */}
      <div
        className={clsx(
          styles.formField__inputGroup,
          hasError && styles.formField__inputGroup_error,
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
              {resolvedHint}
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
        {hasError && (
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
