import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BotDifficulty } from '@/types/room';
import styles from './botDifficultyPopover.module.scss';

interface BotDifficultyPopoverProps {
  onSelect: (difficulty: BotDifficulty) => void;
  /** Optional custom trigger element. Receives ref and onClick handler. */
  renderTrigger?: (props: {
    ref: React.RefObject<HTMLButtonElement | null>;
    onClick: () => void;
  }) => React.ReactNode;
}

interface PopoverPosition {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  dropUp: boolean;
}

const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 6;

const DIFFICULTY_OPTIONS: { value: BotDifficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Лёгкий', color: '#27AE60' },
  { value: 'medium', label: 'Средний', color: '#E2A308' },
  { value: 'hard', label: 'Сложный', color: '#e74c3c' },
];

export const BotDifficultyPopover = ({ onSelect, renderTrigger }: BotDifficultyPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const estimatedHeight = DIFFICULTY_OPTIONS.length * 48 + 8;
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    const dropUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    setPosition({
      left: rect.left,
      width: Math.max(rect.width, 180),
      dropUp,
      ...(dropUp
        ? { bottom: window.innerHeight - rect.top + TRIGGER_GAP }
        : { top: rect.bottom + TRIGGER_GAP }),
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        popoverRef.current && !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    if (!isOpen) computePosition();
    setIsOpen((prev) => !prev);
  };

  const handlePick = (difficulty: BotDifficulty) => {
    onSelect(difficulty);
    setIsOpen(false);
  };

  return (
    <>
      {renderTrigger ? (
        renderTrigger({ ref: triggerRef, onClick: handleToggle })
      ) : (
        <button
          ref={triggerRef}
          className={styles.addBotButton}
          onClick={handleToggle}
          type="button"
        >
          <Bot size={18} />
          <span>Добавить бота</span>
        </button>
      )}

      {createPortal(
        <AnimatePresence>
          {isOpen && position && (
            <motion.div
              ref={popoverRef}
              className={styles.popover}
              style={{
                left: position.left,
                width: position.width,
                top: position.top,
                bottom: position.bottom,
              }}
              initial={{ opacity: 0, y: position.dropUp ? 8 : -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: position.dropUp ? 8 : -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={styles.option}
                  onClick={() => handlePick(opt.value)}
                  type="button"
                >
                  <span
                    className={styles.option__dot}
                    style={{ backgroundColor: opt.color }}
                  />
                  <span>{opt.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
};
