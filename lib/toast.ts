import { toast as sonnerToast } from 'sonner';

/**
 * Toast utility functions with terminal-styled notifications
 */
export const toast = {
  /**
   * Success notification
   */
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      className: 'font-mono',
    });
  },

  /**
   * Error notification
   */
  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      className: 'font-mono',
    });
  },

  /**
   * Loading notification - returns dismiss function
   */
  loading: (message: string) => {
    return sonnerToast.loading(message, {
      className: 'font-mono',
    });
  },

  /**
   * Promise-based notification
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },

  /**
   * Info notification
   */
  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      className: 'font-mono',
    });
  },

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};

// Alias for backward compatibility
export const showToast = toast;

