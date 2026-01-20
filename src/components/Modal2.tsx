import React, { useEffect, useRef, PropsWithChildren } from "react";
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  showClose?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  type?: "success" | "error" | "info";
}

const Modal2: React.FC<PropsWithChildren<ModalProps>> = ({
  isOpen,
  onClose,
  title,
  showClose = true,
  size = "md",
  className = "",
  type = "info",
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) dialog.showModal();
    else dialog.close();
  }, [isOpen]);

  const handleClose = () => onClose();

  const handleClickOutside = (event: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;

    const isInDialog =
      rect.top <= event.clientY &&
      event.clientY <= rect.bottom &&
      rect.left <= event.clientX &&
      event.clientX <= rect.right;

    if (!isInDialog) handleClose();
  };

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  const stylesByType = {
    success: {
      headerBg: "bg-green-50",
      border: "border-green-100",
      iconBg: "bg-green-100",
      iconText: "text-green-600",
      accent: "bg-green-500",
    },
    error: {
      headerBg: "bg-red-50",
      border: "border-red-100",
      iconBg: "bg-red-100",
      iconText: "text-red-600",
      accent: "bg-red-500",
    },
    info: {
      headerBg: "bg-blue-50",
      border: "border-blue-100",
      iconBg: "bg-blue-100",
      iconText: "text-blue-600",
      accent: "bg-blue-500",
    },
  } as const;

  const ui = stylesByType[type];

  const StatusIcon = () => {
    const base =
      "w-9 h-9 inline-flex items-center justify-center rounded-full p-2";
    if (type === "success")
      return (
        <div className={`${base} ${ui.iconBg}`}>
          <CheckCircleIcon className={`${ui.iconText} w-full h-full`} />
        </div>
      );
    if (type === "error")
      return (
        <div className={`${base} ${ui.iconBg}`}>
          <ExclamationCircleIcon className={`${ui.iconText} w-full h-full`} />
        </div>
      );
    return (
      <div className={`${base} ${ui.iconBg}`}>
        <InformationCircleIcon className={`${ui.iconText} w-full h-full`} />
      </div>
    );
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleClickOutside}
      onCancel={(e) => {
        e.preventDefault(); // evita que el dialog se cierre "solo" sin pasar por onClose
        handleClose();
      }}
      className="backdrop:bg-gray-900/40 backdrop:backdrop-blur-[3px] p-0 bg-transparent m-auto w-[95vw] sm:w-full"
    >
      <div
        className={`bg-white ${sizeClasses[size]} w-full mx-auto rounded-2xl overflow-hidden border shadow-2xl ${ui.border} ${className}`}
      >
        {/* Accent bar */}
        <div className={`h-1.5 ${ui.accent}`} />

        {/* Header */}
        {(title || showClose) && (
          <div
            className={`relative px-6 py-4 ${ui.headerBg} border-b ${ui.border}`}
          >
            {showClose && (
              <button
                onClick={handleClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                           flex items-center justify-center text-gray-500 hover:text-gray-800
                           hover:bg-white/60 transition-colors"
                aria-label="Cerrar"
                type="button"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}

            {title && (
              <div className="flex items-center gap-3 pr-12">
                <StatusIcon />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">
                    {title}
                  </h3>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </dialog>
  );
};

export default Modal2;
