import { useState, useEffect, useCallback } from 'react';
import styles from './authModal.module.scss';
import { authService } from '@/api/auth';
import { useUserStore } from '@/store/useUserStore';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { FormField } from '@/components/formField/formField';
import { validateField } from '@/utils/validation';

interface AuthModalProps {
  onSuccess: () => void;
  closeAttemptTrigger: number;
  onConfirmClose: () => void;
}

type FormDataKeys = 'identifier' | 'nickname' | 'email' | 'password' | 'passwordConfirm';

export const AuthModal = ({ onSuccess, closeAttemptTrigger, onConfirmClose }: AuthModalProps) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormDataKeys, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FormDataKeys, boolean>>>({});

  const [isConfirmingClose, setIsConfirmingClose] = useState(false);

  const setAuth = useUserStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    identifier: '',
    nickname: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const resetForm = () => {
    setFormData({ identifier: '', nickname: '', email: '', password: '', passwordConfirm: '' });
    setFieldErrors({});
    setTouched({});
    setGlobalError(null);
  };

  const isFormDirty = useCallback(() => {
    return Object.values(formData).some((value) => value.trim() !== '');
  }, [formData]);

  const runValidation = (name: FormDataKeys, value: string) => {
    const error = validateField(name, value, { mode, password: formData.password });
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[name] = error;
      } else {
        delete next[name];
      }
      return next;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as FormDataKeys;
    const value = e.target.value;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === 'password') {
        if (touched.passwordConfirm || newData.passwordConfirm.length > 0) {
          const confirmError = validateField('passwordConfirm', newData.passwordConfirm, { 
            mode, 
            password: value 
          });
          setFieldErrors((prev) => {
            const next = {...prev};
            if (confirmError) next.passwordConfirm = confirmError;
            else delete next.passwordConfirm;
            return next;
          })
        }
      }
      return newData;
    });

    if (isConfirmingClose) {
      setIsConfirmingClose(false);
      setGlobalError(null);
    }
    setGlobalError(null);

    // While typing, do not create new errors — errors should appear only on blur.
    // If this field already has an error, clear it as soon as the value becomes valid.
    if (fieldErrors[name]) {
      const error = validateField(name, value, { mode, password: formData.password });
      if (!error) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const name = e.target.name as FormDataKeys;
    setTouched((prev) => ({ ...prev, [name]: true }));
    runValidation(name, formData[name]);
  };

  useEffect(() => {
    if (closeAttemptTrigger === 0) return;

    if (!isFormDirty()) {
      onConfirmClose();
      return;
    }

    if (isConfirmingClose) {
      onConfirmClose();
    } else {
      setIsConfirmingClose(true);
      setGlobalError('Вы точно хотите закрыть форму? Все введённые вами данные будут потеряны.');
    }
  }, [closeAttemptTrigger, onConfirmClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fieldsToValidate: FormDataKeys[] = mode === 'login'
      ? ['identifier', 'password']
      : ['nickname', 'email', 'password', 'passwordConfirm'];
    const nextTouched = fieldsToValidate.reduce<Partial<Record<FormDataKeys, boolean>>>(
      (acc, field) => ({ ...acc, [field]: true }),
      {},
    );
    const nextErrors = fieldsToValidate.reduce<Partial<Record<FormDataKeys, string>>>(
      (acc, field) => {
        const error = validateField(field, formData[field], { mode, password: formData.password });
        return error ? { ...acc, [field]: error } : acc;
      },
      {},
    );

    setTouched((prev) => ({ ...prev, ...nextTouched }));
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setGlobalError(null);

    try {
      let data;
      if (mode === 'login') {
        data = await authService.login({
          identifier: formData.identifier,
          password: formData.password,
        });
      } else {
        data = await authService.register({
          nickname: formData.nickname,
          email: formData.email,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
        });
      }
      setAuth(data.actor, data.token);
      onSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const msg = errorMessage.toLowerCase();
      if (mode === 'login') {
        if (msg.includes('not found')) {
          setGlobalError('Пользователь не найден');
        } else if (msg.includes('invalid')) {
          setGlobalError('Неверный логин или пароль');
        } else {
          setGlobalError('Ошибка входа. Проверьте данные.');
        }
      }

      if (mode === 'register') {
        if (msg.includes('conflict') || msg.includes('409') || msg.includes('exists')) {
          if (msg.includes('email')) {
            setGlobalError('Этот Email уже занят');
          } else if (msg.includes('nickname')) {
            setGlobalError('Этот никнейм уже занят');
          } else {
            setGlobalError('Такой пользователь уже существует');
          }
        } else {
          setGlobalError('Не удалось создать аккаунт. Попробуйте другой ник или почту.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authModal}>
      <div className={styles.authModal__tabs}>
        <button
          type="button"
          className={clsx(styles.authModal__tab, mode === 'login' && styles.authModal__tab_active)}
          onClick={() => {
            if (mode !== 'login') { setMode('login'); resetForm(); }
            setIsConfirmingClose(false);
          }}
        >
          Вход
        </button>
        <button
          type="button"
          className={clsx(styles.authModal__tab, mode === 'register' && styles.authModal__tab_active)}
          onClick={() => {
            if (mode !== 'register') { setMode('register'); resetForm(); }
            setIsConfirmingClose(false);
          }}
        >
          Регистрация
        </button>
      </div>

      {mode === 'login' ? (
        <h2 className={styles.authModal__title}>Войдите в аккаунт</h2>
      ) : (
        <h2 className={styles.authModal__title}>Создайте свой аккаунт</h2>
      )}

      <form className={styles.authModal__form} onSubmit={handleSubmit} noValidate>
        {mode === 'login' ? (
          <FormField
            name="identifier"
            label="Никнейм или Email"
            value={formData.identifier}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.identifier ? fieldErrors.identifier : undefined}
            showHint={false}
          />
        ) : (
          <>
            <FormField
              name="nickname"
              label="Ваш никнейм"
              value={formData.nickname}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.nickname ? fieldErrors.nickname : undefined}
            />
            <FormField
              name="email"
              label="Электронная почта"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email ? fieldErrors.email : undefined}
            />
          </>
        )}

        <FormField
          name="password"
          label="Пароль"
          type="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.password ? fieldErrors.password : undefined}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          showHint={mode !== 'login'}
        />

        {mode === 'register' && (
          <FormField
            name="passwordConfirm"
            label="Повторите пароль"
            type="password"
            value={formData.passwordConfirm}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.passwordConfirm ? fieldErrors.passwordConfirm : undefined}
            autoComplete="new-password"
          />
        )}

        <AnimatePresence>
          {globalError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={clsx(
                styles.authModal__globalMessage,
                isConfirmingClose
                  ? styles.authModal__globalMessage_info
                  : styles.authModal__globalMessage_error,
              )}
            >
              {globalError}
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.authModal__actions}>
          <button
            type="submit"
            className={styles.authModal__btnPrimary}
            disabled={loading || Object.keys(fieldErrors).length > 0}
          >
            {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </div>
      </form>
    </div>
  );
};
