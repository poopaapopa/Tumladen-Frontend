import { useCallback, useEffect, useId, useState } from 'react';
import styles from './rangeSlider.module.scss';
import clsx from 'clsx';

export interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  label?: string;
  formatValue?: (val: number) => string;
  className?: string;
}

const sort = (a: number, b: number): [number, number] => (a <= b ? [a, b] : [b, a]);

/**
 * Dual-thumb range slider built on top of two overlapping `<input type="range">` elements.
 *
 * Implementation note. The two native inputs internally keep their own values (`a`, `b`)
 * which are *not* sorted. When the user drags one thumb past the other, the inputs simply
 * cross — no value gets clamped — and the component emits a sorted `[low, high]` tuple to
 * the parent. This avoids the "stuck at collision" problem of clamp-based sliders: from any
 * point, including when both thumbs coincide, the user can drag in either direction.
 */
function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  formatValue,
  className,
}: RangeSliderProps) {
  const id = useId();

  // Внутреннее, *не* отсортированное представление значений каждого инпута.
  const [internal, setInternal] = useState<[number, number]>(value);

  // Подхватываем внешние изменения только если сортированные пропы расходятся с текущим
  // внутренним порядком — иначе сбрасывали бы перекрёстное состояние во время драга.
  useEffect(() => {
    const [a, b] = internal;
    const [curLo, curHi] = sort(a, b);
    const [propLo, propHi] = value;
    if (curLo !== propLo || curHi !== propHi) {
      setInternal(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const [a, b] = internal;
  const [lo, hi] = sort(a, b);

  const range = max - min;
  const loPercent = range === 0 ? 0 : ((lo - min) / range) * 100;
  const hiPercent = range === 0 ? 100 : ((hi - min) / range) * 100;

  const emit = useCallback(
    (next: [number, number]) => {
      setInternal(next);
      const sorted = sort(next[0], next[1]);
      onChange(sorted);
    },
    [onChange],
  );

  const handleAChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      emit([Number(e.target.value), b]);
    },
    [b, emit],
  );

  const handleBChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      emit([a, Number(e.target.value)]);
    },
    [a, emit],
  );

  const displayLo = formatValue ? formatValue(lo) : String(lo);
  const displayHi = formatValue ? formatValue(hi) : String(hi);

  return (
    <div className={clsx(styles.rangeSlider, className)}>
      {label && (
        <div className={styles.rangeSlider__header}>
          <span className={styles.rangeSlider__label} id={`${id}-label`}>
            {label}
          </span>
          <span className={styles.rangeSlider__value}>
            {lo === hi ? displayLo : `${displayLo} – ${displayHi}`}
          </span>
        </div>
      )}

      <div className={styles.rangeSlider__track}>
        <div className={styles.rangeSlider__trackBg} />
        <div
          className={styles.rangeSlider__trackFill}
          style={{ left: `${loPercent}%`, right: `${100 - hiPercent}%` }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={a}
          onChange={handleAChange}
          aria-label={label ? `${label}: ползунок A` : 'Ползунок A'}
          aria-labelledby={label ? `${id}-label` : undefined}
          className={clsx(styles.rangeSlider__input, styles.rangeSlider__input_a)}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={b}
          onChange={handleBChange}
          aria-label={label ? `${label}: ползунок B` : 'Ползунок B'}
          aria-labelledby={label ? `${id}-label` : undefined}
          className={clsx(styles.rangeSlider__input, styles.rangeSlider__input_b)}
        />
      </div>
    </div>
  );
}

export default RangeSlider;
