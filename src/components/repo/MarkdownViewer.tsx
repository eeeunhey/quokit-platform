import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  return (
    <div className={cn(
      `prose prose-slate max-w-none text-sm leading-relaxed
      prose-headings:text-text-primary prose-headings:font-bold prose-headings:tracking-tight
      prose-a:text-accent prose-a:no-underline hover:prose-a:underline
      prose-pre:bg-surface-active prose-pre:border prose-pre:border-line prose-pre:rounded-lg
      prose-code:text-accent prose-code:bg-accent-light prose-code:px-1 prose-code:rounded prose-code:text-xs
      prose-blockquote:border-l-accent prose-blockquote:bg-accent-light/50 prose-blockquote:py-1 prose-blockquote:px-4
      prose-li:marker:text-accent
      prose-p:text-text-secondary`,
      className
    )}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
