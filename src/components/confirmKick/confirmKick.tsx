import styles from './confirmKick.module.scss';
import type React from 'react';
import clsx from 'clsx';

interface Props {
  title: string;
  text: React.ReactNode | string;
  image?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onConfirmText: string;
  onCancelText?: string;
}

export const ConfirmModal = ({ title, text, onConfirm, onCancel, onConfirmText, onCancelText, image }: Props) => {
  const isCancelling = onCancelText && onCancel;

  return (
    <div className={styles.confirmKick}>
      <h2 className={styles.confirmKick__title}>{title}</h2>

      <img src={image} alt="Эльф изгнанник" className={styles.confirmKick__exiledElfImg} />

      <p className={styles.confirmKick__text}>{text}</p>

      <div className={clsx(
          styles.confirmKick__actions,
          !isCancelling && styles.confirmKick__oneButton
        )}
      >
        {isCancelling && (
          <button
            className={styles.confirmKick__btnCancel}
            onClick={onCancel}
          >
            {onCancelText}
          </button>
        )}
        <button
          className={styles.confirmKick__btnConfirm}
          onClick={onConfirm}
        >
          {onConfirmText}
        </button>
      </div>
    </div>
  );
};