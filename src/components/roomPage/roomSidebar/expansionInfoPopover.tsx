import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Info } from 'lucide-react';
import styles from './expansionInfoPopover.module.scss';

interface ExpansionInfoPopoverProps {
  title: string;
  summary: string;
}

interface PopoverPosition {
  left: number;
  width: number;
  arrowLeft: number;
  dropUp: boolean;
  top: number;
  maxHeight: number;
  isScrollable: boolean;
}

const POPOVER_WIDTH = 260;
const ESTIMATED_HEIGHT = 148;
const VIEWPORT_MARGIN = 12;
const TRIGGER_GAP = 10;
const ARROW_EDGE_MARGIN = 20;

export const ExpansionInfoPopover = ({
  title,
  summary,
}: ExpansionInfoPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  const shouldReduceMotion = useReducedMotion();

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const visualViewport = window.visualViewport;
    const viewportLeft = visualViewport?.offsetLeft ?? 0;
    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportWidth = visualViewport?.width ?? document.documentElement.clientWidth;
    const viewportHeight = visualViewport?.height ?? window.innerHeight;
    const viewportRight = viewportLeft + viewportWidth;
    const viewportBottom = viewportTop + viewportHeight;
    const width = Math.min(POPOVER_WIDTH, viewportWidth - VIEWPORT_MARGIN * 2);
    const centeredLeft = triggerRect.left + triggerRect.width / 2 - width / 2;
    const left = Math.min(
      Math.max(centeredLeft, viewportLeft + VIEWPORT_MARGIN),
      viewportRight - width - VIEWPORT_MARGIN,
    );
    const surfaceRect = surfaceRef.current?.getBoundingClientRect();
    const naturalHeight = surfaceRef.current
      ? Math.max(surfaceRef.current.scrollHeight + 2, surfaceRect?.height ?? 0)
      : ESTIMATED_HEIGHT;
    const spaceBelow = Math.max(
      0,
      viewportBottom - triggerRect.bottom - TRIGGER_GAP - VIEWPORT_MARGIN,
    );
    const spaceAbove = Math.max(
      0,
      triggerRect.top - viewportTop - TRIGGER_GAP - VIEWPORT_MARGIN,
    );
    const dropUp = spaceBelow < naturalHeight && spaceAbove > spaceBelow;
    const maxHeight = Math.max(1, dropUp ? spaceAbove : spaceBelow);
    const renderedHeight = Math.min(naturalHeight, maxHeight);
    const desiredTop = dropUp
      ? triggerRect.top - TRIGGER_GAP - renderedHeight
      : triggerRect.bottom + TRIGGER_GAP;
    const minTop = viewportTop + VIEWPORT_MARGIN;
    const maxTop = Math.max(
      minTop,
      viewportBottom - renderedHeight - VIEWPORT_MARGIN,
    );
    const top = Math.min(Math.max(desiredTop, minTop), maxTop);
    const triggerCenter = triggerRect.left + triggerRect.width / 2;
    const arrowLeft = Math.min(
      Math.max(triggerCenter - left, ARROW_EDGE_MARGIN),
      width - ARROW_EDGE_MARGIN,
    );

    setPosition({
      left,
      width,
      arrowLeft,
      dropUp,
      top,
      maxHeight,
      isScrollable: naturalHeight > maxHeight,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !popoverRef.current) return;

    computePosition();

    if (!surfaceRef.current || typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver(computePosition);
    resizeObserver.observe(surfaceRef.current);

    return () => resizeObserver.disconnect();
  }, [computePosition, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        !triggerRef.current?.contains(target)
        && !popoverRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const handleReposition = () => computePosition();

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    window.visualViewport?.addEventListener('resize', handleReposition);
    window.visualViewport?.addEventListener('scroll', handleReposition);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
      window.visualViewport?.removeEventListener('resize', handleReposition);
      window.visualViewport?.removeEventListener('scroll', handleReposition);
    };
  }, [computePosition, isOpen]);

  const togglePopover = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    computePosition();
    setIsOpen(true);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={togglePopover}
        aria-label={`Кратко о дополнении «${title}»`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        aria-describedby={isOpen ? popoverId : undefined}
      >
        <Info size={16} aria-hidden="true" />
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && position && (
            <motion.div
              ref={popoverRef}
              id={popoverId}
              role="tooltip"
              className={styles.popover}
              data-placement={position.dropUp ? 'top' : 'bottom'}
              style={{
                left: position.left,
                width: position.width,
                top: position.top,
              }}
              initial={{
                opacity: 0,
                y: shouldReduceMotion ? 0 : position.dropUp ? 4 : -4,
              }}
              animate={{
                opacity: 1,
                y: 0,
                transition: shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
              }}
              exit={{
                opacity: 0,
                y: shouldReduceMotion ? 0 : position.dropUp ? 2 : -2,
                transition: shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.18, ease: [0.4, 0, 1, 1] },
              }}
            >
              <span
                className={styles.popover__arrow}
                style={{ left: position.arrowLeft }}
                aria-hidden="true"
              />
              <div
                ref={surfaceRef}
                className={styles.popover__surface}
                style={{ maxHeight: position.maxHeight }}
                tabIndex={position.isScrollable ? 0 : undefined}
              >
                <strong className={styles.popover__title}>{title}</strong>
                <p className={styles.popover__text}>{summary}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
};
