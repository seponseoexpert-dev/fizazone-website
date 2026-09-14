import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImageSrc(image: unknown): string {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (typeof image === "object" && image !== null && "src" in (image as Record<string, unknown>)) {
    return String((image as { src: string }).src);
  }
  return String(image);
}
