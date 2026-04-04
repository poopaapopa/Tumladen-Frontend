import styles from "./guestAuth.module.scss"
import { useState } from "react";
import { useUserStore } from '../../store/useUserStore.ts';
import { authService } from "../../api/auth.ts";

interface GuestAuthProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function GuestAuth({ onConfirm, onCancel }: GuestAuthProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useUserStore((state) => state.setAuth);

  const handleLogin = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) return;

    setIsLoading(true);

    try {
      const data = await authService.createGuestSession(trimmedName);
      console.log(data);

      setAuth(data.actor, data.token);
      onConfirm();

    } catch (err) {
      console.error(err);
      alert("Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.guestLogin}>
      <h2 className={styles.guestLogin__title}>Как вас называть в этой партии?</h2>

      <div className={styles.guestLogin__inputGroup}>
        <input
          id="guestName"
          type="text"
          value={name}
          placeholder=" "
          className={styles.guestLogin__input}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isLoading && name.trim().length >= 2) {
              handleLogin();
            }
          }}
        />

        <label htmlFor="guestName" className={styles.guestLogin__label}>
          Ваше имя или титул
        </label>
      </div>

      <div className={styles.guestLogin__authInfo}>
        <p>Хотите сохранять свои победы для истории?</p>
        <button className={styles.guestLogin__authBtn}>Авторизоваться</button>
      </div>

      <div className={styles.guestLogin__actions}>
        <button className={styles.guestLogin__btnSecondary} onClick={onCancel}>Позже</button>
        <button
          className={styles.guestLogin__btnPrimary}
          onClick={handleLogin}
          disabled={isLoading || name.length < 2}
        >
          {isLoading ? 'Загрузка...' : 'Готов!'}
        </button>
      </div>
    </div>
  );
}

export default GuestAuth