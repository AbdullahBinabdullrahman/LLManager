'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/I18nProvider';
import { useSettings } from '@/hooks/useSettings';
import { toast } from '@/lib/toast';
import { ArrowLeft, Settings, Server, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { settings, updateSettings, isLoading } = useSettings();

  const [apiUrl, setApiUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!isLoading) {
      setApiUrl(settings.apiUrl);
    }
  }, [settings.apiUrl, isLoading]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus('idle');

    try {
      // Test the connection by fetching the tags endpoint
      const response = await fetch(`${apiUrl}/tags`);
      if (response.ok) {
        setConnectionStatus('success');
        toast.success(t('settings.connectionSuccess') || 'Connection successful!');
      } else {
        throw new Error('Failed to connect');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error(t('settings.connectionError') || 'Connection failed', 'Check the API URL and ensure Ollama is running');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    updateSettings({ apiUrl });
    toast.success(t('settings.saved') || 'Settings saved');

    // Reload the page to apply new settings to all API calls
    window.location.reload();
  };

  const handleReset = () => {
    const defaultUrl = process.env.NEXT_PUBLIC_OLLAMA_API_URL || 'http://localhost:11434/api';
    setApiUrl(defaultUrl);
    setConnectionStatus('idle');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            {t('settings.title') || 'Settings'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('settings.description') || 'Configure your Ollama Dashboard'}
          </p>
        </div>
      </div>

      {/* API Configuration Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="terminal-card">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              <CardTitle className="font-mono">{t('settings.apiConfiguration') || 'API Configuration'}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.apiConfigurationDescription') || 'Configure the Ollama API endpoint. Use this to connect to remote Ollama instances.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* API URL Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium font-mono">
                {t('settings.apiUrl') || 'API URL'}
              </label>
              <div className="flex gap-2">
                <Input
                  value={apiUrl}
                  onChange={(e) => {
                    setApiUrl(e.target.value);
                    setConnectionStatus('idle');
                  }}
                  placeholder="http://localhost:11434/api"
                  className="font-mono flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting || !apiUrl}
                  className="font-mono"
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t('settings.test') || 'Test'}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('settings.apiUrlHint') || 'Enter the full URL including /api (e.g., http://192.168.1.100:11434/api)'}
              </p>

              {/* Connection Status */}
              {connectionStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-2 p-3 rounded-md ${
                    connectionStatus === 'success'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {connectionStatus === 'success' ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-mono">{t('settings.connectionSuccess') || 'Connection successful!'}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-mono">{t('settings.connectionFailed') || 'Connection failed'}</span>
                    </>
                  )}
                </motion.div>
              )}
            </div>

            {/* Quick Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium font-mono text-muted-foreground">
                {t('settings.commonUrls') || 'Quick Select'}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { url: 'http://localhost:11434/api', label: 'localhost:11434' },
                  { url: 'http://127.0.0.1:11434/api', label: '127.0.0.1:11434' },
                  { url: 'http://host.docker.internal:11434/api', label: 'host.docker.internal' },
                  { url: 'https://model.ssa.sa/api', label: 'model.ssa.sa (SSA)' },
                ].map(({ url, label }) => (
                  <Button
                    key={url}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setApiUrl(url);
                      setConnectionStatus('idle');
                    }}
                    className={`font-mono text-xs ${apiUrl === url ? 'border-primary text-primary' : ''}`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-border/50">
              <Button
                onClick={handleSave}
                disabled={apiUrl === settings.apiUrl}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-mono"
              >
                <Settings className="h-4 w-4 mr-2" />
                {t('common.save') || 'Save'}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="font-mono"
              >
                {t('settings.reset') || 'Reset to Default'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Configuration Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="terminal-card">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="font-mono text-sm">{t('settings.currentConfig') || 'Current Configuration'}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="font-mono text-sm space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">API URL</span>
                <code className="bg-muted/50 px-2 py-1 rounded text-xs">{settings.apiUrl}</code>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Environment Default</span>
                <code className="bg-muted/50 px-2 py-1 rounded text-xs">
                  {process.env.NEXT_PUBLIC_OLLAMA_API_URL || 'http://localhost:11434/api'}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

