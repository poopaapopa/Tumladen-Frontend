import styles from "./guestAuth.module.scss"
import { useState } from "react";

interface GuestAuthProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

function GuestAuth({ onConfirm, onCancel }: GuestAuthProps) {
  const [name, setName] = useState('');

  return (
    <div className={styles.guestLogin}>
      <h2 className={styles.guestLogin__title}>Как вас называть в этой партии?</h2>

      <div className={styles.guestLogin__inputGroup}>
        <input
          type="text"
          value={name}
          placeholder="Ваше имя или титул..."
          className={styles.guestLogin__input}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className={styles.guestLogin__authInfo}>
        <p>Хотите сохранять свои победы для истории?</p>
        <button className={styles.guestLogin__authBtn}>Авторизоваться</button>
      </div>

      <div className={styles.guestLogin__actions}>
        <button className={styles.guestLogin__btnSecondary} onClick={onCancel}>Позже</button>
        <button className={styles.guestLogin__btnPrimary} onClick={() => onConfirm(name)}>Готов!</button>
      </div>
    </div>
  );
}

export default GuestAuth