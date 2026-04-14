import { useState, useRef, useEffect } from 'react';
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

export const EditableSelector = ({ value, icon: Icon, options, onSelect, isOwner, suffix }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePick = (opt: Option) => {
    if (opt.disabled)
      return;

    onSelect(opt.value);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div
        className={clsx(styles.configBox, isOwner && styles.configBox_editable)}
        onClick={() => isOwner && setIsOpen(!isOpen)}
      >
        <Icon size={20} />
        <span>{value}{suffix && ` ${suffix}`}</span>
        {isOwner && (
          <ChevronDown
            size={26}
            className={clsx(styles.arrow, isOpen && styles.arrow_rotated)}
          />
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.dropdown}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
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
      </AnimatePresence>
    </div>
  );
};