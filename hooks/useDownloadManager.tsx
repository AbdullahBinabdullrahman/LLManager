'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { useSWRConfig } from 'swr';

/**
 * Download status type
 */
export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'error' | 'cancelled';

/**
 * Download item representing a model being pulled
 */
export interface DownloadItem {
  id: string;
  modelName: string;
  status: DownloadStatus;
  statusText: string;
  progress: number;
  total?: number;
  completed?: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Download manager context type
 */
interface DownloadManagerContextType {
  downloads: DownloadItem[];
  activeDownloads: DownloadItem[];
  startDownload: (modelName: string) => string;
  cancelDownload: (id: string) => void;
  clearDownload: (id: string) => void;
  clearCompleted: () => void;
  getDownload: (id: string) => DownloadItem | undefined;
  isDownloading: (modelName: string) => boolean;
}

const DownloadManagerContext = createContext<DownloadManagerContextType | null>(null);

/**
 * Hook to use the download manager
 */
export function useDownloadManager() {
  const context = useContext(DownloadManagerContext);
  if (!context) {
    throw new Error('useDownloadManager must be used within a DownloadManagerProvider');
  }
  return context;
}

interface DownloadManagerProviderProps {
  children: React.ReactNode;
}

/**
 * Download manager provider that handles background model downloads
 */
export function DownloadManagerProvider({ children }: DownloadManagerProviderProps) {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const { mutate } = useSWRConfig();

  // Clean up abort controllers on unmount
  useEffect(() => {
    return () => {
      abortControllers.current.forEach((controller) => controller.abort());
    };
  }, []);

  /**
   * Update a specific download item
   */
  const updateDownload = useCallback((id: string, updates: Partial<DownloadItem>) => {
    setDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  }, []);

  /**
   * Start downloading a model
   */
  const startDownload = useCallback((modelName: string): string => {
    const id = `${modelName}-${Date.now()}`;
    const abortController = new AbortController();
    abortControllers.current.set(id, abortController);

    // Create new download item
    const newDownload: DownloadItem = {
      id,
      modelName,
      status: 'pending',
      statusText: 'Starting download...',
      progress: 0,
      startedAt: new Date(),
    };

    setDownloads((prev) => [...prev, newDownload]);

    // Start the streaming download
    const startStream = async () => {
      try {
        const response = await fetch('/api/pull-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: modelName }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to start download');
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        updateDownload(id, { status: 'downloading' });

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process SSE events
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.error) {
                  updateDownload(id, {
                    status: 'error',
                    statusText: data.error,
                    error: data.error,
                    completedAt: new Date(),
                  });
                  return;
                }

                const updates: Partial<DownloadItem> = {
                  statusText: data.status || 'Downloading...',
                };

                if (data.percent !== undefined) {
                  updates.progress = data.percent;
                }

                if (data.total !== undefined) {
                  updates.total = data.total;
                }

                if (data.completed !== undefined) {
                  updates.completed = data.completed;
                }

                if (data.done && data.status === 'success') {
                  updates.status = 'completed';
                  updates.progress = 100;
                  updates.completedAt = new Date();
                  updates.statusText = 'Download complete!';
                  
                  // Refresh models list
                  mutate('/api/models');
                }

                updateDownload(id, updates);
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        // Mark as completed if not already done
        setDownloads((prev) =>
          prev.map((d) => {
            if (d.id === id && d.status === 'downloading') {
              mutate('/api/models');
              return {
                ...d,
                status: 'completed' as DownloadStatus,
                progress: 100,
                statusText: 'Download complete!',
                completedAt: new Date(),
              };
            }
            return d;
          })
        );
      } catch (error: any) {
        if (error.name === 'AbortError') {
          updateDownload(id, {
            status: 'cancelled',
            statusText: 'Download cancelled',
            completedAt: new Date(),
          });
        } else {
          updateDownload(id, {
            status: 'error',
            statusText: error.message || 'Download failed',
            error: error.message,
            completedAt: new Date(),
          });
        }
      } finally {
        abortControllers.current.delete(id);
      }
    };

    startStream();

    return id;
  }, [updateDownload, mutate]);

  /**
   * Cancel a download
   */
  const cancelDownload = useCallback((id: string) => {
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(id);
    }
  }, []);

  /**
   * Clear a download from the list
   */
  const clearDownload = useCallback((id: string) => {
    cancelDownload(id);
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  }, [cancelDownload]);

  /**
   * Clear all completed downloads
   */
  const clearCompleted = useCallback(() => {
    setDownloads((prev) =>
      prev.filter((d) => d.status !== 'completed' && d.status !== 'error' && d.status !== 'cancelled')
    );
  }, []);

  /**
   * Get a specific download
   */
  const getDownload = useCallback(
    (id: string) => downloads.find((d) => d.id === id),
    [downloads]
  );

  /**
   * Check if a model is currently downloading
   */
  const isDownloading = useCallback(
    (modelName: string) =>
      downloads.some(
        (d) =>
          d.modelName === modelName &&
          (d.status === 'pending' || d.status === 'downloading')
      ),
    [downloads]
  );

  /**
   * Get active downloads (pending or downloading)
   */
  const activeDownloads = downloads.filter(
    (d) => d.status === 'pending' || d.status === 'downloading'
  );

  const value: DownloadManagerContextType = {
    downloads,
    activeDownloads,
    startDownload,
    cancelDownload,
    clearDownload,
    clearCompleted,
    getDownload,
    isDownloading,
  };

  return (
    <DownloadManagerContext.Provider value={value}>
      {children}
    </DownloadManagerContext.Provider>
  );
}

