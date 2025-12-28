/**
 * Ollama API types
 */

export interface OllamaModel {
  name: string;
  modified_at: string;
  digest?: string;
  size: number;
  details?: {
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface OllamaRunningModel {
  model: string;
  expires_at?: string;
  size: number; // RAM bytes
  size_vram: number; // VRAM bytes
  context_length?: number;
  digest?: string;
  details?: Record<string, unknown>;
}

export interface OllamaTagsResponse {
  models: OllamaModel[];
}

export interface OllamaPsResponse {
  models: OllamaRunningModel[];
}

export interface OllamaShowResponse {
  modelfile: string;
  parameters: string;
  template: string;
  system: string;
  details: {
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
    [key: string]: unknown;
  };
  license?: string;
  messages?: Array<{ role: string; content: string }>;
}

export interface OllamaPullRequest {
  model: string;
  stream?: boolean;
}

export interface OllamaCreateRequest {
  from?: string;
  model: string;
  system?: string;
  template?: string;
  parameters?: Record<string, string | number | boolean>;
  messages?: Array<{ role: string; content: string }>;
  license?: string;
  stream?: boolean;
  quantize?: string;
}

export interface OllamaDeleteRequest {
  model: string;
}

export interface ModelWithState extends OllamaModel {
  disk_gb: number;
  loaded: boolean;
  running?: OllamaRunningModel;
  vram_gb?: number;
  ram_gb?: number;
  expires_at?: string;
  expires_in_seconds?: number | null;
}
