import styles from './logoutModal.module.scss';
import { useUserStore } from '@/store/useUserStore';

interface LogoutModalProps {
  onClose: () => void;
}

export const LogoutModal = ({ onClose }: LogoutModalProps) => {
  const logout = useUserStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className={styles.logoutModal}>
      <h2 className={styles.logoutModal__title}>Хотите выйти из аккаунта?</h2>

      <p className={styles.logoutModal__text}>
        Ваши достижения и текущие сессии будут сохранены, 
        но для возвращения в игру потребуется снова войти в аккаунт.
      </p>

      <div className={styles.logoutModal__actions}>
        <button 
          className={styles.logoutModal__btnCancel} 
          onClick={onClose}
        >
          Остаться
        </button>
        <button 
          className={styles.logoutModal__btnConfirm} 
          onClick={handleLogout}
        >
          Выйти
        </button>
      </div>
    </div>
  );
};