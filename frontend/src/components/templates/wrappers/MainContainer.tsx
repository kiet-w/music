import { cn } from '@/lib/utils';

interface MainContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const MainContainer = ({ children, className = '' }: MainContainerProps) => {
  return (
    <main className={cn("w-full max-w-[360px] mx-auto px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(160px+env(safe-area-inset-bottom))] min-h-[100dvh] relative overflow-x-hidden", className)}>
      {children}
    </main>
  );
};
