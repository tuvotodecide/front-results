import React, { useEffect, useRef, PropsWithChildren } from 'react';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  showClose?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Modal: React.FC<PropsWithChildren<ModalProps>> = ({
  isOpen,
  onClose,
  title,
  showClose = true,
  size = 'md',
  className = '',
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleClickOutside = (event: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (rect) {
      const isInDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.bottom &&
        rect.left <= event.clientX &&
        event.clientX <= rect.right;
      if (!isInDialog) {
        handleClose();
      }
    }
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };
  const isDestructive = /elimin/i.test(title ?? '');

  return (
    <dialog
      ref={dialogRef}
      onClick={handleClickOutside}
      className="backdrop:bg-slate-950/45 backdrop:backdrop-blur-[4px] p-0 bg-transparent m-auto rounded-3xl overflow-hidden w-[95vw] sm:w-full"
    >
      <div
        className={`bg-white ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto overscroll-contain mx-auto rounded-3xl border border-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.25)] ${className}`}
      >
        <div className="relative overflow-hidden">
          <div className={`h-1.5 w-full ${isDestructive ? 'bg-red-500' : 'bg-[#459151]'}`} />
          {showClose && (
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar modal"
              type="button"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}

          {title && (
            <div className="border-b border-slate-200 bg-slate-50/90 px-6 py-5">
              <div className="flex items-start gap-4 pr-12">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    isDestructive
                      ? 'bg-red-100 text-red-600'
                      : 'bg-emerald-100 text-[#2f6f3a]'
                  }`}
                >
                  {isDestructive ? (
                    <ExclamationTriangleIcon className="h-6 w-6" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-current" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  {isDestructive && (
                    <p className="mt-1 text-sm text-slate-500">
                      Esta acción no se puede deshacer.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div
            className={`p-6 ${
              !title && showClose ? 'pt-12' : !title ? 'pt-4' : ''
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default Modal;
