// SearchAndFiltersBar.tsx
'use client';
import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

type Props = {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  filterOpen: boolean;
  setFilterOpen: (v: boolean) => void;
  activeFiltersCount: number;
  clearFilters: () => void;
};

export default function SearchAndFiltersBar({
  searchTerm, setSearchTerm, filterOpen, setFilterOpen, activeFiltersCount, clearFilters
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 p-1">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search trades by symbol, strategy, broker..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-800 border-gray-600 text-white focus:border-cyan-400 h-11"
        />
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="border-gray-600 text-white relative h-11 px-4"
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {activeFiltersCount}
            </span>
          )}
        </Button>
        
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-gray-400 hover:text-gray-300 h-11"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
