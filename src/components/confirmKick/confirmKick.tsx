import styles from './ConfirmKick.module.scss';
import elfExileImg from "../../assets/elf-exile.png";

interface Props {
  targetName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmKick = ({ targetName, onConfirm, onCancel }: Props) => {
  return (
    <div className={styles.confirmKick}>
      <h2 className={styles.confirmKick__title}>Изгнание из комнаты</h2>

      <img src={elfExileImg} alt="Эльф изгнанник" className={styles.confirmKick__exiledElfImg} />

      <p className={styles.confirmKick__text}>
        Вы действительно желаете выгнать игрока <strong>{targetName}</strong>?<br />
        Он сможет вернуться в комнату в любой момент, но ваше действие явно отразится на его желании играть с вами
      </p>

      <div className={styles.confirmKick__actions}>
        <button
          className={styles.confirmKick__btnCancel}
          onClick={onCancel}
        >
          Оставить
        </button>
        <button
          className={styles.confirmKick__btnConfirm}
          onClick={onConfirm}
        >
          Изгнать
        </button>
      </div>
    </div>
  );
};