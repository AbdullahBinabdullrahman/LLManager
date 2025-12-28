'use client';

import { motion } from 'framer-motion';
import { ModelsTable } from '@/components/ModelsTable';
import { RunningModelsTable } from '@/components/RunningModelsTable';
import { StatsCards } from '@/components/StatsCards';
import { StatsCharts } from '@/components/StatsCharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/components/I18nProvider';
import { useModelsWithState } from '@/hooks/useModels';
import { Button } from '@/components/ui/button';
import { MessageCircle, Download, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export default function HomePage() {
  const { t } = useTranslation();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { models, isLoading } = useModelsWithState();

  const totalDiskUsage = models.reduce((acc, model) => acc + model.size, 0);
  const runningModels = models.filter((m) => m.loaded);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-mono font-bold gradient-text">
            {t('models.title')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('app.description')}</p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Link href={`/${locale}/pull`}>
            <Button variant="outline" size="sm" className="font-mono">
              <Download className="h-4 w-4 mr-2" />
              {t('nav.pull')}
            </Button>
          </Link>
          <Link href={`/${locale}/create`}>
            <Button variant="outline" size="sm" className="font-mono">
              <Plus className="h-4 w-4 mr-2" />
              {t('nav.create')}
            </Button>
          </Link>
          {runningModels.length > 0 && (
            <Link href={`/${locale}/chat?model=${encodeURIComponent(runningModels[0].name)}`}>
              <Button size="sm" className="bg-accent hover:bg-accent/90 font-mono">
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('nav.chat')}
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants}>
        <StatsCards
          totalModels={models.length}
          runningModels={runningModels.length}
          totalDiskUsage={totalDiskUsage}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={itemVariants}>
        <StatsCharts />
      </motion.div>

      {/* Tables Grid */}
      <motion.div
        variants={itemVariants}
        className="grid gap-6 lg:grid-cols-2"
      >
        <Card className="terminal-card overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <CardTitle className="font-mono">{t('models.installed')}</CardTitle>
            </div>
            <CardDescription className="font-mono text-xs">
              {models.length} {t('models.title').toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ModelsTable models={models} isLoading={isLoading} />
          </CardContent>
        </Card>

        <Card className="terminal-card overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <CardTitle className="font-mono">{t('models.running')}</CardTitle>
            </div>
            <CardDescription className="font-mono text-xs">
              {runningModels.length} {t('models.loaded').toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <RunningModelsTable models={runningModels} isLoading={isLoading} />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
