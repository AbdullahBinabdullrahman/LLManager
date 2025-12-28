import useSWR from 'swr';
import { OllamaModel, OllamaRunningModel, ModelWithState } from '@/types/ollama';
import { bytesToGB, getTimeUntilExpiry } from '@/lib/utils';

const STORAGE_KEY = 'ollama-dashboard-settings';

// Fetcher that includes the custom API URL header
const fetcher = (url: string) => {
  const headers: HeadersInit = {};
  
  // Get custom API URL from localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        if (settings.apiUrl) {
          headers['x-ollama-api-url'] = settings.apiUrl;
        }
      }
    } catch {
      // Use default
    }
  }
  
  return fetch(url, { headers }).then((res) => res.json());
};

/**
 * Fetch installed models
 */
export function useInstalledModels() {
  const { data, error, isLoading, mutate } = useSWR<{ models: OllamaModel[] }>(
    '/api/models',
    fetcher,
    {
      refreshInterval: 10000, // Refresh every 10 seconds
    }
  );

  return {
    models: data?.models || [],
    error,
    isLoading,
    mutate,
  };
}

/**
 * Fetch running models
 */
export function useRunningModels() {
  const { data, error, isLoading, mutate } = useSWR<{ models: OllamaRunningModel[] }>(
    '/api/running',
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
    }
  );

  return {
    models: data?.models || [],
    error,
    isLoading,
    mutate,
  };
}

/**
 * Combine installed and running models with state
 */
export function useModelsWithState() {
  const { models: installed, isLoading: installedLoading, mutate: mutateInstalled } = useInstalledModels();
  const { models: running, isLoading: runningLoading, mutate: mutateRunning } = useRunningModels();

  const isLoading = installedLoading || runningLoading;

  // Create a map of running models by name
  const runningMap = new Map<string, OllamaRunningModel>();
  running.forEach((model) => {
    runningMap.set(model.model, model);
  });

  // Combine models
  const modelsWithState: ModelWithState[] = installed.map((model) => {
    const runningModel = runningMap.get(model.name);
    const expiresIn = runningModel?.expires_at
      ? getTimeUntilExpiry(runningModel.expires_at)
      : null;

    return {
      ...model,
      disk_gb: bytesToGB(model.size),
      loaded: !!runningModel,
      running: runningModel,
      vram_gb: runningModel ? bytesToGB(runningModel.size_vram) : undefined,
      ram_gb: runningModel ? bytesToGB(runningModel.size) : undefined,
      expires_at: runningModel?.expires_at,
      expires_in_seconds: expiresIn,
    };
  });

  // Combined mutate function
  const mutate = async () => {
    await Promise.all([mutateInstalled(), mutateRunning()]);
  };

  return {
    models: modelsWithState,
    isLoading,
    mutate,
  };
}
