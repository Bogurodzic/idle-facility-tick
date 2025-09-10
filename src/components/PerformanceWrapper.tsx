import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { errorHandler } from '@/utils/errorHandler';

interface PerformanceWrapperProps {
  children: React.ReactNode;
  componentName: string;
  fallback?: React.ReactNode;
}

export const PerformanceWrapper: React.FC<PerformanceWrapperProps> = ({
  children,
  componentName,
  fallback
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    errorHandler.handleError(error, 'high', {
      component: componentName,
      action: 'render_error',
      additionalData: errorInfo
    });
  };

  return (
    <ErrorBoundary fallback={fallback}>
      {/* Add performance monitoring in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-2 left-2 z-50 bg-black/80 text-green-400 text-xs p-1 rounded font-mono">
          {componentName}
        </div>
      )}
      {children}
    </ErrorBoundary>
  );
};