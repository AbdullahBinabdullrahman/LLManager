'use client';

import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useTranslation } from './I18nProvider';
import { useEffect, useState } from 'react';
import { OllamaShowResponse } from '@/types/ollama';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { 
  Info, 
  MessageSquare, 
  FileCode, 
  Settings, 
  FileText,
  Cpu,
  Layers,
  Scale,
  Gauge
} from 'lucide-react';

interface ModelDetailsDialogProps {
  modelName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailItem({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="p-4 bg-muted/30 border border-border/50 rounded-lg overflow-auto font-mono text-sm whitespace-pre-wrap text-muted-foreground">
      {children}
    </pre>
  );
}

export function ModelDetailsDialog({
  modelName,
  open,
  onOpenChange,
}: ModelDetailsDialogProps) {
  const { t } = useTranslation();
  const [details, setDetails] = useState<OllamaShowResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && modelName) {
      setLoading(true);
      setError(null);
      fetch('/api/show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setDetails(data);
          }
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, modelName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="terminal-card max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/30">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-mono gradient-text">{modelName}</DialogTitle>
              <DialogDescription className="font-mono text-xs">
                {t('modelDetails.details')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <Skeleton className="h-40" />
          </div>
        )}

        {error && (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/15 flex items-center justify-center mx-auto mb-3">
              <Info className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-destructive font-mono">{t('common.error')}: {error}</p>
          </div>
        )}

        {details && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="bg-muted/50 mb-4">
                <TabsTrigger value="details" className="font-mono text-xs gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  {t('modelDetails.details')}
                </TabsTrigger>
                <TabsTrigger value="system" className="font-mono text-xs gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {t('modelDetails.system')}
                </TabsTrigger>
                <TabsTrigger value="template" className="font-mono text-xs gap-1.5">
                  <FileCode className="w-3.5 h-3.5" />
                  {t('modelDetails.template')}
                </TabsTrigger>
                <TabsTrigger value="parameters" className="font-mono text-xs gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  {t('modelDetails.parameters')}
                </TabsTrigger>
                <TabsTrigger value="modelfile" className="font-mono text-xs gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {t('modelDetails.modelfile')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {details.details?.format && (
                    <DetailItem 
                      label="Format" 
                      value={details.details.format}
                      icon={Cpu}
                    />
                  )}
                  {details.details?.family && (
                    <DetailItem 
                      label="Family" 
                      value={details.details.family}
                      icon={Layers}
                    />
                  )}
                  {details.details?.parameter_size && (
                    <DetailItem 
                      label="Parameters" 
                      value={details.details.parameter_size}
                      icon={Scale}
                    />
                  )}
                  {details.details?.quantization_level && (
                    <DetailItem 
                      label="Quantization" 
                      value={details.details.quantization_level}
                      icon={Gauge}
                    />
                  )}
                </div>
                {details.license && (
                  <div className="space-y-2">
                    <h4 className="font-mono text-sm text-muted-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {t('modelDetails.license')}
                    </h4>
                    <CodeBlock>{details.license}</CodeBlock>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="system">
                <CodeBlock>{details.system || t('common.unknown')}</CodeBlock>
              </TabsContent>

              <TabsContent value="template">
                <CodeBlock>{details.template || t('common.unknown')}</CodeBlock>
              </TabsContent>

              <TabsContent value="parameters">
                <CodeBlock>{details.parameters || t('common.unknown')}</CodeBlock>
              </TabsContent>

              <TabsContent value="modelfile">
                <CodeBlock>{details.modelfile || t('common.unknown')}</CodeBlock>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
