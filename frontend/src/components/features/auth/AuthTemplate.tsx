'use client';

import React from 'react';
import Link from 'next/link';
import { Music } from 'lucide-react';
import { MainContainer } from '@/components/templates/wrappers/MainContainer';
import { useKeyboardMode } from '@/hooks/useKeyboardMode';

interface AuthTemplateProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  gradientStyle: string;
}

// ponytail: unified auth layout container with rounded-[2.5rem] extreme corner radii
export function AuthTemplate({
  title,
  subtitle,
  children,
  footer,
  gradientStyle
}: AuthTemplateProps) {
  useKeyboardMode('none');
  return (
    <MainContainer className="flex flex-col justify-center text-foreground">
      <div className="w-full max-w-[400px] mx-auto bg-card border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative">
        <div className="mb-8 flex flex-col gap-2 items-start text-left">
          <h1 className="font-instrument text-4xl sm:text-5xl tracking-tighter leading-none text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">{subtitle}</p>
        </div>

        {children}

        <footer className="pt-6 text-left text-sm border-t border-white/5 mt-6">
          {footer}
        </footer>
      </div>
    </MainContainer>
  );
}

