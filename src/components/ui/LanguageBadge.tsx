import { cn } from '@/lib/utils';
import { LANGUAGE_COLORS } from '@/lib/constants';

interface LanguageBadgeProps {
  language: string;
  className?: string;
}

export function LanguageBadge({ language, className }: LanguageBadgeProps) {
  if (!language) return null;
  
  const color = LANGUAGE_COLORS[language] || '#8b949e';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span 
        className="block w-2.5 h-2.5 rounded-full" 
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="text-sm text-text-secondary font-medium">
        {language}
      </span>
    </div>
  );
}
