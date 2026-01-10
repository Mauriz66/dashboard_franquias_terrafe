import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseDate(value: string | number | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  
  // Handle number (timestamp)
  if (typeof value === 'number') return new Date(value);

  // Handle ISO string
  if (value.includes('T') || value.includes('-')) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }

  // Handle PT-BR format (DD/MM/YYYY)
  if (value.includes('/')) {
    const parts = value.split(/[/\s]/);
    if (parts.length >= 3) {
      // Assuming DD/MM/YYYY
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
      const year = parseInt(parts[2], 10);
      
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}
