'use client';

import { Suspense } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/components/I18nProvider';
import { useModelsWithState } from '@/hooks/useModels';
import { ChatInterface } from '@/components/ChatInterface';
import { ArrowLeft, MessageCircle, AlertCircle, Play, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from '@/lib/toast';
import { useSWRConfig } from 'swr';

function ChatPageContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';
  const modelFromUrl = searchParams.get('model');
  const { models, isLoading } = useModelsWithState();
  const { mutate } = useSWRConfig();

  const [selectedModel, setSelectedModel] = useState<string>(modelFromUrl || '');
  const [loadingModel, setLoadingModel] = useState(false);

  const runningModels = models.filter((m) => m.loaded);
  const currentModel = models.find((m) => m.name === selectedModel);
  const isModelRunning = currentModel?.loaded;

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    router.push(`/${locale}/chat?model=${encodeURIComponent(value)}`);
  };

  const handleLoadModel = async () => {
    if (!selectedModel) return;
    
    setLoadingModel(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: '',
          keep_alive: '10m',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load model');
      }

      toast.success(`Model ${selectedModel} loaded successfully`);
      mutate('/api/running');
    } catch (error: any) {
      toast.error(error.message || 'Failed to load model');
    } finally {
      setLoadingModel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}`}>
          <Button variant="ghost" size="icon" className="hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-mono text-primary">
            {t('chat.title') || 'Chat'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('chat.description') || 'Test your models with an interactive chat'}
          </p>
        </div>
      </div>

      {/* Model Selector Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <CardTitle className="font-mono">{t('chat.selectModel') || 'Select Model'}</CardTitle>
            </div>
            <CardDescription>
              {t('chat.selectModelDescription') || 'Choose a model to chat with. Running models are indicated.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  {t('chat.model') || 'Model'}
                </label>
                <Select value={selectedModel} onValueChange={handleModelChange}>
                  <SelectTrigger className="font-mono">
                    <SelectValue placeholder={t('chat.selectModelPlaceholder') || 'Select a model...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading models...
                      </SelectItem>
                    ) : models.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No models available
                      </SelectItem>
                    ) : (
                      models.map((model) => (
                        <SelectItem key={model.name} value={model.name} className="font-mono">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                model.loaded ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            />
                            {model.name}
                            {model.loaded && (
                              <span className="text-xs text-green-500 ml-1">(running)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedModel && !isModelRunning && (
                <Button
                  onClick={handleLoadModel}
                  disabled={loadingModel}
                  className="bg-accent hover:bg-accent/90"
                >
                  {loadingModel ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {t('chat.loadModel') || 'Load Model'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Chat Interface */}
      {selectedModel ? (
        isModelRunning ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <ChatInterface modelName={selectedModel} />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {t('chat.modelNotRunning') || 'Model Not Running'}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {t('chat.modelNotRunningDescription') ||
                      'The selected model is not currently running. Click "Load Model" above to start it.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {t('chat.noModelSelected') || 'No Model Selected'}
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {t('chat.noModelSelectedDescription') ||
                    'Select a model from the dropdown above to start chatting.'}
                </p>
                {runningModels.length > 0 && (
                  <p className="text-sm text-accent mt-4">
                    {runningModels.length} model(s) currently running
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}

