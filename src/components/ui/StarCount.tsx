import { cn } from '@/lib/utils';
import { formatCompactNumber } from '@/lib/utils';
import { Star, TrendingUp } from 'lucide-react';

interface StarCountProps {
  count: number;
  gained?: number;
  showIcon?: boolean;
  className?: string;
}

export function StarCount({ count, gained, showIcon = true, className }: StarCountProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Total Stars */}
      <div className="flex items-center gap-1 text-text-primary font-medium">
        {showIcon && <Star className="w-4 h-4 text-star" />}
        <span className="data-num">{formatCompactNumber(count)}</span>
      </div>

      {/* Gained Stars (If provided and > 0) */}
      {gained !== undefined && gained > 0 && (
        <div className="flex items-center gap-1 text-success text-sm font-semibold ml-1">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="data-num">+{gained}</span>
        </div>
      )}
    </div>
  );
}
