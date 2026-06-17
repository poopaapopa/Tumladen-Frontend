import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {ChevronDown, type LucideIcon} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './editableSelector.module.scss';
import clsx from 'clsx';

interface Option {
  value: number | string;
  label: string;
  disabled?: boolean;
}

interface Props {
  value: number | string | boolean;
  icon: LucideIcon;
  options: Option[];
  onSelect: (val: string | number) => void;
  isOwner: boolean;
  suffix?: string;
}

interface DropdownPosition {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  dropUp: boolean;
}

const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 6;

export const EditableSelector = ({ value, icon: Icon, options, onSelect, isOwner, suffix }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const stringValue = value === 0 ? '∞' : value.toString();
  const stringSuffix = suffix && value !== 0 ? ` ${suffix}` : '';

  // Считаем позицию выпадающего списка относительно вьюпорта (fixed),
  // чтобы он не обрезался скролл-контейнерами сайдбара и краями экрана.
  const computePosition = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const estimatedHeight = Math.min(options.length * 48 + 8, 280);
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    const dropUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    setPosition({
      left: rect.left,
      width: rect.width,
      dropUp,
      ...(dropUp
        ? { bottom: window.innerHeight - rect.top + TRIGGER_GAP }
        : { top: rect.bottom + TRIGGER_GAP }),
    });
  }, [options.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Пересчитываем позицию и закрываем при скролле/ресайзе, пока список открыт.
  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => computePosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen, computePosition]);

  const handleToggle = () => {
    if (!isOwner) return;

    if (!isOpen) computePosition();
    setIsOpen((prev) => !prev);
  };

  const handlePick = (opt: Option) => {
    if (opt.disabled)
      return;

    onSelect(opt.value);
    setIsOpen(false);
  };

  const maxHeight = position
    ? position.dropUp
      ? `calc(100vh - ${(position.bottom ?? 0) + VIEWPORT_MARGIN}px)`
      : `calc(100vh - ${(position.top ?? 0) + VIEWPORT_MARGIN}px)`
    : undefined;

  return (
    <div className={styles.container} ref={containerRef}>
      <div
        className={clsx(styles.configBox, isOwner && styles.configBox_editable)}
        onClick={handleToggle}
      >
        <Icon size={20} />
        <span>{stringValue + stringSuffix}</span>
        {isOwner && (
          <ChevronDown
            size={26}
            className={clsx(styles.arrow, isOpen && styles.arrow_rotated)}
          />
        )}
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && position && (
            <motion.div
              ref={dropdownRef}
              className={styles.dropdown}
              style={{
                left: position.left,
                width: position.width,
                top: position.top,
                bottom: position.bottom,
                maxHeight,
              }}
              initial={{ opacity: 0, y: position.dropUp ? 8 : -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: position.dropUp ? 8 : -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {options.map((opt) => (
                <div
                  key={opt.value}
                  className={clsx(
                    styles.option,
                    opt.value === value && styles.option_active,
                    opt.disabled && styles.option_disabled
                  )}
                  onClick={() => handlePick(opt)}
                >
                  <Icon size={20} />
                  {opt.label}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};
