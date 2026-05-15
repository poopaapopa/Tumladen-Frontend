import { useState, useEffect, useCallback  } from 'react';
import styles from './authModal.module.scss';
import { authService } from '@/api/auth';
import { useUserStore } from '@/store/useUserStore';
import modalStyles from '../guestAuth/guestAuth.module.scss'
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface AuthModalProps {
  onSuccess: () => void;
  closeAttemptTrigger: number; 
  onConfirmClose: () => void;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASS_REGEX = /^(?=.*[A-Z]).{8,}$/;

type FormDataKeys = 'identifier' | 'nickname' | 'email' | 'password' | 'passwordConfirm';

export const AuthModal = ({ onSuccess, closeAttemptTrigger, onConfirmClose }: AuthModalProps) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormDataKeys, string>>>({});

  const [isConfirmingClose, setIsConfirmingClose] = useState(false);

  const setAuth = useUserStore((state) => state.setAuth);

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [formData, setFormData] = useState({
    identifier: '',
    nickname: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });

  const resetForm = () => {
    setFormData({
      identifier: '',
      nickname: '',
      email: '',
      password: '',
      passwordConfirm: ''
    });
    setFieldErrors({});
    setGlobalError(null);
    setShowPass(false);
    setShowConfirmPass(false);
  };

  const isFormDirty = useCallback(() => {
    return Object.values(formData).some(value => value.trim() !== '');
  }, [formData]);

  const validateField = (name: FormDataKeys, value: string) => {
    let error = '';
    if (mode === 'register') {
      if (name === 'email' && !EMAIL_REGEX.test(value)) {
        error = 'Неверный формат почты';
      }
      if (name === 'password' && !PASS_REGEX.test(value)) {
        error = 'Мин. 8 символов и 1 заглавная буква';
      }
      if (name === 'passwordConfirm' && value !== formData.password) {
        error = 'Пароли не совпадают';
      }
      if (name === 'nickname' && value.length < 2) {
        error = 'Никнейм слишком короткий';
      }
    }
    if (mode === 'login') {
      if (name === 'password' && !PASS_REGEX.test(value)) {
        error = 'Мин. 8 символов и 1 заглавная буква';
      }
      if (name === 'identifier' && value.length < 2) {
        error = 'Никнейм слишком короткий';
      }
    }
    
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[name] = error;
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as FormDataKeys;
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (isConfirmingClose) {
      setIsConfirmingClose(false);
      setGlobalError(null);
    }
    setGlobalError(null);
    validateField(name, value);
  };
  
  useEffect(() => {
    if (closeAttemptTrigger === 0) {
      return;
    }

    if (!isFormDirty()) {
      onConfirmClose();
      return;
    }

    if (isConfirmingClose){
      onConfirmClose();
    } else {
      setIsConfirmingClose(true);
      setGlobalError('Вы точно хотите закрыть форму? Все введённые вами данные будут потеряны.')
    }
  }, [closeAttemptTrigger, onConfirmClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'register') {
      if (!EMAIL_REGEX.test(formData.email) || !PASS_REGEX.test(formData.password) || formData.password !== formData.passwordConfirm) {
        setGlobalError('Пожалуйста, исправьте ошибки в полях');
        return;
      }
    }

    setLoading(true);
    setGlobalError(null);

    try {
      let data;
      if (mode === 'login') {
        data = await authService.login({
          identifier: formData.identifier,
          password: formData.password
        });
      } else {
        data = await authService.register({
          nickname: formData.nickname,
          email: formData.email,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm
        });
      }
      setAuth(data.actor, data.token);
      onSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const msg = errorMessage.toLowerCase();
      if (mode ==='login') {
        if (msg.includes('not found')) {
          setFieldErrors(p => ({...p, identifier: 'Пользователь не найден'}));
        } else if (msg.includes('invalid')) {
          setFieldErrors(p => ({...p, password: 'Неверный пароль'}));
        } else {
          setGlobalError('Ошибка входа. Проверьте данные.');
        }
      }

      if (mode ==='register') {
        if (msg.includes('conflict') || msg.includes('409') || msg.includes('exists')) {
          if (msg.toLowerCase().includes('email')) {
            setFieldErrors(p => ({ ...p, email: 'Этот Email уже занят' }));
          } else if (msg.toLowerCase().includes('nickname')) {
            setFieldErrors(p => ({ ...p, nickname: 'Этот никнейм уже занят' }));
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

  const renderInputGroup = (name: FormDataKeys, label: string, type = 'text', isPass = false) => {
    const hasError = !!fieldErrors[name];
    const isShowing = name === 'password' ? showPass : showConfirmPass;
    const toggleFunc = name === 'password' ? setShowPass : setShowConfirmPass;

    return (
      <div className={styles.authModal__inputWrapper}>
        <AnimatePresence>
          {hasError && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className={styles.authModal__fieldError}
            >
              <AlertCircle size={14} />
              {fieldErrors[name]}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className={clsx(styles.authModal__inputGroup, hasError && styles.authModal__inputGroup_error)}>
          <input 
            id={name}
            className={styles.authModal__input} 
            name={name} 
            type={isPass ? (isShowing ? 'text' : 'password') : type}
            value={formData[name]}
            onChange={handleChange}
            placeholder=" "
            autoComplete={isPass ? "current-password" : "off"}
            required 
          />
          <label htmlFor={name} className={styles.authModal__label}>{label}</label>
          
          {isPass && (
            <button 
              type="button" 
              className={styles.authModal__eyeBtn}
              onClick={() => toggleFunc(!isShowing)}
            >
              {isShowing ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.authModal}>
      <div className={styles.authModal__tabs}>
        <button 
          type="button"
          className={clsx(styles.authModal__tab, mode === 'login' && styles.authModal__tab_active)}
          onClick={() => {if (mode !== 'login') { 
            setMode('login'); 
            resetForm(); 
          } setIsConfirmingClose(false) }}
        >
          Вход
        </button>
        <button 
          type="button"
          className={clsx(styles.authModal__tab, mode === 'register' && styles.authModal__tab_active)}
          onClick={() => {if (mode !== 'register') {
            setMode('register'); 
            resetForm(); 
          } setIsConfirmingClose(false) }}
        >
          Регистрация
        </button>
      </div>
      {mode === 'login' ? (
        <h2 className={ modalStyles.guestLogin__title}>Войдите в свои владения!</h2>

      ) : (
        <h2 className={ modalStyles.guestLogin__title}>Создайте свой аккаунт!</h2>
      )}

      <form className={styles.authModal__form} onSubmit={handleSubmit} noValidate>
        {mode === 'login' ? (
          renderInputGroup('identifier', 'Никнейм или Email')
        ) : (
          <>
            {renderInputGroup('nickname', 'Ваш никнейм')}
            {renderInputGroup('email', 'Электронная почта', 'email')}
          </>
        )}

        {renderInputGroup('password', 'Пароль', 'password', true)}

        {mode === 'register' && (
          renderInputGroup('passwordConfirm', 'Повторите пароль', 'password', true)
        )}

        {globalError && <div className={styles.authModal__error}>{globalError}</div>}

        <div className={styles.authModal__actions}>
          <button 
            type="submit" 
            className={styles.authModal__btnPrimary} 
            disabled={loading || Object.keys(fieldErrors).length > 0}
          >
            {loading ? 'Загрузка...' : mode === 'login' ? 'Войти в чертоги' : 'Создать аккаунт'}
          </button>
        </div>
      </form>
    </div>
  );
};