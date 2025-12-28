import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert bytes to GB
 * @param bytes - Number of bytes
 * @returns Formatted GB string
 */
export function bytesToGB(bytes: number): number {
  return round(bytes / (1024 ** 3), 3);
}

/**
 * Convert bytes to MB
 * @param bytes - Number of bytes
 * @returns Formatted MB string
 */
export function bytesToMB(bytes: number): number {
  return round(bytes / (1024 ** 2), 2);
}

/**
 * Format bytes to human-readable string
 * @param bytes - Number of bytes
 * @returns Formatted string (GB, MB, or bytes)
 */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) {
    return `${bytesToGB(bytes).toFixed(2)} GB`;
  }
  if (bytes >= 1024 ** 2) {
    return `${bytesToMB(bytes).toFixed(2)} MB`;
  }
  return `${bytes} bytes`;
}

/**
 * Round a number to specified decimal places
 * @param num - Number to round
 * @param decimals - Number of decimal places
 * @returns Rounded number
 */
export function round(num: number, decimals: number = 2): number {
  return Math.round(num * (10 ** decimals)) / (10 ** decimals);
}

/**
 * Calculate time until expiration
 * @param expiresAt - Expiration timestamp
 * @returns Time remaining in seconds, or null if expired
 */
export function getTimeUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = Math.floor((expiry - now) / 1000);
  return diff > 0 ? diff : null;
}

/**
 * Format time remaining as human-readable string
 * @param seconds - Seconds remaining
 * @returns Formatted string
 */
export function formatTimeRemaining(seconds: number | null): string {
  if (seconds === null) return 'Never';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
