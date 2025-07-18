import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  className?: string;
}

export default function SearchBar(props: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock suggestions - in a real app, these would come from an API
  const mockSuggestions = [
    'react components',
    'react hooks tutorial',
    'react best practices',
    'react router',
    'react state management',
    'react performance optimization',
    'react testing',
    'react native',
  ];

  useEffect(() => {
    if (query.length > 0) {
      const filtered = mockSuggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSearch = (searchQuery = query) => {
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      setShowSuggestions(false);
      // In a real app, you would navigate to search results or make an API call
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const clearQuery = () => {
    setQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`${props.className ?? ''}`}>
      {/* Unified Search Block */}
      <div className="relative w-full box-border">
        {/* Search Bar */}
        <div
          className={`relative bg-gray-100 rounded-tl-[26px] rounded-tr-[26px] ${
            isFocused ? ' ' : 'hover:bg-gray-200'
          } ${
            showSuggestions && suggestions.length > 0
              ? 'rounded-b-none'
              : 'rounded-b-[26px]'
          }`}
        >
          <div className="flex items-center">
            {/* Search Icon */}
            <div className="pl-4 pr-3">
              <Search className="w-5 h-5 text-gray-400" />
            </div>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setTimeout(() => {
                  setIsFocused(true);
                  setShowSuggestions(true);
                }, 150);
              }}
              onBlur={() => {
                // Delay hiding suggestions to allow clicking
                setTimeout(() => {
                  setIsFocused(false);
                  setShowSuggestions(false);
                }, 150);
              }}
              onKeyPress={handleKeyPress}
              placeholder=""
              className="flex-1 py-3 px-1 text-gray-700 text-lg outline-none bg-transparent w-full"
            />

            {/* Clear Button */}
            {query && (
              <button onClick={clearQuery} className="p-2 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        <div className="relative">
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute w-full top-[-1px] bg-gray-100 rounded-bl-[26px] rounded-br-[26px] pb-5 z-10">
              <div className="border-t-[1px] border-gray-200 mx-[14px] pb-[4px]"></div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center transition-colors"
                >
                  <Search className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-700">{suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
