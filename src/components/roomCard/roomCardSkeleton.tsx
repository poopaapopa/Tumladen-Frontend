import { Skeleton } from '../skeleton/skeleton';
import styles from './roomCard.module.scss';

function RoomCardSkeleton() {
  return (
    <div className={styles.roomCard} style={{ cursor: 'default', opacity: 0.7 }}>
      <Skeleton variant="circle" width="60px" height="60px" className={styles.roomCard__image} />

      <div className={styles.roomCard__body} style={{ flex: 1 }}>
        <Skeleton width="80%" height="18px" style={{ marginBottom: '8px' }} />
        <Skeleton width="50%" height="14px" style={{ marginBottom: '12px' }} />

        <div className={styles.roomCard__footer}>
          <Skeleton width="40%" height="14px" />
          <Skeleton width="25%" height="14px" />
        </div>
      </div>
    </div>
  );
}

export default RoomCardSkeleton;