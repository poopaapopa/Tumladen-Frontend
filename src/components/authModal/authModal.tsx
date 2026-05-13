import { useState } from 'react';
import styles from './authModal.module.scss';
import { authService } from '@/api/auth';
import { useUserStore } from '@/store/useUserStore';
import modalStyles from '../guestAuth/guestAuth.module.scss'
import { Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

interface AuthModalProps {
  onSuccess: () => void;
}

export const AuthModal = ({ onSuccess }: AuthModalProps) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
    } catch (err: any) {
      setError(err.message);
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
          onClick={() => setMode('login')}
        >
          Вход
        </button>
        <button 
          type="button"
          className={clsx(styles.authModal__tab, mode === 'register' && styles.authModal__tab_active)}
          onClick={() => setMode('register')}
        >
          Регистрация
        </button>
      </div>
      {mode === 'login' ? (
        <h2 className={ modalStyles.guestLogin__title}>Войдите в свои владения!</h2>

      ) : (
        <h2 className={ modalStyles.guestLogin__title}>Создайте свой аккаунт!</h2>
      )}

      <form className={styles.authModal__form} onSubmit={handleSubmit}>
        {mode === 'login' ? (
          <div className={styles.authModal__inputGroup}>
            <input 
              id="identifier"
              className={styles.authModal__input} 
              name="identifier" 
              value={formData.identifier}
              onChange={handleChange}
              placeholder=" "
              required 
            />
            <label htmlFor="identifier" className={styles.authModal__label}>Никнейм или Email</label>
          </div>
        ) : (
          <>
            <div className={styles.authModal__inputGroup}>
              <input 
                id="nickname"
                className={styles.authModal__input} 
                name="nickname" 
                value={formData.nickname}
                onChange={handleChange}
                placeholder=" "
                required 
              />
              <label htmlFor="nickname" className={styles.authModal__label}>Ваш никнейм</label>
            </div>
            <div className={styles.authModal__inputGroup}>
              <input 
                id="email"
                className={styles.authModal__input} 
                type="email" 
                name="email" 
                value={formData.email}
                onChange={handleChange}
                placeholder=" "
                required 
              />
              <label htmlFor="email" className={styles.authModal__label}>Электронная почта</label>
            </div>
          </>
        )}

        <div className={styles.authModal__inputGroup}>
          <input 
            id="password"
            className={styles.authModal__input} 
            type={showPass ? 'text' : 'password'} 
            name="password" 
            value={formData.password}
            onChange={handleChange}
            placeholder=" "
            required 
          />
          <label htmlFor="password" className={styles.authModal__label}>Пароль</label>
          <button 
            type="button" 
            className={styles.authModal__eyeBtn}
            onClick={() => setShowPass(!showPass)}
          >
            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {mode === 'register' && (
          <div className={styles.authModal__inputGroup}>
            <input 
              id="passwordConfirm"
              className={styles.authModal__input} 
              type={showConfirmPass ? 'text' : 'password'} 
              name="passwordConfirm" 
              value={formData.passwordConfirm}
              onChange={handleChange}
              placeholder=" "
              required 
            />
            <label htmlFor="passwordConfirm" className={styles.authModal__label}>Повторите пароль</label>
             <button 
                type="button" 
                className={styles.authModal__eyeBtn}
                onClick={() => setShowConfirmPass(!showConfirmPass)}
              >
            {showConfirmPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          </div>
        )}

        {error && <div className={styles.authModal__error}>{error}</div>}

        <div className={styles.authModal__actions}>
          <button 
            type="submit" 
            className={styles.authModal__btnPrimary} 
            disabled={loading}
          >
            {loading ? 'Загрузка...' : mode === 'login' ? 'Войти в чертоги' : 'Создать аккаунт'}
          </button>
        </div>
      </form>
    </div>
  );
};