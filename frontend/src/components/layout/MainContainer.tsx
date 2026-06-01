import React from 'react';

interface MainContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const MainContainer = ({ children, className = '' }: MainContainerProps) => {
  return (
    <main className={`max-w-[430px] mx-auto px-6 pt-8 pb-32 min-h-[100dvh] ${className}`}>
      {children}
    </main>
  );
};
