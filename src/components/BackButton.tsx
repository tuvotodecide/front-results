import React from "react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  className?: string;
  to?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ className = "", to }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className={`p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 ${className}`}
      title="Volver"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-gray-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>
  );
};

export default BackButton;
