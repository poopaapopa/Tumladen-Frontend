import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './marqueeText.module.scss';

interface MarqueeTextProps {
  text: string;
  className?: string;
  speed?: number; // скорость прокрутки (пикселей в секунду)
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({ text, className, speed = 60 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);
  const [duration, setDuration] = useState(6);

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const check = () => {
      const textWidth = textEl.scrollWidth;
      const containerWidth = container.clientWidth;
      console.log(textWidth, containerWidth)
      const overflows = textWidth > containerWidth;
      
      setNeedsMarquee(overflows);
      if (overflows) {
        setDuration(textWidth / speed);
      }
    };

    // Первичная проверка
    check();

    // Наблюдаем и за контейнером, и за самим текстом.
    // Это гарантирует, что переход ширины текста из 0 в реальное значение будет зафиксирован.
    const ro = new ResizeObserver(check);
    ro.observe(container);
    ro.observe(textEl);

    return () => ro.disconnect();
  }, [text, speed]);

  return (
    <div ref={containerRef} className={styles.marqueeContainer}>
      <span
        ref={textRef}
        className={clsx(className, needsMarquee && styles.marqueeTrack)}
        data-text={needsMarquee ? text : undefined}
        style={
          needsMarquee
            ? ({ '--marquee-duration': `${duration}s` } as React.CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </div>
  );
};