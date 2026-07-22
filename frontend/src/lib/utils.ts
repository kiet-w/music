import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_URL } from "@/lib/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_URL}${cleanPath}`;
}
