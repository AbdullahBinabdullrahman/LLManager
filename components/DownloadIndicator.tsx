'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  CheckCircle2,
  XCircle,
  X,
  ChevronUp,
  ChevronDown,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useDownloadManager, type DownloadItem } from '@/hooks/useDownloadManager';
import { useTranslation } from './I18nProvider';
import { Button } from './ui/button';
import { cn, formatBytes } from '@/lib/utils';

/**
 * Format download speed or progress
 */
function formatProgress(completed?: number, total?: number): string {
  if (!completed || !total) return '';
  return `${formatBytes(completed)} / ${formatBytes(total)}`;
}

/**
 * Individual download item component
 */
function DownloadItemRow({ download, onCancel, onClear }: {
  download: DownloadItem;
  onCancel: () => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const isActive = download.status === 'pending' || download.status === 'downloading';
  const isCompleted = download.status === 'completed';
  const isError = download.status === 'error' || download.status === 'cancelled';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="px-3 py-2 border-b border-border/30 last:border-0"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isActive && (
            <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
          )}
          {isCompleted && (
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
          )}
          {isError && (
            <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
          )}
          <span className="font-mono text-sm truncate">{download.modelName}</span>
        </div>
        
        {isActive ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive"
            title={t('downloads.cancel')}
          >
            <X className="w-3 h-3" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-6 w-6 hover:bg-muted"
            title={t('downloads.clear')}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {isActive && (
        <div className="mt-2 space-y-1">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${download.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span className="truncate">{download.statusText}</span>
            <span className="flex-shrink-0 ml-2">
              {download.progress > 0 ? `${download.progress}%` : ''}
              {download.total && download.completed && (
                <span className="ml-1">({formatProgress(download.completed, download.total)})</span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Status text for completed/error */}
      {!isActive && (
        <p className={cn(
          'text-xs mt-1 truncate font-mono',
          isCompleted && 'text-green-500',
          isError && 'text-destructive'
        )}>
          {download.statusText}
        </p>
      )}
    </motion.div>
  );
}

/**
 * Download indicator that shows in the sidebar when downloads are active
 */
export function DownloadIndicator() {
  const { t } = useTranslation();
  const { downloads, activeDownloads, cancelDownload, clearDownload, clearCompleted } = useDownloadManager();
  const [expanded, setExpanded] = useState(false);

  // Don't show if no downloads
  if (downloads.length === 0) {
    return null;
  }

  const hasActive = activeDownloads.length > 0;
  const totalProgress = hasActive
    ? Math.round(
        activeDownloads.reduce((sum, d) => sum + d.progress, 0) / activeDownloads.length
      )
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]"
    >
      <div className="terminal-card overflow-hidden shadow-lg border border-border/50">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Download className={cn(
                'w-5 h-5',
                hasActive ? 'text-primary animate-pulse' : 'text-muted-foreground'
              )} />
              {hasActive && (
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>
            <div className="text-left">
              <p className="font-mono text-sm font-medium">
                {hasActive
                  ? t('downloads.downloading', { count: activeDownloads.length })
                  : t('downloads.completed')}
              </p>
              {hasActive && (
                <p className="text-xs text-muted-foreground">
                  {totalProgress}% {t('downloads.overall')}
                </p>
              )}
            </div>
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Overall progress bar when collapsed */}
        {!expanded && hasActive && (
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Expanded download list */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="max-h-64 overflow-y-auto">
                <AnimatePresence>
                  {downloads.map((download) => (
                    <DownloadItemRow
                      key={download.id}
                      download={download}
                      onCancel={() => cancelDownload(download.id)}
                      onClear={() => clearDownload(download.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Clear completed button */}
              {downloads.some((d) => d.status !== 'pending' && d.status !== 'downloading') && (
                <div className="px-3 py-2 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCompleted}
                    className="w-full text-xs font-mono"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    {t('downloads.clearCompleted')}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

