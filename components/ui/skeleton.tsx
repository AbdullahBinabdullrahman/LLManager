import { cn } from '@/lib/utils';

/**
 * Skeleton loading component with terminal-style shimmer effect
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-md bg-muted skeleton-shimmer',
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton for table rows
 */
function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border/50">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === 0 ? 'w-32' : i === columns - 1 ? 'w-20' : 'w-24'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for entire table
 */
function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-md border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 border-b border-border/50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              'h-3',
              i === 0 ? 'w-24' : i === columns - 1 ? 'w-16' : 'w-20'
            )}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  );
}

/**
 * Skeleton for stat cards
 */
function StatCardSkeleton() {
  return (
    <div className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

/**
 * Skeleton for card content
 */
function CardSkeleton() {
  return (
    <div className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export { 
  Skeleton, 
  TableRowSkeleton, 
  TableSkeleton, 
  StatCardSkeleton, 
  CardSkeleton 
};

