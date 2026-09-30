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

  // Отступ между оригиналом и копией текста.
  const GAP_PX = 38;

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const check = () => {
      const textWidth = textEl.scrollWidth;
      const containerWidth = container.clientWidth;
      const overflows = textWidth > containerWidth;

      setNeedsMarquee(overflows);
      if (overflows) {
        const travelDistance = textWidth + GAP_PX;
        setDuration(travelDistance / speed);
      }
    };

    // Первичная проверка
    check();

    // Наблюдаем и за контейнером, и за самим текстом.
    const ro = new ResizeObserver(check);
    ro.observe(container);
    ro.observe(textEl);

    return () => ro.disconnect();
  }, [text, speed]);

  if (needsMarquee) {
    const textWidth = textRef.current?.scrollWidth ?? 0;
    const singleWidth = textWidth + GAP_PX;
    return (
      <div ref={containerRef} className={styles.marqueeContainer}>
        <span
          className={clsx(className, styles.marqueeTrack)}
          style={
            {
              '--marquee-duration': `${duration}s`,
              '--marquee-gap': `${GAP_PX}px`,
              '--marquee-single-width': `${singleWidth}px`,
            } as React.CSSProperties
          }
        >
          <span ref={textRef}>{text}</span>
          <span>{text}</span>
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.marqueeContainer}>
      <span ref={textRef} className={className}>
        {text}
      </span>
    </div>
  );
};