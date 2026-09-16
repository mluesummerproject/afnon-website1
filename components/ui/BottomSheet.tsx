'use client';

import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  /** Rendered in the draggable top area, under the grab handle. */
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * A native modal <dialog> (focus trap, inert page, Escape, focus return — all
 * from the browser) with an app-style sheet inside: slides up on a spring,
 * backdrop fades in over 200ms, swipe down on the handle or header to dismiss.
 * The dialog closes only after the exit animation finishes.
 */
export function BottomSheet({ open, onClose, labelledBy, header, children, footer }: BottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(open);
  const drag = useDragControls();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!mounted || !dialog || dialog.open) return;
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
  }, [mounted]);

  useEffect(
    () => () => {
      document.documentElement.style.overflow = '';
    },
    [],
  );

  const finish = () => {
    dialogRef.current?.close();
    document.documentElement.style.overflow = '';
    setMounted(false);
  };

  if (!mounted) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-ink"
    >
      <AnimatePresence onExitComplete={finish}>
        {open ? (
          <motion.div
            key="backdrop"
            className="absolute inset-0 bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={onClose}
          />
        ) : null}
        {open ? (
          <motion.div
            key="panel"
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[90dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[20px] bg-card shadow-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 }}
            drag="y"
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 96 || info.velocity.y > 500) onClose();
            }}
          >
            <div className="shrink-0 touch-none" onPointerDown={(event) => drag.start(event)} data-sheet-handle>
              <div className="flex h-6 items-center justify-center" aria-hidden="true">
                <span className="h-1 w-10 rounded-full bg-ink/20" />
              </div>
              {header}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
            {footer ? <div className="shrink-0 border-t border-line pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div> : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  );
}
