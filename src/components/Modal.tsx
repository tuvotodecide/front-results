import React, { useEffect, useRef, PropsWithChildren } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

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

  return (
    <dialog
      ref={dialogRef}
      onClick={handleClickOutside}
      className="backdrop:bg-gray-900/20 backdrop:backdrop-blur-[2px] p-0 bg-transparent m-auto rounded-lg overflow-hidden w-[95vw] sm:w-full"
    >
      <div
        className={`bg-white ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto overscroll-contain mx-auto ${className}`}
      >
        <div className="relative">
          {showClose && (
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}

          {title && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
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
