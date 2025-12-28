'use client';

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
import { useTranslation } from './I18nProvider';
import { formatBytes, formatTimeRemaining } from '@/lib/utils';
import { Activity, Clock } from 'lucide-react';
import { TableSkeleton } from './ui/skeleton';

interface RunningModelsTableProps {
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

export function RunningModelsTable({ models, isLoading }: RunningModelsTableProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <TableSkeleton rows={3} columns={4} />;
  }

  if (models.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-mono">{t('models.noRunningModels')}</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Models will appear here when loaded
        </p>
      </motion.div>
    );
  }

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="font-mono text-xs text-muted-foreground">
              {t('models.name')}
            </TableHead>
            <TableHead className="font-mono text-xs text-muted-foreground">
              {t('models.vramUsage')}
            </TableHead>
            <TableHead className="font-mono text-xs text-muted-foreground">
              {t('models.expiresIn')}
            </TableHead>
            <TableHead className="text-right font-mono text-xs text-muted-foreground">
              {t('models.status')}
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
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    {model.name}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {model.size_vram ? formatBytes(model.size_vram) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-mono text-sm">
                      {model.expires_at 
                        ? formatTimeRemaining(model.expires_at)
                        : t('models.never')
                      }
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant="default"
                    className="bg-accent/20 text-accent border-accent/30 font-mono text-xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mr-1.5 animate-pulse" />
                    {t('models.loaded')}
                  </Badge>
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
