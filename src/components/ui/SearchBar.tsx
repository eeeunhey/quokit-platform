'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  className?: string;
  defaultValue?: string;
}

export function SearchBar({ className, defaultValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form 
      onSubmit={handleSearch}
      className={cn("relative group w-full", className)}
    >
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="w-5 h-5 text-text-tertiary group-focus-within:text-accent transition-colors" />
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="어떤 레포지토리를 찾으시나요?"
        className="w-full pl-12 pr-4 py-3.5 bg-surface border border-line rounded-2xl 
                   text-base text-text-primary placeholder:text-text-tertiary
                   focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20
                   shadow-sm transition-all"
      />
    </form>
  );
}
