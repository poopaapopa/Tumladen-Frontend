import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import styles from './modal.module.scss';
import React from 'react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional class applied to the modal content wrapper — use to override max-width etc. */
  className?: string;
}

function Modal({ isOpen, onClose, children, className }: ModalProps) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={clsx(styles.modalContent, className)}
            initial={{ opacity: 0, x: '-50%', y: '-100%', scale: 0.9 }}
            animate={{ opacity: 1, x: '-50%', y: '-50%', scale: 1 }}
            exit={{ opacity: 0, x: '-50%', y: '-100%', scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default Modal;