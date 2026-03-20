import React from "react";

interface ConfigPageFallbackProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const ConfigPageFallback: React.FC<ConfigPageFallbackProps> = ({
  title,
  message,
  actionLabel,
  onAction,
}) => (
  <div className="bg-gray-50 min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
    <div className="max-w-lg w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <p className="mt-3 text-sm text-gray-600">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-lg bg-[#459151] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#3a7a44]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  </div>
);

export default ConfigPageFallback;
