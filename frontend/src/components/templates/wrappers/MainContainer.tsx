import { cn } from '@/lib/utils';

interface MainContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const MainContainer = ({ children, className = '' }: MainContainerProps) => {
  return (
    <main className={cn("relative z-0 w-full max-w-md mx-auto px-5 sm:px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(110px+env(safe-area-inset-bottom))] h-[100dvh] overflow-y-auto overflow-x-hidden scrollbar-hide", className)}>
      {children}
    </main>
  );
};
