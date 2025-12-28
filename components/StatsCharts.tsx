'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/components/I18nProvider';
import { useModelsWithState } from '@/hooks/useModels';
import { formatBytes } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Skeleton } from './ui/skeleton';

const COLORS = ['#22d3ee', '#00ff88', '#f472b6', '#facc15', '#fb923c', '#a78bfa'];

export function StatsCharts() {
  const { t } = useTranslation();
  const { models, isLoading } = useModelsWithState();

  // Prepare data for size distribution pie chart
  const sizeData = models.map((model, index) => ({
    name: model.name.split(':')[0],
    value: model.size,
    displayValue: formatBytes(model.size),
    color: COLORS[index % COLORS.length],
  }));

  // Prepare data for bar chart (top models by size)
  const barData = [...models]
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
    .map((model) => ({
      name: model.name.length > 12 ? model.name.slice(0, 12) + '...' : model.name,
      fullName: model.name,
      size: Math.round(model.size / (1024 * 1024 * 1024) * 100) / 100,
      vram: model.vram_gb || 0,
    }));

  // Status distribution
  const runningCount = models.filter((m) => m.loaded).length;
  const statusData = [
    { name: 'Running', value: runningCount, color: '#00ff88' },
    { name: 'Stopped', value: models.length - runningCount, color: '#64748b' },
  ].filter((d) => d.value > 0);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
          <p className="font-mono text-sm font-medium">{payload[0]?.payload?.fullName || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              {entry.name}: {entry.name === 'size' ? `${entry.value} GB` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (models.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Size Distribution Pie Chart */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t('stats.sizeDistribution') || 'Size Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sizeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, displayValue }) => `${name}: ${displayValue}`}
                    labelLine={false}
                  >
                    {sizeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-mono text-sm font-medium">{data.name}</p>
                            <p className="text-sm text-muted-foreground">{data.displayValue}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Model Status Chart */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              {t('stats.modelSizes') || 'Top Models by Size'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={80}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="size"
                    fill="#22d3ee"
                    radius={[0, 4, 4, 0]}
                    name="Size (GB)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Distribution */}
      {statusData.length > 1 && (
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {t('stats.statusDistribution') || 'Status Distribution'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-mono text-sm font-medium">{data.name}</p>
                              <p className="text-sm text-muted-foreground">{data.value} models</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span className="text-xs font-mono text-muted-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* VRAM Usage for Running Models */}
      {runningCount > 0 && (
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                {t('stats.vramUsage') || 'VRAM Usage (Running)'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={models
                      .filter((m) => m.loaded)
                      .map((m) => ({
                        name: m.name.length > 12 ? m.name.slice(0, 12) + '...' : m.name,
                        fullName: m.name,
                        vram: m.vram_gb || 0,
                        ram: m.ram_gb || 0,
                      }))}
                    layout="vertical"
                    margin={{ left: 0, right: 20 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={80}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={30}
                      formatter={(value) => (
                        <span className="text-xs font-mono text-muted-foreground">{value}</span>
                      )}
                    />
                    <Bar dataKey="vram" fill="#f472b6" radius={[0, 4, 4, 0]} name="VRAM (GB)" />
                    <Bar dataKey="ram" fill="#22d3ee" radius={[0, 4, 4, 0]} name="RAM (GB)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

