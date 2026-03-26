import React, { useEffect, PropsWithChildren } from "react";
import { createPortal } from "react-dom";
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
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  type?: "success" | "error" | "info" | "plain";
  closeOnEscape?: boolean;
}

const Modal2: React.FC<PropsWithChildren<ModalProps>> = ({
  isOpen,
  onClose,
  title,
  showClose = true,
  size = "md",
  className = "",
  type = "info",
  closeOnEscape = false,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeOnEscape, isOpen, onClose]);

  const handleClose = () => onClose();

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
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
    plain: {
      headerBg: "bg-white",
      border: "border-gray-200",
      iconBg: "",
      iconText: "",
      accent: "",
    },
  } as const;

  const ui = stylesByType[type];
  const isPlain = type === "plain";

  if (!isOpen) {
    return null;
  }

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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 px-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
      role="presentation"
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl border bg-white shadow-2xl ${sizeClasses[size]} ${ui.border} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Modal"}
      >
        {/* Accent bar - only for non-plain types */}
        {!isPlain && <div className={`h-1.5 ${ui.accent}`} />}

        {/* Header */}
        {(title || showClose) && (
          <div
            className={`relative px-6 py-4 ${isPlain ? '' : ui.headerBg} ${isPlain ? '' : `border-b ${ui.border}`}`}
          >
            {showClose && (
              <button
                onClick={handleClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                           flex items-center justify-center text-gray-500 hover:text-gray-800
                           hover:bg-gray-100 transition-colors"
                aria-label="Cerrar"
                type="button"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}

            {title && (
              <div className={`${isPlain ? 'justify-center' : ''} flex items-center gap-3 pr-12`}>
                {!isPlain && <StatusIcon />}
                <div>
                  <h3 className={`text-base sm:text-lg font-semibold text-gray-900 leading-tight ${isPlain ? 'text-center' : ''}`}>
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
    </div>,
    document.body
  );
};

export default Modal2;
