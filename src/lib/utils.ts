import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Build a deterministic placeholder avatar URL for a given display name.
 * Falls back to NearFix brand colours when no overrides are provided.
 */
export function avatarUrl(
  name: string,
  opts: { size?: number; background?: string; color?: string } = {}
): string {
  const { size = 400, background = '1a1a1a', color = 'FF6B00' } = opts;
  const params = new URLSearchParams({
    name,
    background,
    color,
    size: String(size),
    bold: 'true',
  });
  return `https://ui-avatars.com/api/?${params.toString()}`;
}
