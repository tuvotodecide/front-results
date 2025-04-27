import React from "react";

interface SpinnerProps {
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  className = "h-5 w-5 text-gray-400",
}) => {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle
        className="opacity-50"
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="5"
        fill="none"
      />
      <circle
        className="opacity-100"
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="12.5 37.5"
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
};

export default Spinner;
