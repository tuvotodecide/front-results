import React from "react";

const LoadingSkeleton: React.FC = () => {
  return (
    <div data-cy="loading-skeleton" className="flex items-center justify-center h-screen bg-gray-100 transition-opacity duration-500 ease-in-out">
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-full bg-gray-300 h-12 w-12"></div>
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
