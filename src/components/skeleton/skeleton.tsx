import styles from './Skeleton.module.scss';
import clsx from 'clsx';
import type { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: 'rect' | 'circle';
}

export const Skeleton = ({
  width,
  height,
  variant = 'rect',
  className,
  style,
  ...props
}: SkeletonProps) => {
  return (
    <div
      className={clsx(styles.skeleton, styles[variant], className)}
      style={{
        width,
        height,
        ...style
      }}
      {...props}
    />
  );
};