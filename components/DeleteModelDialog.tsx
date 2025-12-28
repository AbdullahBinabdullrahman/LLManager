'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { useTranslation } from './I18nProvider';
import { useState } from 'react';
import { formatBytes } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useModelsWithState } from '@/hooks/useModels';
import { showToast } from '@/lib/toast';
import { AlertTriangle, Trash2, HardDrive } from 'lucide-react';

interface DeleteModelDialogProps {
  modelName: string;
  diskSize: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteModelDialog({
  modelName,
  diskSize,
  open,
  onOpenChange,
}: DeleteModelDialogProps) {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { mutate } = useModelsWithState();

  const handleDelete = async () => {
    setDeleting(true);

    const toastId = showToast.loading(t('delete.deleting'));

    try {
      const response = await fetch('/api/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete model');
      }

      showToast.dismiss(toastId);
      showToast.success(t('delete.success'), `${modelName} has been removed`);
      
      mutate();
      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      showToast.dismiss(toastId);
      showToast.error(t('delete.error'), err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="terminal-card border-destructive/30 sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <DialogTitle className="font-mono">{t('delete.title')}</DialogTitle>
          </div>
          <DialogDescription className="pt-4 space-y-3">
            <p>{t('delete.confirm')}</p>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-mono text-sm">
                <Trash2 className="w-4 h-4 text-destructive" />
                <span className="font-semibold">{modelName}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <HardDrive className="w-4 h-4" />
                <span>{t('delete.diskFreed', { size: formatBytes(diskSize) })}</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={deleting}
            className="font-mono"
          >
            {t('delete.cancel')}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={deleting}
            className="font-mono"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? t('delete.deleting') : t('delete.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
