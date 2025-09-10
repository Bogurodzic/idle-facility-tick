import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MobileOptimizedContainerProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  scroll?: boolean;
}

export const MobileOptimizedContainer: React.FC<MobileOptimizedContainerProps> = ({
  children,
  className,
  padding = 'md',
  scroll = true
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div className={cn(
      "w-full",
      "min-h-0", // Prevent flex children from overflowing
      scroll && "overflow-auto",
      paddingClasses[padding],
      // Mobile-first responsive design
      "text-sm sm:text-base", // Smaller text on mobile
      "space-y-2 sm:space-y-4", // Reduced spacing on mobile
      className
    )}>
      {children}
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: 'sm' | 'md' | 'lg';
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md'
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  const gridClasses = `grid-cols-${cols.mobile} sm:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop}`;

  return (
    <div className={cn(
      "grid",
      gridClasses,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
};

interface MobileTerminalProps {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const MobileTerminal: React.FC<MobileTerminalProps> = ({
  children,
  className,
  compact = false
}) => {
  return (
    <div className={cn(
      "relative",
      "bg-black/90 backdrop-blur-sm",
      "border border-terminal-green/30",
      "font-mono",
      // Mobile optimizations
      compact ? "text-xs" : "text-xs sm:text-sm",
      "p-2 sm:p-4",
      "rounded-none sm:rounded-lg", // No border radius on mobile
      "min-h-0 max-h-[70vh] overflow-auto", // Prevent terminal from taking full height on mobile
      // Scrollbar styling
      "scrollbar-thin scrollbar-track-black/20 scrollbar-thumb-terminal-green/50",
      className
    )}>
      {/* Mobile performance indicator */}
      <div className="absolute top-1 right-1 w-1 h-1 bg-terminal-green rounded-full animate-pulse sm:hidden" />
      
      {children}
    </div>
  );
};

interface TouchOptimizedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'ghost';
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-8 px-2 text-xs min-w-[2rem]',
    md: 'h-10 px-3 text-sm min-w-[2.5rem] sm:h-12 sm:px-4',
    lg: 'h-12 px-4 text-base min-w-[3rem] sm:h-14 sm:px-6'
  };

  return (
    <Button
      onClick={onClick}
      variant={variant}
      disabled={disabled}
      className={cn(
        sizeClasses[size],
        "font-mono",
        "touch-manipulation", // Optimizes for touch devices
        "select-none", // Prevent text selection on mobile
        "active:scale-95 transition-transform", // Touch feedback
        "min-h-[44px] sm:min-h-[auto]", // Minimum touch target size
        className
      )}
    >
      {children}
    </Button>
  );
};

/**
 * Hook to detect mobile devices and adjust UI accordingly
 */
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isTouch, setIsTouch] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsMobile(mobile);
      setIsTouch(touch);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, isTouch };
};