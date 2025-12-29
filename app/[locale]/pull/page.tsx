"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Box,
  FileCode,
  ChevronDown,
  ChevronUp,
  Server,
  Image as ImageIcon,
  Eye,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/components/I18nProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDownloadManager } from "@/hooks/useDownloadManager";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type ModelSource = "ollama" | "huggingface" | "gguf" | "custom" | "hf-dataset";

interface SourceConfig {
  id: ModelSource;
  icon: React.ReactNode;
  labelKey: string;
  descriptionKey: string;
  placeholder: string;
  examples: string[];
  link: string;
  linkLabel: string;
  hasCustomRegistry?: boolean;
  isImageSource?: boolean;
}

interface ImagePreview {
  url: string;
  filename: string;
  contentType: string;
  size?: number;
}

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

const sourcesConfig: SourceConfig[] = [
  {
    id: "ollama",
    icon: <Box className="w-5 h-5" />,
    labelKey: "pull.sources.ollama.label",
    descriptionKey: "pull.sources.ollama.description",
    placeholder: "llama3.2, mistral, codellama:7b",
    examples: [
      "llama3.2",
      "mistral",
      "codellama:7b",
      "deepseek-r1:8b",
      "qwen2.5:14b",
    ],
    link: "https://ollama.com/library",
    linkLabel: "ollama.com/library",
  },
  {
    id: "huggingface",
    icon: <Sparkles className="w-5 h-5" />,
    labelKey: "pull.sources.huggingface.label",
    descriptionKey: "pull.sources.huggingface.description",
    placeholder: "hf.co/username/model-name-GGUF",
    examples: [
      "hf.co/TheBloke/Llama-2-7B-GGUF",
      "hf.co/bartowski/Llama-3.2-3B-Instruct-GGUF",
      "hf.co/Qwen/Qwen2.5-7B-Instruct-GGUF",
    ],
    link: "https://huggingface.co/models?library=gguf",
    linkLabel: "huggingface.co/models",
  },
  {
    id: "gguf",
    icon: <FileCode className="w-5 h-5" />,
    labelKey: "pull.sources.gguf.label",
    descriptionKey: "pull.sources.gguf.description",
    placeholder: "hf.co/user/repo/file.gguf",
    examples: [
      "hf.co/TheBloke/Llama-2-7B-GGUF:Q4_K_M",
      "hf.co/bartowski/Qwen2.5-7B-Instruct-GGUF:Q5_K_M",
    ],
    link: "https://huggingface.co/docs/hub/gguf",
    linkLabel: "GGUF Format Docs",
  },
  {
    id: "custom",
    icon: <Server className="w-5 h-5" />,
    labelKey: "pull.sources.custom.label",
    descriptionKey: "pull.sources.custom.description",
    placeholder: "registry.example.com/model:tag",
    examples: [
      "model.ssa.sa/qwen3-coder:30b",
      "model.ssa.sa/deepseek-r1:latest",
    ],
    link: "",
    linkLabel: "",
    hasCustomRegistry: true,
  },
  {
    id: "hf-dataset",
    icon: <ImageIcon className="w-5 h-5" />,
    labelKey: "pull.sources.hfDataset.label",
    descriptionKey: "pull.sources.hfDataset.description",
    placeholder: "org/dataset-name",
    examples: [
      "diffusers/dog-example",
      "huggingface/documentation-images",
      "hf-internal-testing/diffusers-images",
    ],
    link: "https://huggingface.co/datasets",
    linkLabel: "huggingface.co/datasets",
    isImageSource: true,
  },
];

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PullModelPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { startDownload, isDownloading } = useDownloadManager();
  const [modelName, setModelName] = useState("");
  const [selectedSource, setSelectedSource] = useState<ModelSource>("ollama");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // HF Dataset specific state
  const [datasetPath, setDatasetPath] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const currentSource =
    sourcesConfig.find((s) => s.id === selectedSource) || sourcesConfig[0];

  // Check if this model is currently being downloaded
  const pulling = isDownloading(modelName);

  const handleSelectExample = (example: string) => {
    if (currentSource.isImageSource) {
      setDatasetPath(example);
    } else {
      setModelName(example);
    }
  };

  const handleSourceChange = (sourceId: ModelSource) => {
    setSelectedSource(sourceId);
    // Reset image-specific state when switching sources
    if (sourceId !== "hf-dataset") {
      setDatasetPath("");
      setImagePath("");
      setImagePreview(null);
      setPreviewError(null);
    }
  };

  const handlePreview = async () => {
    if (!datasetPath || !imagePath) return;

    setPreviewing(true);
    setPreviewError(null);
    setImagePreview(null);

    try {
      const response = await fetch("/api/hf-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset: datasetPath,
          imagePath: imagePath,
          action: "preview",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load preview");
      }

      setImagePreview({
        url: data.url,
        filename: data.filename,
        contentType: data.contentType,
        size: data.size,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load preview";
      setPreviewError(message);
      showToast.error(t("pull.previewError"), message);
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!datasetPath || !imagePath) return;

    setDownloading(true);
    const toastId = showToast.loading(t("pull.downloading"));

    try {
      const response = await fetch("/api/hf-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset: datasetPath,
          imagePath: imagePath,
          action: "download",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to download image");
      }

      showToast.dismiss(toastId);
      showToast.success(
        t("pull.downloadSuccess"),
        `${t("pull.savedTo")}: ${data.savedPath}`
      );

      // Reset form after successful download
      setImagePreview(null);
    } catch (err: unknown) {
      showToast.dismiss(toastId);
      const message =
        err instanceof Error ? err.message : "Failed to download image";
      showToast.error(t("pull.downloadError"), message);
    } finally {
      setDownloading(false);
    }
  };

  const handlePull = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!modelName.trim()) {
      showToast.error(t("pull.error"), "Please enter a model name");
      return;
    }

    // Check if this model is already being downloaded
    if (isDownloading(modelName)) {
      showToast.info(t("downloads.alreadyDownloading"));
      return;
    }

    // Start the background download
    startDownload(modelName);

    // Show notification that download has started
    showToast.success(
      t("downloads.startDownload"),
      t("downloads.downloadInBackground")
    );

    // Clear the input
    setModelName("");
  };

  const isHFDatasetSource = selectedSource === "hf-dataset";

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
            {t("pull.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("pull.description")}</p>
        </div>
      </motion.div>

      {/* Model Source Selection */}
      <motion.div variants={itemVariants}>
        <Card className="terminal-card overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="font-mono text-sm">
              {t("pull.selectSource") || "Select Model Source"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {sourcesConfig.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => handleSourceChange(source.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200",
                    "hover:border-primary/50 hover:bg-primary/5",
                    selectedSource === source.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 bg-muted/20 text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-full",
                      selectedSource === source.id
                        ? "bg-primary/20"
                        : "bg-muted/30"
                    )}
                  >
                    {source.icon}
                  </div>
                  <span className="font-mono text-xs sm:text-sm font-medium text-center">
                    {t(source.labelKey) || source.id}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Form Card */}
      <motion.div variants={itemVariants}>
        <Card className="terminal-card overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              {currentSource.icon}
              <CardTitle className="font-mono">
                {t(currentSource.labelKey) || currentSource.id}
              </CardTitle>
            </div>
            <CardDescription className="font-mono text-xs">
              {t(currentSource.descriptionKey) || currentSource.placeholder}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isHFDatasetSource ? (
              /* HF Dataset Image Form */
              <div className="space-y-6">
                {/* Dataset Path */}
                <div className="space-y-2">
                  <Label htmlFor="datasetPath" className="font-mono text-sm">
                    {t("pull.datasetPath")}
                  </Label>
                  <Input
                    id="datasetPath"
                    value={datasetPath}
                    onChange={(e) => setDatasetPath(e.target.value)}
                    placeholder={t("pull.datasetPathPlaceholder")}
                    disabled={previewing || downloading}
                    className="font-mono bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground font-mono">
                    {t("pull.datasetPathHint")}
                  </p>
                </div>

                {/* Image Path */}
                <div className="space-y-2">
                  <Label htmlFor="imagePath" className="font-mono text-sm">
                    {t("pull.imagePath")}
                  </Label>
                  <Input
                    id="imagePath"
                    value={imagePath}
                    onChange={(e) => setImagePath(e.target.value)}
                    placeholder={t("pull.imagePathPlaceholder")}
                    disabled={previewing || downloading}
                    className="font-mono bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground font-mono">
                    {t("pull.imagePathHint")}
                  </p>
                </div>

                {/* Quick Examples */}
                <div className="space-y-2">
                  <Label className="font-mono text-sm text-muted-foreground">
                    {t("pull.hfDatasetExamples")}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {currentSource.examples.map((example) => (
                      <Button
                        key={example}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectExample(example)}
                        disabled={previewing || downloading}
                        className={cn(
                          "font-mono text-xs",
                          datasetPath === example &&
                            "border-primary bg-primary/10 text-primary"
                        )}
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Browse Link */}
                <p className="text-xs text-muted-foreground font-mono">
                  {t("pull.browseDatasets")}{" "}
                  <a
                    href={currentSource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {currentSource.linkLabel}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>

                {/* Image Preview */}
                <AnimatePresence mode="wait">
                  {imagePreview && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Image */}
                          <div className="flex-shrink-0">
                            <div className="relative w-full sm:w-48 h-48 rounded-lg overflow-hidden bg-background/50 border border-border/30">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imagePreview.url}
                                alt={imagePreview.filename}
                                className="w-full h-full object-contain"
                                onError={() => {
                                  setPreviewError("Failed to load image");
                                  setImagePreview(null);
                                }}
                              />
                            </div>
                          </div>

                          {/* Image Details */}
                          <div className="flex-1 space-y-3">
                            <h4 className="font-mono text-sm font-medium text-foreground truncate">
                              {imagePreview.filename}
                            </h4>
                            <div className="space-y-1 text-xs font-mono text-muted-foreground">
                              <p>
                                <span className="text-foreground/70">
                                  {t("pull.imageType")}:
                                </span>{" "}
                                {imagePreview.contentType}
                              </p>
                              {imagePreview.size && (
                                <p>
                                  <span className="text-foreground/70">
                                    {t("pull.imageSize")}:
                                  </span>{" "}
                                  {formatFileSize(imagePreview.size)}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-xs text-green-500 font-mono">
                                Ready to download
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {previewError && !imagePreview && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 rounded-lg bg-destructive/10 border border-destructive/30"
                    >
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-destructive" />
                        <span className="text-sm text-destructive font-mono">
                          {previewError}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex gap-3 rtl:flex-row-reverse">
                  <Button
                    type="button"
                    onClick={handlePreview}
                    disabled={
                      previewing || downloading || !datasetPath || !imagePath
                    }
                    variant={imagePreview ? "outline" : "default"}
                    className="font-mono"
                  >
                    {previewing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    {previewing ? t("pull.previewing") : t("pull.preview")}
                  </Button>

                  {imagePreview && (
                    <Button
                      type="button"
                      onClick={handleDownloadImage}
                      disabled={downloading}
                      className="font-mono glow-sm hover:glow-md transition-shadow"
                    >
                      {downloading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {downloading ? t("pull.downloading") : t("pull.download")}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={previewing || downloading}
                    className="font-mono"
                  >
                    {t("pull.cancel")}
                  </Button>
                </div>

                {/* Advanced Options */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showAdvanced ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    {t("pull.advancedOptions") || "Advanced Options"}
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 rounded-lg bg-muted/20 border border-border/50 space-y-4">
                          <div className="space-y-2">
                            <h4 className="text-xs font-mono font-medium text-foreground">
                              {t("pull.hfDatasetFormat")}
                            </h4>
                            <div className="text-xs font-mono text-muted-foreground space-y-1">
                              <p>
                                <code className="bg-primary/10 px-1 rounded">
                                  org/dataset-name
                                </code>{" "}
                                - Dataset repository path
                              </p>
                              <p>
                                <code className="bg-primary/10 px-1 rounded">
                                  images/sample.png
                                </code>{" "}
                                - Path to image within dataset
                              </p>
                              <p>
                                <code className="bg-primary/10 px-1 rounded">
                                  data/train/000001.jpg
                                </code>{" "}
                                - Nested image path
                              </p>
                            </div>
                            <div className="mt-3 p-2 bg-accent/10 rounded border border-accent/20">
                              <p className="text-xs text-accent">
                                Images are downloaded to{" "}
                                <code className="bg-background/50 px-1 rounded">
                                  public/downloads/hf-images/
                                </code>
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              /* Model Pull Form */
              <form onSubmit={handlePull} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="modelName" className="font-mono text-sm">
                    {t("pull.modelName")}
                  </Label>
                  <Input
                    id="modelName"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder={currentSource.placeholder}
                    required
                    disabled={pulling}
                    className="font-mono bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
                  />
                  {currentSource.link && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {t("pull.browseModels") || "Browse models at"}{" "}
                      <a
                        href={currentSource.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {currentSource.linkLabel}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  )}
                </div>

                {/* Quick Examples */}
                <div className="space-y-2">
                  <Label className="font-mono text-sm text-muted-foreground">
                    {t("pull.quickSelect") || "Quick Select"}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {currentSource.examples.map((example) => (
                      <Button
                        key={example}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectExample(example)}
                        disabled={pulling}
                        className={cn(
                          "font-mono text-xs",
                          modelName === example &&
                            "border-primary bg-primary/10 text-primary"
                        )}
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showAdvanced ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    {t("pull.advancedOptions") || "Advanced Options"}
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 rounded-lg bg-muted/20 border border-border/50 space-y-4">
                          {/* HuggingFace Format Info */}
                          {selectedSource === "huggingface" && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-mono font-medium text-foreground">
                                {t("pull.hfFormat") || "Hugging Face Format"}
                              </h4>
                              <div className="text-xs font-mono text-muted-foreground space-y-1">
                                <p>
                                  <code className="bg-primary/10 px-1 rounded">
                                    hf.co/username/repository
                                  </code>{" "}
                                  - {t("pull.hfLatest") || "Latest GGUF file"}
                                </p>
                                <p>
                                  <code className="bg-primary/10 px-1 rounded">
                                    hf.co/username/repository:quantization
                                  </code>{" "}
                                  -{" "}
                                  {t("pull.hfQuantized") ||
                                    "Specific quantization (Q4_K_M, Q5_K_M, etc.)"}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* GGUF Format Info */}
                          {selectedSource === "gguf" && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-mono font-medium text-foreground">
                                {t("pull.ggufFormat") ||
                                  "GGUF Quantization Options"}
                              </h4>
                              <div className="text-xs font-mono text-muted-foreground space-y-1">
                                <p>
                                  <code className="bg-primary/10 px-1 rounded">
                                    Q4_K_M
                                  </code>{" "}
                                  -{" "}
                                  {t("pull.q4km") ||
                                    "Good balance of quality and size"}
                                </p>
                                <p>
                                  <code className="bg-primary/10 px-1 rounded">
                                    Q5_K_M
                                  </code>{" "}
                                  -{" "}
                                  {t("pull.q5km") ||
                                    "Higher quality, larger size"}
                                </p>
                                <p>
                                  <code className="bg-primary/10 px-1 rounded">
                                    Q8_0
                                  </code>{" "}
                                  -{" "}
                                  {t("pull.q8") ||
                                    "Highest quality, largest size"}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Ollama Format Info */}
                          {selectedSource === "ollama" && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-mono font-medium text-foreground">
                                {t("pull.ollamaFormat") ||
                                  "Ollama Model Format"}
                              </h4>
                              <div className="text-xs font-mono text-muted-foreground space-y-1">
                                <p>
                                  <code className="bg-primary/10 px-1 rounded">
                                    modelname
                                  </code>{" "}
                                  -{" "}
                                  {t("pull.ollamaDefault") ||
                                    "Default/latest version"}
                                </p>
                                <p>
                                  <code className="bg-primary/10 px-1 rounded">
                                    modelname:tag
                                  </code>{" "}
                                  -{" "}
                                  {t("pull.ollamaTag") ||
                                    "Specific version (7b, 13b, etc.)"}
                                </p>
                                <p>
                                  <code className="bg-primary/10 px-1 rounded">
                                    namespace/modelname
                                  </code>{" "}
                                  -{" "}
                                  {t("pull.ollamaNamespace") ||
                                    "Community model"}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Custom Registry Format Info */}
                          {selectedSource === "custom" && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-mono font-medium text-foreground">
                                {t("pull.customFormat") ||
                                  "Custom Registry Format"}
                              </h4>
                              <div className="text-xs font-mono text-muted-foreground space-y-1">
                                <p>
                                  <code className="bg-primary/10 px-1 rounded">
                                    registry.domain/model
                                  </code>{" "}
                                  -{" "}
                                  {t("pull.customBasic") ||
                                    "Model from custom registry"}
                                </p>
                                <p>
                                  <code className="bg-primary/10 px-1 rounded">
                                    registry.domain/model:tag
                                  </code>{" "}
                                  -{" "}
                                  {t("pull.customTag") ||
                                    "Specific version/tag"}
                                </p>
                                <p>
                                  <code className="bg-primary/10 px-1 rounded">
                                    registry.domain/namespace/model
                                  </code>{" "}
                                  -{" "}
                                  {t("pull.customNamespace") ||
                                    "Model with namespace"}
                                </p>
                              </div>
                              <div className="mt-3 p-2 bg-accent/10 rounded border border-accent/20">
                                <p className="text-xs text-accent">
                                  {t("pull.customTip") ||
                                    "Your registry must be running Ollama and accessible from your network."}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-3 rtl:flex-row-reverse">
                  <Button
                    type="submit"
                    disabled={pulling || !modelName}
                    className="font-mono glow-sm hover:glow-md transition-shadow"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {pulling ? t("pull.pulling") : t("pull.pull")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={pulling}
                    className="font-mono"
                  >
                    {t("pull.cancel")}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
