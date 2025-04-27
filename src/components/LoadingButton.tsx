import React from "react";
import Spinner from "./Spinner";

interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={isLoading || disabled}
      className={`py-2 px-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 border relative ${
        isLoading || disabled
          ? "bg-gray-300 border-gray-400 cursor-not-allowed"
          : "bg-transparent text-blue-700 hover:bg-blue-50 border-blue-500"
      } ${className}`}
      {...props}
    >
      <div className="flex items-center justify-center">
        {/* Invisible text to maintain width */}
        <span className={isLoading ? "invisible" : "visible"}>{children}</span>

        {/* Absolute positioned spinner */}
        {isLoading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Spinner />
          </div>
        )}
      </div>
    </button>
  );
};

export default LoadingButton;
