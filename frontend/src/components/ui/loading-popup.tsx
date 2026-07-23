import React from 'react';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';

interface LoadingPopupProps {
  isOpen: boolean;
  text?: string;
}

export function LoadingPopup({ isOpen, text }: LoadingPopupProps) {
  if (!isOpen) return null;
  return <GlobalLoading fullScreen message={text} />;
}
