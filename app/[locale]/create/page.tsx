'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowLeft, Code, FormInput } from 'lucide-react';
import { useTranslation } from '@/components/I18nProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useModelsWithState } from '@/hooks/useModels';
import { parseModelfile } from '@/lib/modelfile-parser';
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

export default function CreateModelPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate } = useModelsWithState();
  const [mode, setMode] = useState<'fields' | 'modelfile'>('fields');
  
  // Fields mode
  const [from, setFrom] = useState('');
  const [modelName, setModelName] = useState('');
  const [system, setSystem] = useState('');
  const [template, setTemplate] = useState('');
  const [parameters, setParameters] = useState('');
  
  // Modelfile mode
  const [modelfile, setModelfile] = useState('');

  const [creating, setCreating] = useState(false);

  const handleCreateFromFields = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const toastId = showToast.loading(t('create.creating'));

    try {
      const params: Record<string, string | number | boolean> = {};
      if (parameters) {
        parameters.split('\n').forEach((line) => {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            const value = valueParts.join(':').trim();
            if (value === 'true') params[key.trim()] = true;
            else if (value === 'false') params[key.trim()] = false;
            else if (!isNaN(Number(value))) params[key.trim()] = Number(value);
            else params[key.trim()] = value;
          }
        });
      }

      const payload: any = {
        model: modelName,
        stream: false,
      };

      if (from) payload.from = from;
      if (system) payload.system = system;
      if (template) payload.template = template;
      if (Object.keys(params).length > 0) payload.parameters = params;

      const response = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create model');
      }

      showToast.dismiss(toastId);
      showToast.success(t('create.success'), `${modelName} created successfully`);
      mutate();
      
      setTimeout(() => {
        const locale = window.location.pathname.split('/')[1] || 'en';
        router.push(`/${locale}`);
      }, 1500);
    } catch (err: any) {
      showToast.dismiss(toastId);
      showToast.error(t('create.error'), err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateFromModelfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const toastId = showToast.loading(t('create.creating'));

    try {
      const parsed = parseModelfile(modelfile);
      
      if (parsed.errors && parsed.errors.length > 0) {
        throw new Error(`Modelfile errors: ${parsed.errors.join(', ')}`);
      }

      const finalModelName = parsed.model || modelName;
      if (!finalModelName) {
        throw new Error('Model name is required');
      }

      const response = await fetch('/api/create-from-modelfile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelfile,
          model: finalModelName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create model from Modelfile');
      }

      showToast.dismiss(toastId);
      showToast.success(t('create.success'), `${finalModelName} created successfully`);
      mutate();
      
      setTimeout(() => {
        const locale = window.location.pathname.split('/')[1] || 'en';
        router.push(`/${locale}`);
      }, 1500);
    } catch (err: any) {
      showToast.dismiss(toastId);
      showToast.error(t('create.error'), err.message);
    } finally {
      setCreating(false);
    }
  };

  const inputClassName = "font-mono bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-8"
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
            {t('create.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('create.description')}</p>
        </div>
      </motion.div>

      {/* Form Card */}
      <motion.div variants={itemVariants}>
        <Card className="terminal-card overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              <CardTitle className="font-mono">{t('create.title')}</CardTitle>
            </div>
            <CardDescription className="font-mono text-xs">
              {t('create.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'fields' | 'modelfile')}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                <TabsTrigger value="fields" className="font-mono gap-2">
                  <FormInput className="h-4 w-4" />
                  {t('create.fromFields')}
                </TabsTrigger>
                <TabsTrigger value="modelfile" className="font-mono gap-2">
                  <Code className="h-4 w-4" />
                  {t('create.fromModelfile')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="fields">
                <form onSubmit={handleCreateFromFields} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="from" className="font-mono text-sm">
                        {t('create.baseModel')}
                      </Label>
                      <Input
                        id="from"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        placeholder={t('create.baseModelPlaceholder')}
                        className={inputClassName}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modelName" className="font-mono text-sm">
                        {t('create.modelName')} *
                      </Label>
                      <Input
                        id="modelName"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        placeholder={t('create.modelNamePlaceholder')}
                        required
                        disabled={creating}
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="system" className="font-mono text-sm">
                      {t('create.systemPrompt')}
                    </Label>
                    <Textarea
                      id="system"
                      value={system}
                      onChange={(e) => setSystem(e.target.value)}
                      placeholder={t('create.systemPromptPlaceholder')}
                      rows={4}
                      disabled={creating}
                      className={inputClassName}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template" className="font-mono text-sm">
                      {t('create.template')}
                    </Label>
                    <Textarea
                      id="template"
                      value={template}
                      onChange={(e) => setTemplate(e.target.value)}
                      placeholder={t('create.templatePlaceholder')}
                      rows={4}
                      disabled={creating}
                      className={inputClassName}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parameters" className="font-mono text-sm">
                      {t('create.parameters')}
                    </Label>
                    <Textarea
                      id="parameters"
                      value={parameters}
                      onChange={(e) => setParameters(e.target.value)}
                      placeholder={t('create.parametersPlaceholder')}
                      rows={3}
                      disabled={creating}
                      className={inputClassName}
                    />
                    <p className="text-xs text-muted-foreground font-mono">
                      Format: key: value (one per line)
                    </p>
                  </div>

                  <div className="flex gap-3 rtl:flex-row-reverse pt-2">
                    <Button 
                      type="submit" 
                      disabled={creating || !modelName}
                      className="font-mono glow-sm hover:glow-md transition-shadow"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {creating ? t('create.creating') : t('create.create')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={creating}
                      className="font-mono"
                    >
                      {t('create.cancel')}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="modelfile">
                <form onSubmit={handleCreateFromModelfile} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="modelfileModelName" className="font-mono text-sm">
                      {t('create.modelName')} *
                    </Label>
                    <Input
                      id="modelfileModelName"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder={t('create.modelNamePlaceholder')}
                      required
                      disabled={creating}
                      className={inputClassName}
                    />
                    <p className="text-xs text-muted-foreground font-mono">
                      Required if MODEL directive is not in Modelfile
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modelfile" className="font-mono text-sm">
                      {t('create.modelfile')}
                    </Label>
                    <Textarea
                      id="modelfile"
                      value={modelfile}
                      onChange={(e) => setModelfile(e.target.value)}
                      placeholder={t('create.modelfilePlaceholder')}
                      rows={14}
                      disabled={creating}
                      className={`${inputClassName} font-mono text-sm`}
                    />
                  </div>

                  <div className="flex gap-3 rtl:flex-row-reverse pt-2">
                    <Button 
                      type="submit" 
                      disabled={creating || !modelfile || !modelName}
                      className="font-mono glow-sm hover:glow-md transition-shadow"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {creating ? t('create.creating') : t('create.create')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={creating}
                      className="font-mono"
                    >
                      {t('create.cancel')}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
