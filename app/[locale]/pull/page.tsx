'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/components/I18nProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useModelsWithState } from '@/hooks/useModels';
import { showToast } from '@/lib/toast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function PullModelPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate } = useModelsWithState();
  const [modelName, setModelName] = useState('');
  const [pulling, setPulling] = useState(false);

  const handlePull = async (e: React.FormEvent) => {
    e.preventDefault();
    setPulling(true);

    const toastId = showToast.loading(t('pull.pulling'));

    try {
      const response = await fetch('/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName, stream: false }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to pull model');
      }

      showToast.dismiss(toastId);
      showToast.success(t('pull.success'), `${modelName} is now available`);
      mutate();
      
      setTimeout(() => {
        const locale = window.location.pathname.split('/')[1] || 'en';
        router.push(`/${locale}`);
      }, 1500);
    } catch (err: any) {
      showToast.dismiss(toastId);
      showToast.error(t('pull.error'), err.message);
    } finally {
      setPulling(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-mono font-bold gradient-text">
            {t('pull.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('pull.description')}</p>
        </div>
      </motion.div>

      {/* Form Card */}
      <motion.div variants={itemVariants}>
        <Card className="terminal-card overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <CardTitle className="font-mono">{t('pull.title')}</CardTitle>
            </div>
            <CardDescription className="font-mono text-xs">
              {t('pull.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handlePull} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="modelName" className="font-mono text-sm">
                  {t('pull.modelName')}
                </Label>
                <Input
                  id="modelName"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder={t('pull.modelNamePlaceholder')}
                  required
                  disabled={pulling}
                  className="font-mono bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground font-mono">
                  Browse models at{' '}
                  <a 
                    href="https://ollama.com/library" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    ollama.com/library
                  </a>
                </p>
              </div>

              <div className="flex gap-3 rtl:flex-row-reverse">
                <Button 
                  type="submit" 
                  disabled={pulling || !modelName}
                  className="font-mono glow-sm hover:glow-md transition-shadow"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {pulling ? t('pull.pulling') : t('pull.pull')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={pulling}
                  className="font-mono"
                >
                  {t('pull.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
