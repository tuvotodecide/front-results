import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  className?: string;
  onSearch?: (query: string) => void;
  inputDataCy?: string;
  submitDataCy?: string;
  clearDataCy?: string;
}

export default function SimpleSearchBar({
  className,
  onSearch,
  inputDataCy = "image-search-input",
  submitDataCy = "image-search-submit",
  clearDataCy = "image-search-clear",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length > 0) {
      // handle search suggestions
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(query);
    }
  };

  const handleSearchClick = () => {
    if (onSearch) {
      onSearch(query);
    }
  };

  // const handleSuggestionClick = (suggestion: string) => {
  //   setQuery(suggestion);
  //   handleSearch(suggestion);
  // };

  const clearQuery = () => {
    setQuery("");
  };

  return (
    <div className={`${className ?? ""}`}>
      {/* Unified Search Block */}
      <div className="relative w-full box-border">
        {/* Search Bar */}
        <div className={`relative bg-gray-100 rounded-[26px]`}>
          <div className="flex items-center">
            {/* Search Icon */}
            <button
              data-cy={submitDataCy}
              onClick={handleSearchClick}
              className="pl-4 pr-3 hover:bg-gray-200 rounded-l-[26px] transition-colors"
            >
              <Search className="w-5 h-5 text-gray-400" />
            </button>

            {/* Input Field */}
            <input
              ref={inputRef}
              data-cy={inputDataCy}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder=""
              className="flex-1 py-2 px-1 pr-10 text-gray-700 text-lg outline-none bg-transparent w-full"
            />

            {/* Clear Button */}
            {query && (
              <button
                data-cy={clearDataCy}
                onClick={clearQuery}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 transition-colors hover:bg-gray-200 rounded-full"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
