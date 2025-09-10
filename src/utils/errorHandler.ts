import { toast } from "@/hooks/use-toast";

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: number;
  additionalData?: Record<string, any>;
}

export class EnhancedErrorHandler {
  private static instance: EnhancedErrorHandler;
  private errorQueue: Array<{ error: Error; context: ErrorContext; severity: ErrorSeverity }> = [];
  private maxQueueSize = 100;

  static getInstance(): EnhancedErrorHandler {
    if (!EnhancedErrorHandler.instance) {
      EnhancedErrorHandler.instance = new EnhancedErrorHandler();
    }
    return EnhancedErrorHandler.instance;
  }

  /**
   * Handle errors with context and appropriate user feedback
   */
  handleError(
    error: Error | string,
    severity: ErrorSeverity = 'medium',
    context: ErrorContext = {}
  ) {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const enhancedContext = {
      ...context,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Add to error queue
    this.addToQueue(errorObj, enhancedContext, severity);

    // Log to console with context
    console.error(`[${severity.toUpperCase()}] ${errorObj.message}`, {
      error: errorObj,
      context: enhancedContext,
      stack: errorObj.stack
    });

    // Show user-friendly feedback based on severity
    this.showUserFeedback(errorObj, severity, context);

    // Report critical errors
    if (severity === 'critical') {
      this.reportCriticalError(errorObj, enhancedContext);
    }
  }

  /**
   * Show appropriate user feedback based on error severity
   */
  private showUserFeedback(error: Error, severity: ErrorSeverity, context: ErrorContext) {
    const messages = {
      low: {
        title: "Minor Issue",
        description: this.getUserFriendlyMessage(error, context),
        duration: 3000
      },
      medium: {
        title: "Something went wrong",
        description: this.getUserFriendlyMessage(error, context),
        duration: 5000
      },
      high: {
        title: "Error occurred",
        description: this.getUserFriendlyMessage(error, context),
        duration: 7000
      },
      critical: {
        title: "Critical Error",
        description: "A serious error occurred. Please refresh the page and try again.",
        duration: 10000
      }
    };

    const message = messages[severity];
    const variant = severity === 'critical' || severity === 'high' ? 'destructive' : 'default';

    toast({
      title: message.title,
      description: message.description,
      duration: message.duration,
      variant: variant as any
    });
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private getUserFriendlyMessage(error: Error, context: ErrorContext): string {
    const errorMessage = error.message.toLowerCase();

    // SCP-087 specific errors
    if (context.component?.includes('SCP087')) {
      if (errorMessage.includes('encounter')) {
        return "Issue with SCP-087 encounter system. Exploration may be affected.";
      }
      if (errorMessage.includes('personnel')) {
        return "Problem with personnel management. Team status may be incorrect.";
      }
      if (errorMessage.includes('flashlight')) {
        return "Flashlight system malfunction. Check battery status.";
      }
    }

    // D-Class specific errors
    if (context.component?.includes('DClass')) {
      if (errorMessage.includes('recruitment')) {
        return "D-Class recruitment system error. Please try again.";
      }
      if (errorMessage.includes('assignment')) {
        return "Error assigning D-Class personnel. Check available inventory.";
      }
    }

    // Network errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return "Network connection issue. Please check your internet connection.";
    }

    // State management errors
    if (errorMessage.includes('state') || errorMessage.includes('store')) {
      return "Application state error. Some features may not work correctly.";
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return "Permission denied. Please check your access rights.";
    }

    // Fallback message
    return "An unexpected error occurred. If this persists, please refresh the page.";
  }

  /**
   * Add error to queue for analysis
   */
  private addToQueue(error: Error, context: ErrorContext, severity: ErrorSeverity) {
    this.errorQueue.push({ error, context, severity });
    
    // Trim queue if it gets too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }
  }

  /**
   * Report critical errors for monitoring
   */
  private reportCriticalError(error: Error, context: ErrorContext) {
    // In a production app, this would send to error monitoring service
    console.error('[CRITICAL ERROR REPORT]', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      timestamp: new Date().toISOString(),
      sessionInfo: {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        memory: (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize
        } : undefined
      }
    });
  }

  /**
   * Get error statistics for debugging
   */
  getErrorStats() {
    const severityCounts = this.errorQueue.reduce((acc, { severity }) => {
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    const componentCounts = this.errorQueue.reduce((acc, { context }) => {
      const component = context.component || 'unknown';
      acc[component] = (acc[component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: this.errorQueue.length,
      severityCounts,
      componentCounts,
      recentErrors: this.errorQueue.slice(-10)
    };
  }

  /**
   * Clear error queue
   */
  clearErrors() {
    this.errorQueue = [];
  }
}

// Global error handler instance
export const errorHandler = EnhancedErrorHandler.getInstance();

// Global error event listeners
window.addEventListener('error', (event) => {
  errorHandler.handleError(event.error || new Error(event.message), 'high', {
    component: 'Global',
    action: 'unhandled_error',
    additionalData: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }
  });
});

window.addEventListener('unhandledrejection', (event) => {
  errorHandler.handleError(
    new Error(`Unhandled Promise Rejection: ${event.reason}`),
    'high',
    {
      component: 'Global',
      action: 'unhandled_promise_rejection'
    }
  );
});