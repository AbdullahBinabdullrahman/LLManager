'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModelWithState } from '@/types/ollama';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useTranslation } from './I18nProvider';
import { formatBytes } from '@/lib/utils';
import { Eye, Trash2, Box, Play, Square, MessageCircle, Loader2 } from 'lucide-react';
import { ModelDetailsDialog } from './ModelDetailsDialog';
import { DeleteModelDialog } from './DeleteModelDialog';
import { TableSkeleton } from './ui/skeleton';
import { toast } from '@/lib/toast';
import { useSWRConfig } from 'swr';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface ModelsTableProps {
  models: ModelWithState[];
  isLoading?: boolean;
}

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
  exit: { opacity: 0, x: 10 },
};

export function ModelsTable({ models, isLoading }: ModelsTableProps) {
  const { t } = useTranslation();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [deleteModel, setDeleteModel] = useState<string | null>(null);
  const [loadingModel, setLoadingModel] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const handleRunModel = async (modelName: string) => {
    setLoadingModel(modelName);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: '',
          keep_alive: '10m',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load model');
      }

      toast.success(t('models.loadSuccess') || `Model ${modelName} loaded successfully`);
      mutate('/api/running');
    } catch (error: any) {
      toast.error(error.message || 'Failed to load model');
    } finally {
      setLoadingModel(null);
    }
  };

  const handleStopModel = async (modelName: string) => {
    setLoadingModel(modelName);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: '',
          keep_alive: 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unload model');
      }

      toast.success(t('models.unloadSuccess') || `Model ${modelName} unloaded successfully`);
      mutate('/api/running');
    } catch (error: any) {
      toast.error(error.message || 'Failed to unload model');
    } finally {
      setLoadingModel(null);
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={4} />;
  }

  if (models.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Box className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-mono">{t('models.noModels')}</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Pull a model to get started
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="font-mono text-xs text-muted-foreground">
                {t('models.name')}
              </TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">
                {t('models.size')}
              </TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">
                {t('models.status')}
              </TableHead>
              <TableHead className="text-right font-mono text-xs text-muted-foreground">
                {t('models.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {models.map((model, index) => (
                <motion.tr
                  key={model.name}
                  custom={index}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="group border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-mono font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                      {model.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {formatBytes(model.size)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={model.loaded ? 'default' : 'secondary'}
                      className={model.loaded 
                        ? 'bg-accent/20 text-accent border-accent/30 font-mono text-xs' 
                        : 'font-mono text-xs'
                      }
                    >
                      {model.loaded ? t('models.loaded') : t('models.unloaded')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 rtl:flex-row-reverse opacity-0 group-hover:opacity-100 transition-opacity">
                      {model.loaded ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStopModel(model.name)}
                            disabled={loadingModel === model.name}
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            title="Stop model"
                          >
                            {loadingModel === model.name ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                          <Link href={`/${locale}/chat?model=${encodeURIComponent(model.name)}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-accent/20 hover:text-accent"
                              title="Chat with model"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRunModel(model.name)}
                          disabled={loadingModel === model.name}
                          className="h-8 w-8 hover:bg-accent/20 hover:text-accent"
                          title="Run model"
                        >
                          {loadingModel === model.name ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedModel(model.name)}
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteModel(model.name)}
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        title="Delete model"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {selectedModel && (
        <ModelDetailsDialog
          modelName={selectedModel}
          open={!!selectedModel}
          onOpenChange={(open) => !open && setSelectedModel(null)}
        />
      )}

      {deleteModel && (
        <DeleteModelDialog
          modelName={deleteModel}
          diskSize={models.find((m) => m.name === deleteModel)?.size || 0}
          open={!!deleteModel}
          onOpenChange={(open) => !open && setDeleteModel(null)}
        />
      )}
    </>
  );
}
