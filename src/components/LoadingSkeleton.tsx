import React from "react";

interface LoadingSkeletonProps {
  tone?: "surface" | "brand";
  fullScreen?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  tone = "surface",
  fullScreen = true,
}) => {
  const shellClass =
    tone === "brand"
      ? "bg-[#459151] text-white"
      : "bg-gray-50 text-slate-700";
  const cardClass =
    tone === "brand"
      ? "border border-white/15 bg-white/10"
      : "border border-gray-200 bg-white";
  const blockClass = tone === "brand" ? "bg-white/30" : "bg-gray-200";

  return (
    <div
      data-cy="loading-skeleton"
      className={`flex items-center justify-center px-4 transition-opacity duration-300 ease-out ${
        fullScreen ? "min-h-screen" : "min-h-[16rem]"
      } ${shellClass}`}
    >
      <div className={`w-full max-w-md rounded-2xl p-6 shadow-sm ${cardClass}`}>
        <div className="animate-pulse">
          <div className="mb-5 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full ${blockClass}`}></div>
            <div className="flex-1 space-y-3">
              <div className={`h-4 w-3/4 rounded ${blockClass}`}></div>
              <div className={`h-4 w-1/2 rounded ${blockClass}`}></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className={`h-4 w-full rounded ${blockClass}`}></div>
            <div className={`h-4 w-5/6 rounded ${blockClass}`}></div>
            <div className={`h-4 w-2/3 rounded ${blockClass}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
