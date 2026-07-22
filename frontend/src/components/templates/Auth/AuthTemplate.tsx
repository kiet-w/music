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

export function AuthTemplate({
  title,
  subtitle,
  children,
  footer,
  gradientStyle
}: AuthTemplateProps) {
  useKeyboardMode('none');
  return (
    <MainContainer className="flex flex-col justify-center py-12 text-foreground !pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="w-full max-w-[360px] mx-auto">
        <div className="mb-12 flex flex-col gap-2 items-start text-left">
          <h1 className="font-instrument text-5xl md:text-6xl tracking-tighter leading-none">{title}</h1>
          <p className="text-sm text-muted-foreground font-sans">{subtitle}</p>
        </div>

        {children}

        <footer className="pt-8 text-left text-sm">
          {footer}
        </footer>
      </div>
    </MainContainer>
  );
}
