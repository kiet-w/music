'use client';

import React from 'react';
import Link from 'next/link';
import { Music } from 'lucide-react';
import { MainContainer } from '@/components/templates/wrappers/MainContainer';

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
  return (
    <div className={`min-h-[100dvh] text-white ${gradientStyle}`}>
      <MainContainer className="flex flex-col justify-center py-12">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur-2xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Music className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground/80">{subtitle}</p>
          </div>

          {children}

          <footer className="pt-6 text-center text-sm">
            {footer}
          </footer>
        </div>
      </MainContainer>
    </div>
  );
}
