import { Infinity as InfinityIcon } from 'lucide-react';
import styles from './infinityValue.module.scss';

interface InfinityValueProps {
  size?: number;
}

export const InfinityValue = ({ size = 20 }: InfinityValueProps) => (
  <span
    className={styles.infinityValue}
    role="img"
    aria-label="Без ограничений"
  >
    <InfinityIcon aria-hidden="true" size={size} strokeWidth={2.25} />
  </span>
);
