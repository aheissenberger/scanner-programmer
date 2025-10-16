import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function replaceSpecialChars(input: string): string {
  return input.replaceAll('{FNC3}', '\xC9')
}