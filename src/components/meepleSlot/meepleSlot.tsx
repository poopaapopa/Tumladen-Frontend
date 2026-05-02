import React, { useEffect, useRef } from 'react';
import { Group, Circle } from 'react-konva';
import Konva from 'konva';

interface MeepleSlotProps {
  x: number;
  y: number;
  color?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const MeepleSlot: React.FC<MeepleSlotProps> = ({
  x,
  y,
  color = 'white',
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const pulseRef = useRef<Konva.Circle>(null);
  const ringRef = useRef<Konva.Circle>(null);
  const dashRef = useRef<Konva.Circle>(null);

  useEffect(() => {
    const layer = pulseRef.current?.getLayer();
    if (!layer) return;

    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const t = frame.time / 1000;
      // 0..1, период ~2.4с (медленнее)
      const pulse = (Math.sin((t * 2 * Math.PI) / 2) + 1) / 2;

      if (pulseRef.current) {
        const scale = 0.85 + pulse * 0.4;
        pulseRef.current.scale({ x: scale, y: scale });
        pulseRef.current.opacity(0.5 - pulse * 0.2);
      }
      if (ringRef.current) {
        const scale = 1 + pulse * 0.25;
        ringRef.current.scale({ x: scale, y: scale });
        ringRef.current.opacity(0.9 - pulse * 0.5);
      }
      if (dashRef.current) {
        dashRef.current.rotation((t * 40) % 360);
      }
    }, layer);

    anim.start();
    return () => {
      anim.stop();
    };
  }, []);

  return (
    <Group
      x={x}
      y={y}
      onClick={onClick}
      onTap={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Внешнее свечение (пульс) */}
      <Circle
        ref={pulseRef}
        radius={9}
        fill={color}
        opacity={0.4}
        shadowColor={color}
        shadowBlur={8}
        shadowOpacity={0.8}
      />
      {/* Сплошное кольцо */}
      <Circle
        ref={ringRef}
        radius={6.5}
        stroke={color}
        strokeWidth={1.5}
        opacity={0.9}
      />
      {/* Вращающаяся пунктирная обводка */}
      <Circle
        ref={dashRef}
        radius={8.5}
        stroke={color}
        strokeWidth={1}
        dash={[3, 3]}
        opacity={0.8}
      />
      {/* Прозрачная зона клика */}
      <Circle radius={12} fill="rgba(0,0,0,0.001)" />
    </Group>
  );
};
