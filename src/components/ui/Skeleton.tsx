import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-surface-active", className)}
      {...props}
    />
  );
}

Skeleton.Text = function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4 w-full", className)} />;
};

Skeleton.Title = function SkeletonTitle({ className }: { className?: string }) {
  return <Skeleton className={cn("h-6 w-3/4 mb-4", className)} />;
};

Skeleton.Card = function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("surface-card p-5 flex flex-col gap-3", className)}>
      <Skeleton.Title className="w-1/2" />
      <div className="space-y-2">
        <Skeleton.Text />
        <Skeleton.Text className="w-5/6" />
      </div>
      <div className="flex gap-2 mt-1">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-5 w-14" />
      </div>
    </div>
  );
};
