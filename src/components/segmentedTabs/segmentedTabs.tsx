import type { ComponentType } from 'react';
import clsx from 'clsx';
import styles from './segmentedTabs.module.scss';

export interface SegmentedTab<T extends string> {
  key: T;
  label: string;
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
}

interface SegmentedTabsProps<T extends string> {
  tabs: ReadonlyArray<SegmentedTab<T>>;
  activeKey: T;
  onChange: (key: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function SegmentedTabs<T extends string>({
  tabs,
  activeKey,
  onChange,
  ariaLabel,
  className,
}: SegmentedTabsProps<T>) {
  return (
    <div
      className={clsx(styles.segmentedTabs, className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={clsx(
              styles.segmentedTabs__tab,
              isActive && styles.segmentedTabs__tab_active,
            )}
            onClick={() => onChange(tab.key)}
          >
            {Icon && <Icon size={16} strokeWidth={2.5} />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
