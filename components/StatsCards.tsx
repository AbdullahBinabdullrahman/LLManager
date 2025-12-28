'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Box, 
  HardDrive, 
  Activity, 
  Cpu,
  TrendingUp
} from 'lucide-react';
import { useTranslation } from './I18nProvider';
import { formatBytes } from '@/lib/utils';
import { StatCardSkeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  totalModels: number;
  runningModels: number;
  totalDiskUsage: number;
  isLoading?: boolean;
}

/**
 * Animated counter hook for number animations
 */
function useAnimatedCounter(end: number, duration: number = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  delay?: number;
  variant?: 'default' | 'primary' | 'accent';
}

/**
 * Individual stat card with animation
 */
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  delay = 0,
  variant = 'default' 
}: StatCardProps) {
  const variantStyles = {
    default: 'border-border/50 hover:border-border',
    primary: 'border-primary/30 hover:border-primary/50 hover:glow-sm',
    accent: 'border-accent/30 hover:border-accent/50 hover:shadow-glow-accent',
  };

  const iconStyles = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/15 text-primary',
    accent: 'bg-accent/15 text-accent',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        'p-6 rounded-lg border bg-card/50 backdrop-blur-sm transition-all duration-300',
        'terminal-card',
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.2 }}
            className={cn(
              'text-3xl font-mono font-bold tracking-tight',
              variant === 'primary' && 'text-primary text-glow',
              variant === 'accent' && 'text-accent text-glow-accent'
            )}
          >
            {value}
          </motion.p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: delay + 0.1, type: 'spring' }}
          className={cn(
            'p-3 rounded-lg',
            iconStyles[variant]
          )}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * Stats cards grid for dashboard overview
 */
export function StatsCards({ 
  totalModels, 
  runningModels, 
  totalDiskUsage, 
  isLoading 
}: StatsCardsProps) {
  const { t } = useTranslation();
  const animatedTotal = useAnimatedCounter(totalModels);
  const animatedRunning = useAnimatedCounter(runningModels);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const utilizationPercent = totalModels > 0 
    ? Math.round((runningModels / totalModels) * 100) 
    : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t('models.installed')}
        value={animatedTotal}
        subtitle={`${totalModels} ${t('models.title').toLowerCase()}`}
        icon={Box}
        delay={0}
        variant="primary"
      />
      
      <StatCard
        title={t('models.running')}
        value={animatedRunning}
        subtitle={t('models.loaded').toLowerCase()}
        icon={Activity}
        delay={0.1}
        variant="accent"
      />
      
      <StatCard
        title={t('models.diskUsage')}
        value={formatBytes(totalDiskUsage)}
        subtitle={`${totalModels} ${t('models.title').toLowerCase()}`}
        icon={HardDrive}
        delay={0.2}
      />
      
      <StatCard
        title="Utilization"
        value={`${utilizationPercent}%`}
        subtitle={`${runningModels} of ${totalModels} active`}
        icon={TrendingUp}
        delay={0.3}
      />
    </div>
  );
}

