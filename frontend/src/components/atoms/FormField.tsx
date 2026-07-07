'use client';

import React from 'react';
import { Input } from '@/components/atoms/ui/input';
import type { LucideIcon } from 'lucide-react';

interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  required?: boolean;
}

export function FormField({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  icon: Icon,
  required,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white/80" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          className="h-14 rounded-2xl border-white/10 bg-white/5 pl-12 text-base placeholder:text-muted-foreground/40 backdrop-blur-xl focus-visible:ring-1 focus-visible:ring-primary/40"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      </div>
    </div>
  );
}
