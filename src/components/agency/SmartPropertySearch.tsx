import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Property } from '../../types';

interface SmartPropertySearchProps {
  properties: Property[];
  value: string;
  onChange: (value: string) => void;
  onPropertySelect?: (property: Property) => void;
}

interface SearchSuggestion {
  property: Property;
  matchType: 'title' | 'address' | 'city' | 'description' | 'type' | 'features';
  matchScore: number;
}

export function SmartPropertySearch({
  properties,
  value,
  onChange,
  onPropertySelect
}: SmartPropertySearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('property-search-history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Save search to history
  const saveToHistory = (query: string) => {
    if (!query || query.length < 3) return;
    
    const updated = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
    setSearchHistory(updated);
    localStorage.setItem('property-search-history', JSON.stringify(updated));
  };

  // Fuzzy search implementation
  const searchResults = useMemo(() => {
    if (!value || value.length < 2) return [];

    const query = value.toLowerCase().trim();
    const suggestions: SearchSuggestion[] = [];

    properties.forEach(property => {
      let matchScore = 0;
      let matchType: SearchSuggestion['matchType'] = 'title';

      // Title match (highest priority)
      if (property.title?.toLowerCase().includes(query)) {
        matchScore += 100;
        matchType = 'title';
        if (property.title.toLowerCase().startsWith(query)) {
          matchScore += 50; // Bonus for starts with
        }
      }

      // Address match
      if (property.address?.toLowerCase().includes(query)) {
        if (matchScore === 0) matchType = 'address';
        matchScore += 80;
      }

      // City match
      if (property.city?.toLowerCase().includes(query)) {
        if (matchScore === 0) matchType = 'city';
        matchScore += 70;
      }

      // Description match
      if (property.description?.toLowerCase().includes(query)) {
        if (matchScore === 0) matchType = 'description';
        matchScore += 50;
      }

      // Type match
      if (property.type?.toLowerCase().includes(query)) {
        if (matchScore === 0) matchType = 'type';
        matchScore += 60;
      }

      // Features match
      if (property.features && Array.isArray(property.features)) {
        const hasFeatureMatch = property.features.some(f => 
          typeof f === 'string' && f.toLowerCase().includes(query)
        );
        if (hasFeatureMatch) {
          if (matchScore === 0) matchType = 'features';
          matchScore += 40;
        }
      }

      // Fuzzy match - allow for minor typos
      if (matchScore === 0) {
        const fuzzyScore = calculateFuzzyScore(query, property.title?.toLowerCase() || '');
        if (fuzzyScore > 0.7) {
          matchScore = fuzzyScore * 30;
          matchType = 'title';
        }
      }

      if (matchScore > 0) {
        suggestions.push({
          property,
          matchType,
          matchScore
        });
      }
    });

    // Sort by match score
    return suggestions
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8); // Limit to top 8 results
  }, [properties, value]);

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setShowSuggestions(true);
  };

  const handleClearSearch = () => {
    onChange('');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (property: Property) => {
    saveToHistory(value);
    onPropertySelect?.(property);
    setShowSuggestions(false);
  };

  const handleHistoryClick = (query: string) => {
    onChange(query);
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value) {
      saveToHistory(value);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const getMatchTypeLabel = (matchType: SearchSuggestion['matchType']) => {
    const labels = {
      title: 'Title',
      address: 'Address',
      city: 'Location',
      description: 'Description',
      type: 'Type',
      features: 'Features'
    };
    return labels[matchType];
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-yellow-200">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search properties by title, location, features..."
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsFocused(false);
              setShowSuggestions(false);
            }, 200);
          }}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {value && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && isFocused && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 shadow-lg">
          {/* Search History */}
          {!value && searchHistory.length > 0 && (
            <div className="p-3 border-b">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Recent Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((query, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => handleHistoryClick(query)}
                  >
                    {query}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {value && searchResults.length > 0 ? (
            <div className="divide-y">
              {searchResults.map(({ property, matchType }) => (
                <div
                  key={property.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSuggestionClick(property)}
                >
                  <div className="flex items-start gap-3">
                    {/* Property Image Thumbnail */}
                    <div className="w-12 h-12 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Search className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Property Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {highlightMatch(property.title, value)}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {highlightMatch(property.address, value)}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {getMatchTypeLabel(matchType)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {property.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {property.area} {property.areaUnit || 'sq-yards'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : value && searchResults.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No properties found matching "{value}"</p>
              <p className="text-sm mt-1">Try different keywords or check your spelling</p>
            </div>
          ) : null}

          {/* Popular Searches (shown when no search value) */}
          {!value && searchHistory.length === 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Try searching for</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['DHA', 'Clifton', 'Commercial', 'Bungalow', 'Available'].map((term) => (
                  <Badge
                    key={term}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleHistoryClick(term)}
                  >
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// Simple fuzzy matching algorithm (Levenshtein distance based)
function calculateFuzzyScore(query: string, target: string): number {
  if (query === target) return 1;
  if (query.length === 0 || target.length === 0) return 0;

  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= target.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= query.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= target.length; i++) {
    for (let j = 1; j <= query.length; j++) {
      if (target[i - 1] === query[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[target.length][query.length];
  const maxLength = Math.max(query.length, target.length);
  return 1 - (distance / maxLength);
}
